import type {RomJoint, RomSide} from './muscle-map';

/** MediaPipe Pose landmark indices (BlazePose). */
export const LM = {
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
} as const;

export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface JointSample {
  joint: RomJoint;
  side: RomSide;
  /** Clinical-style flexion degrees: ~0 extended, higher = more flexed. */
  angleDeg: number;
  confidence: number;
}

function angleAtJoint(
  proximal: Landmark,
  joint: Landmark,
  distal: Landmark,
): number {
  const ux = proximal.x - joint.x;
  const uy = proximal.y - joint.y;
  const vx = distal.x - joint.x;
  const vy = distal.y - joint.y;
  const lu = Math.hypot(ux, uy);
  const lv = Math.hypot(vx, vy);
  if (lu < 1e-6 || lv < 1e-6) return NaN;
  const cos = Math.min(1, Math.max(-1, (ux * vx + uy * vy) / (lu * lv)));
  return (Math.acos(cos) * 180) / Math.PI;
}

export function elbowFlexionDeg(
  landmarks: Landmark[],
  side: RomSide,
): JointSample | null {
  const shoulder = landmarks[side === 'left' ? LM.leftShoulder : LM.rightShoulder];
  const elbow = landmarks[side === 'left' ? LM.leftElbow : LM.rightElbow];
  const wrist = landmarks[side === 'left' ? LM.leftWrist : LM.rightWrist];
  if (!shoulder || !elbow || !wrist) return null;
  const visibility = Math.min(
    shoulder.visibility ?? 1,
    elbow.visibility ?? 1,
    wrist.visibility ?? 1,
  );
  if (visibility < 0.35) return null;
  const interior = angleAtJoint(shoulder, elbow, wrist);
  if (!Number.isFinite(interior)) return null;
  // Straight arm ≈ 180° interior → 0° flexion; bent arm lowers interior → higher flexion.
  const flexion = Math.min(170, Math.max(0, 180 - interior));
  return {joint: 'elbow', side, angleDeg: flexion, confidence: visibility};
}

export interface RomTracker {
  min: number;
  max: number;
  current: number;
  samples: number;
}

export function createRomTracker(seed = 90): RomTracker {
  return {min: seed, max: seed, current: seed, samples: 0};
}

export function updateRomTracker(tracker: RomTracker, angleDeg: number): RomTracker {
  if (!Number.isFinite(angleDeg)) return tracker;
  if (tracker.samples === 0) {
    return {min: angleDeg, max: angleDeg, current: angleDeg, samples: 1};
  }
  return {
    min: Math.min(tracker.min, angleDeg),
    max: Math.max(tracker.max, angleDeg),
    current: angleDeg,
    samples: tracker.samples + 1,
  };
}

export function resetRomTracker(current = 90): RomTracker {
  return createRomTracker(current);
}
