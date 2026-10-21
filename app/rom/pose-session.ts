import {FilesetResolver, PoseLandmarker, DrawingUtils, type NormalizedLandmark} from '@mediapipe/tasks-vision';
import {elbowFlexionDeg, type Landmark} from './joints';
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

  constructor(
    private readonly video: HTMLVideoElement,
    private readonly canvas: HTMLCanvasElement,
    private readonly side: () => RomSide,
    private readonly onFrame: PoseFrameHandler,
    private readonly onError: (message: string) => void,
  ) {}

  async start() {
    if (this.running) return;
    try {
      const vision = await FilesetResolver.forVisionTasks(WASM);
      this.landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {modelAssetPath: MODEL, delegate: 'GPU'},
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {facingMode: 'user', width: {ideal: 640}, height: {ideal: 480}},
        audio: false,
      });
      this.video.srcObject = this.stream;
      await this.video.play();
      this.running = true;
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
    const ctx = this.canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private loop = () => {
    if (!this.running || !this.landmarker) return;
    this.raf = requestAnimationFrame(this.loop);
    if (this.video.readyState < 2) return;
    const now = performance.now();
    if (this.video.currentTime === this.lastVideoTime) return;
    this.lastVideoTime = this.video.currentTime;

    const result = this.landmarker.detectForVideo(this.video, now);
    const landmarks = (result.landmarks[0] ?? []) as Landmark[];
    this.draw(landmarks);
    const elbow = elbowFlexionDeg(landmarks, this.side());
    this.onFrame({landmarks, elbow, timestampMs: now});
  };

  private draw(landmarks: Landmark[]) {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    const w = this.video.videoWidth || 640;
    const h = this.video.videoHeight || 480;
    this.canvas.width = w;
    this.canvas.height = h;
    // Selfie mirror for natural feedback.
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(this.video, 0, 0, w, h);
    if (landmarks.length) {
      const utils = new DrawingUtils(ctx);
      const points = landmarks as NormalizedLandmark[];
      utils.drawLandmarks(points, {radius: 3, color: '#3ecfba'});
      utils.drawConnectors(points, PoseLandmarker.POSE_CONNECTIONS, {
        color: '#263b48',
        lineWidth: 2,
      });
    }
    ctx.restore();
  }
}
