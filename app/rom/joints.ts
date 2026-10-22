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

/** Clear flexion threshold for live camera feedback (degrees). */
export const FLEXION_FEEDBACK_DEG = 30;

/** Minimum landmark visibility to accept a sample. */
const MIN_VISIBILITY = 0.55;

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
  if (visibility < MIN_VISIBILITY) return null;
  const interior = angleAtJoint(shoulder, elbow, wrist);
  if (!Number.isFinite(interior)) return null;
  // Straight arm ≈ 180° interior → 0° flexion; bent arm lowers interior → higher flexion.
  const flexion = Math.min(170, Math.max(0, 180 - interior));
  return {joint: 'elbow', side, angleDeg: flexion, confidence: visibility};
}

/** Temporal filter that calms MediaPipe jitter for angle + velocity. */
export interface AngleFilter {
  angle: number | null;
  velocity: number;
  lastTs: number | null;
}

export function createAngleFilter(): AngleFilter {
  return {angle: null, velocity: 0, lastTs: null};
}

/**
 * Heavy EMA on angle, lighter EMA on velocity, with a velocity dead-zone
 * so tiny landmark noise does not register as flexion/extension.
 */
export function updateAngleFilter(
  filter: AngleFilter,
  rawDeg: number,
  timestampMs: number,
): {filter: AngleFilter; angle: number; velocity: number} {
  if (!Number.isFinite(rawDeg)) {
    return {filter, angle: filter.angle ?? 0, velocity: filter.velocity};
  }

  if (filter.angle == null || filter.lastTs == null) {
    const next = {angle: rawDeg, velocity: 0, lastTs: timestampMs};
    return {filter: next, angle: rawDeg, velocity: 0};
  }

  const dt = Math.min(0.08, Math.max(0.02, (timestampMs - filter.lastTs) / 1000));
  const delta = rawDeg - filter.angle;
  // Strong smoothing; still follow real motion (slower alpha on small noise).
  const alpha = Math.abs(delta) > 25 ? 0.28 : 0.12;
  const angle = filter.angle + alpha * delta;

  const instantVel = (angle - filter.angle) / dt;
  let velocity = filter.velocity + 0.14 * (instantVel - filter.velocity);
  // Dead-zone: ignore slow wobble as "no motion".
  if (Math.abs(velocity) < 18) velocity *= 0.35;
  if (Math.abs(velocity) < 10) velocity = 0;

  const next = {angle, velocity, lastTs: timestampMs};
  return {filter: next, angle, velocity};
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

/** Update ROM range from a smoothed angle; ignores sub-degree noise for extrema. */
export function updateRomTracker(tracker: RomTracker, angleDeg: number): RomTracker {
  if (!Number.isFinite(angleDeg)) return tracker;
  if (tracker.samples === 0) {
    return {min: angleDeg, max: angleDeg, current: angleDeg, samples: 1};
  }
  const SLACK = 2;
  return {
    min: angleDeg < tracker.min - SLACK ? angleDeg : tracker.min,
    max: angleDeg > tracker.max + SLACK ? angleDeg : tracker.max,
    current: angleDeg,
    samples: tracker.samples + 1,
  };
}

export function resetRomTracker(current = 90): RomTracker {
  return createRomTracker(current);
}
