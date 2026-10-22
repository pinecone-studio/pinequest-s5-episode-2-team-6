import {
  FilesetResolver,
  PoseLandmarker,
  DrawingUtils,
  type NormalizedLandmark,
} from '@mediapipe/tasks-vision';
import {
  FLEXION_FEEDBACK_DEG,
  LM,
  createAngleFilter,
  sampleJointAngle,
  updateAngleFilter,
  type AngleFilter,
  type Landmark,
  type JointSample,
} from './joints';
import type {RomJoint, RomSide, ShoulderMotion} from './muscle-map';

const WASM =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm';
const MODEL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

export type PoseFrameHandler = (payload: {
  landmarks: Landmark[];
  sample: JointSample | null;
  timestampMs: number;
}) => void;

export class PoseSession {
  private landmarker: PoseLandmarker | null = null;
  private stream: MediaStream | null = null;
  private raf = 0;
  private lastVideoTime = -1;
  private running = false;
  private hudFilter: AngleFilter = createAngleFilter();

  constructor(
    private readonly video: HTMLVideoElement,
    private readonly canvas: HTMLCanvasElement,
    private readonly side: () => RomSide,
    private readonly joint: () => RomJoint,
    private readonly shoulderMotion: () => ShoulderMotion,
    private readonly onFrame: PoseFrameHandler,
    private readonly onError: (message: string) => void,
    private readonly onCameraReady?: () => void,
  ) {}

  async start() {
    if (this.running) return;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {facingMode: 'user', width: {ideal: 640}, height: {ideal: 480}},
        audio: false,
      });
      this.video.srcObject = this.stream;
      this.video.muted = true;
      this.video.playsInline = true;
      await this.video.play();
      this.running = true;
      this.onCameraReady?.();
      this.paintVideoOnly();
      this.raf = requestAnimationFrame(this.previewLoop);

      const vision = await FilesetResolver.forVisionTasks(WASM);
      this.landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {modelAssetPath: MODEL, delegate: 'GPU'},
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.6,
        minPosePresenceConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });
      cancelAnimationFrame(this.raf);
      this.loop();
    } catch (e) {
      this.stop();
      const message =
        e instanceof Error ? e.message : 'Could not start the camera / pose model.';
      this.onError(
        /NotAllowed|Permission/i.test(message)
          ? 'Camera permission was denied. Allow the webcam and try again.'
          : message,
      );
    }
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.landmarker?.close();
    this.landmarker = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.video.srcObject = null;
    this.hudFilter = createAngleFilter();
    const ctx = this.canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private previewLoop = () => {
    if (!this.running || this.landmarker) return;
    this.paintVideoOnly();
    this.raf = requestAnimationFrame(this.previewLoop);
  };

  private paintVideoOnly() {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    const w = this.video.videoWidth || 640;
    const h = this.video.videoHeight || 480;
    if (this.canvas.width !== w) this.canvas.width = w;
    if (this.canvas.height !== h) this.canvas.height = h;
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    if (this.video.readyState >= 2) {
      ctx.drawImage(this.video, 0, 0, w, h);
    } else {
      ctx.fillStyle = '#1a2430';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }

  private loop = () => {
    if (!this.running || !this.landmarker) return;
    this.raf = requestAnimationFrame(this.loop);
    if (this.video.readyState < 2) {
      this.paintVideoOnly();
      return;
    }
    const now = performance.now();
    if (this.video.currentTime === this.lastVideoTime) return;
    this.lastVideoTime = this.video.currentTime;

    const result = this.landmarker.detectForVideo(this.video, now);
    const landmarks = (result.landmarks[0] ?? []) as Landmark[];
    const side = this.side();
    const joint = this.joint();
    const sample = sampleJointAngle(
      landmarks,
      joint,
      side,
      this.shoulderMotion(),
    );
    let hudSample = sample;
    if (sample) {
      const smoothed = updateAngleFilter(this.hudFilter, sample.angleDeg, now);
      this.hudFilter = smoothed.filter;
      hudSample = {...sample, angleDeg: smoothed.angle};
    } else {
      this.hudFilter = createAngleFilter();
    }
    this.draw(landmarks, hudSample, side, joint);
    this.onFrame({landmarks, sample, timestampMs: now});
  };

  private draw(
    landmarks: Landmark[],
    sample: JointSample | null,
    side: RomSide,
    joint: RomJoint,
  ) {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    const w = this.video.videoWidth || 640;
    const h = this.video.videoHeight || 480;
    if (this.canvas.width !== w) this.canvas.width = w;
    if (this.canvas.height !== h) this.canvas.height = h;

    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(this.video, 0, 0, w, h);

    if (landmarks.length) {
      const utils = new DrawingUtils(ctx);
      const points = landmarks as NormalizedLandmark[];
      utils.drawConnectors(points, PoseLandmarker.POSE_CONNECTIONS, {
        color: '#ffffff55',
        lineWidth: 2,
      });
      utils.drawLandmarks(points, {radius: 2.5, color: '#ffffff88'});
      this.drawJointFeedback(ctx, landmarks, sample, side, joint, w, h);
    }
    ctx.restore();

    if (sample) {
      this.drawJointHud(ctx, sample, w);
    }
  }

  private drawJointFeedback(
    ctx: CanvasRenderingContext2D,
    landmarks: Landmark[],
    sample: JointSample | null,
    side: RomSide,
    joint: RomJoint,
    w: number,
    h: number,
  ) {
    const chain =
      joint === 'shoulder'
        ? [
            landmarks[side === 'left' ? LM.leftHip : LM.rightHip],
            landmarks[side === 'left' ? LM.leftShoulder : LM.rightShoulder],
            landmarks[side === 'left' ? LM.leftElbow : LM.rightElbow],
          ]
        : [
            landmarks[side === 'left' ? LM.leftShoulder : LM.rightShoulder],
            landmarks[side === 'left' ? LM.leftElbow : LM.rightElbow],
            landmarks[side === 'left' ? LM.leftWrist : LM.rightWrist],
          ];
    const [a, b, c] = chain;
    if (!a || !b || !c) return;

    const ax = a.x * w;
    const ay = a.y * h;
    const bx = b.x * w;
    const by = b.y * h;
    const cx = c.x * w;
    const cy = c.y * h;

    const threshold = FLEXION_FEEDBACK_DEG[joint];
    const flexing = !!sample && sample.angleDeg >= threshold;
    const line = flexing ? '#ff6b4a' : '#3ecfba';
    const glow = flexing ? '#ff6b4a66' : '#3ecfba55';

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.strokeStyle = glow;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.lineTo(cx, cy);
    ctx.stroke();

    ctx.strokeStyle = line;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.lineTo(cx, cy);
    ctx.stroke();

    for (const [x, y, r] of [
      [ax, ay, 6],
      [bx, by, 8],
      [cx, cy, 6],
    ] as const) {
      ctx.beginPath();
      ctx.fillStyle = line;
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = '#fff';
      ctx.arc(x, y, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }

    const a0 = Math.atan2(ay - by, ax - bx);
    const a1 = Math.atan2(cy - by, cx - bx);
    let start = a0;
    let end = a1;
    let delta = end - start;
    while (delta <= -Math.PI) delta += Math.PI * 2;
    while (delta > Math.PI) delta -= Math.PI * 2;
    end = start + delta;

    const radius = Math.min(48, Math.hypot(ax - bx, ay - by) * 0.35);
    ctx.beginPath();
    ctx.strokeStyle = flexing ? '#ffd2c4' : '#b8fff3';
    ctx.lineWidth = 3;
    ctx.arc(bx, by, radius, start, end, delta < 0);
    ctx.stroke();
  }

  private drawJointHud(
    ctx: CanvasRenderingContext2D,
    sample: JointSample,
    w: number,
  ) {
    const threshold = FLEXION_FEEDBACK_DEG[sample.joint];
    const flexing = sample.angleDeg >= threshold;
    const pad = 12;
    const boxW = flexing ? 168 : 120;
    const boxH = flexing ? 54 : 40;
    const x = w - boxW - pad;
    const y = pad;

    ctx.save();
    ctx.fillStyle = flexing ? '#2a1410ee' : '#101820cc';
    roundRect(ctx, x, y, boxW, boxH, 10);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = '700 20px ui-sans-serif, system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `${Math.round(sample.angleDeg)}°`,
      x + 12,
      flexing ? y + 20 : y + boxH / 2,
    );

    if (flexing) {
      ctx.fillStyle = '#ff8f6e';
      ctx.font = '700 11px ui-sans-serif, system-ui, sans-serif';
      ctx.fillText('FLEXION DETECTED', x + 12, y + 40);
    } else {
      ctx.fillStyle = '#9eb0bd';
      ctx.font = '600 11px ui-sans-serif, system-ui, sans-serif';
      ctx.fillText(sample.motion ?? sample.joint, x + 64, y + boxH / 2);
    }
    ctx.restore();
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
