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
  elbowFlexionDeg,
  updateAngleFilter,
  type AngleFilter,
  type Landmark,
  type JointSample,
} from './joints';
import type {RomSide} from './muscle-map';

const WASM =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm';
const MODEL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

export type PoseFrameHandler = (payload: {
  landmarks: Landmark[];
  elbow: ReturnType<typeof elbowFlexionDeg>;
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
    private readonly onFrame: PoseFrameHandler,
    private readonly onError: (message: string) => void,
    private readonly onCameraReady?: () => void,
  ) {}

  async start() {
    if (this.running) return;
    try {
      // Camera first so the live feed can appear before the pose model finishes loading.
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

  /** Paint camera frames before pose model is ready. */
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
    const elbow = elbowFlexionDeg(landmarks, side);
    // HUD uses a calm angle; tracking logic smooths separately in RomPanel.
    let hudElbow = elbow;
    if (elbow) {
      const smoothed = updateAngleFilter(this.hudFilter, elbow.angleDeg, now);
      this.hudFilter = smoothed.filter;
      hudElbow = {...elbow, angleDeg: smoothed.angle};
    } else {
      this.hudFilter = createAngleFilter();
    }
    this.draw(landmarks, hudElbow, side);
    this.onFrame({landmarks, elbow, timestampMs: now});
  };

  private draw(landmarks: Landmark[], elbow: JointSample | null, side: RomSide) {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    const w = this.video.videoWidth || 640;
    const h = this.video.videoHeight || 480;
    if (this.canvas.width !== w) this.canvas.width = w;
    if (this.canvas.height !== h) this.canvas.height = h;

    // Composite mirrored camera + overlays onto one visible surface.
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
      this.drawElbowFeedback(ctx, landmarks, elbow, side, w, h);
    }
    ctx.restore();

    if (elbow) {
      this.drawElbowHud(ctx, elbow, w, h);
    }
  }

  private drawElbowFeedback(
    ctx: CanvasRenderingContext2D,
    landmarks: Landmark[],
    elbow: JointSample | null,
    side: RomSide,
    w: number,
    h: number,
  ) {
    const shoulder = landmarks[side === 'left' ? LM.leftShoulder : LM.rightShoulder];
    const joint = landmarks[side === 'left' ? LM.leftElbow : LM.rightElbow];
    const wrist = landmarks[side === 'left' ? LM.leftWrist : LM.rightWrist];
    if (!shoulder || !joint || !wrist) return;

    const sx = shoulder.x * w;
    const sy = shoulder.y * h;
    const ex = joint.x * w;
    const ey = joint.y * h;
    const wx = wrist.x * w;
    const wy = wrist.y * h;

    const flexing = !!elbow && elbow.angleDeg >= FLEXION_FEEDBACK_DEG;
    const line = flexing ? '#ff6b4a' : '#3ecfba';
    const glow = flexing ? '#ff6b4a66' : '#3ecfba55';

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.strokeStyle = glow;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.lineTo(wx, wy);
    ctx.stroke();

    ctx.strokeStyle = line;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.lineTo(wx, wy);
    ctx.stroke();

    for (const [x, y, r] of [
      [sx, sy, 6],
      [ex, ey, 8],
      [wx, wy, 6],
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

    const aShoulder = Math.atan2(sy - ey, sx - ex);
    const aWrist = Math.atan2(wy - ey, wx - ex);
    let start = aShoulder;
    let end = aWrist;
    let delta = end - start;
    while (delta <= -Math.PI) delta += Math.PI * 2;
    while (delta > Math.PI) delta -= Math.PI * 2;
    end = start + delta;

    const radius = Math.min(48, Math.hypot(sx - ex, sy - ey) * 0.35);
    ctx.beginPath();
    ctx.strokeStyle = flexing ? '#ffd2c4' : '#b8fff3';
    ctx.lineWidth = 3;
    ctx.arc(ex, ey, radius, start, end, delta < 0);
    ctx.stroke();
  }

  private drawElbowHud(
    ctx: CanvasRenderingContext2D,
    elbow: JointSample,
    w: number,
    _h: number,
  ) {
    const flexing = elbow.angleDeg >= FLEXION_FEEDBACK_DEG;
    const pad = 12;
    const boxW = flexing ? 168 : 112;
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
    ctx.fillText(`${Math.round(elbow.angleDeg)}°`, x + 12, flexing ? y + 20 : y + boxH / 2);

    if (flexing) {
      ctx.fillStyle = '#ff8f6e';
      ctx.font = '700 11px ui-sans-serif, system-ui, sans-serif';
      ctx.fillText('FLEXION DETECTED', x + 12, y + 40);
    } else {
      ctx.fillStyle = '#9eb0bd';
      ctx.font = '600 11px ui-sans-serif, system-ui, sans-serif';
      ctx.fillText('elbow', x + 70, y + boxH / 2);
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
