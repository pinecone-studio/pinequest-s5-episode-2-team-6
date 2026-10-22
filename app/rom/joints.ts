import type {RomJoint, RomMotion, RomSide, ShoulderMotion} from './muscle-map';

/** MediaPipe Pose landmark indices (BlazePose). */
export const LM = {
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
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
  /** Elevation / flexion degrees from anatomical rest (~0 at side). */
  angleDeg: number;
  confidence: number;
  /** Effective shoulder plane after auto-resolve. */
  motion?: RomMotion;
}

/** Clear “raised” threshold for live camera feedback (degrees). */
export const FLEXION_FEEDBACK_DEG: Record<RomJoint, number> = {
  elbow: 30,
  shoulder: 35,
};

const MIN_VISIBILITY = 0.55;
const MIN_HIP_VISIBILITY = 0.35;

type Vec3 = {x: number; y: number; z: number};

function v3(a: Landmark, b: Landmark): Vec3 {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: (a.z ?? 0) - (b.z ?? 0),
  };
}

function midPoint(a: Landmark, b: Landmark): Landmark {
  return {
    x: (a.x + b.x) * 0.5,
    y: (a.y + b.y) * 0.5,
    z: ((a.z ?? 0) + (b.z ?? 0)) * 0.5,
    visibility: Math.min(a.visibility ?? 1, b.visibility ?? 1),
  };
}

function hypot3(v: Vec3): number {
  return Math.hypot(v.x, v.y, v.z);
}

function normalize(v: Vec3): Vec3 | null {
  const n = hypot3(v);
  if (n < 1e-6) return null;
  return {x: v.x / n, y: v.y / n, z: v.z / n};
}

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return {x: a.x - b.x, y: a.y - b.y, z: a.z - b.z};
}

function scale(v: Vec3, s: number): Vec3 {
  return {x: v.x * s, y: v.y * s, z: v.z * s};
}

function angleBetween(a: Vec3, b: Vec3): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return NaN;
  const cos = Math.min(1, Math.max(-1, dot(na, nb)));
  return (Math.acos(cos) * 180) / Math.PI;
}

function angleAtJoint2D(
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

function visibilityOf(...points: Landmark[]): number {
  return Math.min(...points.map((p) => p.visibility ?? 1));
}

export function elbowFlexionDeg(
  landmarks: Landmark[],
  side: RomSide,
): JointSample | null {
  const shoulder = landmarks[side === 'left' ? LM.leftShoulder : LM.rightShoulder];
  const elbow = landmarks[side === 'left' ? LM.leftElbow : LM.rightElbow];
  const wrist = landmarks[side === 'left' ? LM.leftWrist : LM.rightWrist];
  if (!shoulder || !elbow || !wrist) return null;
  const conf = visibilityOf(shoulder, elbow, wrist);
  if (conf < MIN_VISIBILITY) return null;
  const interior = angleAtJoint2D(shoulder, elbow, wrist);
  if (!Number.isFinite(interior)) return null;
  const flexion = Math.min(150, Math.max(0, 180 - interior));
  return {joint: 'elbow', side, angleDeg: flexion, confidence: conf, motion: 'flexion'};
}

/**
 * Sagittal-biased shoulder flexion (PDF: 0–180°).
 * Uses mid-hip torso reference and removes the across-shoulder component (3D).
 */
export function shoulderFlexionDeg(
  landmarks: Landmark[],
  side: RomSide,
): JointSample | null {
  const hipL = landmarks[LM.leftHip];
  const hipR = landmarks[LM.rightHip];
  const shL = landmarks[LM.leftShoulder];
  const shR = landmarks[LM.rightShoulder];
  const shoulder = side === 'left' ? shL : shR;
  const elbow = landmarks[side === 'left' ? LM.leftElbow : LM.rightElbow];
  if (!hipL || !hipR || !shL || !shR || !shoulder || !elbow) return null;

  const midHip = midPoint(hipL, hipR);
  const conf = Math.min(
    visibilityOf(shoulder, elbow),
    midHip.visibility ?? 1,
    Math.max(hipL.visibility ?? 0, hipR.visibility ?? 0),
  );
  if (conf < MIN_HIP_VISIBILITY || visibilityOf(shoulder, elbow) < MIN_VISIBILITY) {
    return null;
  }

  const across = normalize(v3(shR, shL));
  let toTorso = v3(midHip, shoulder); // shoulder → midHip (down the trunk)
  let toArm = v3(elbow, shoulder); // shoulder → elbow
  if (across) {
    toTorso = sub(toTorso, scale(across, dot(toTorso, across)));
    toArm = sub(toArm, scale(across, dot(toArm, across)));
  }

  const interior = angleBetween(toTorso, toArm);
  if (!Number.isFinite(interior)) return null;
  // Hanging arm aligned with torso ≈ 0° between inverted torso and arm... 
  // toTorso points down from shoulder; toArm points to elbow (down when hanging) → interior ~0
  // Wait: when hanging, both point roughly down → angle ~0 → flexion should be 0.
  // When arm flexed 90° forward, angle ~90. When overhead ~180.
  // So flexion = interior (NOT 180 - interior)!
  const flexion = Math.min(180, Math.max(0, interior));
  return {
    joint: 'shoulder',
    side,
    angleDeg: flexion,
    confidence: conf,
    motion: 'flexion',
  };
}

/**
 * Coronal shoulder abduction from vertical (PDF: 0–180°).
 * Best with a front-facing camera.
 */
export function shoulderAbductionDeg(
  landmarks: Landmark[],
  side: RomSide,
): JointSample | null {
  const shoulder = landmarks[side === 'left' ? LM.leftShoulder : LM.rightShoulder];
  const elbow = landmarks[side === 'left' ? LM.leftElbow : LM.rightElbow];
  if (!shoulder || !elbow) return null;
  const conf = visibilityOf(shoulder, elbow);
  if (conf < MIN_VISIBILITY) return null;

  // Image y increases downward — hanging arm aligns with +Y.
  const ax = elbow.x - shoulder.x;
  const ay = elbow.y - shoulder.y;
  const len = Math.hypot(ax, ay);
  if (len < 1e-6) return null;
  const cos = Math.min(1, Math.max(-1, ay / len));
  const abduction = Math.min(180, Math.max(0, (Math.acos(cos) * 180) / Math.PI));
  return {
    joint: 'shoulder',
    side,
    angleDeg: abduction,
    confidence: conf,
    motion: 'abduction',
  };
}

/** Pick flexion / abduction / auto for shoulder; elbow always flexion. */
export function sampleJointAngle(
  landmarks: Landmark[],
  joint: RomJoint,
  side: RomSide,
  shoulderMotion: ShoulderMotion = 'auto',
): JointSample | null {
  if (joint === 'elbow') return elbowFlexionDeg(landmarks, side);

  const flex = shoulderFlexionDeg(landmarks, side);
  const abd = shoulderAbductionDeg(landmarks, side);

  if (shoulderMotion === 'flexion') return flex;
  if (shoulderMotion === 'abduction') return abd;

  // Auto: prefer the clearer elevation plane for a webcam.
  if (!flex) return abd;
  if (!abd) return flex;

  const shoulder = landmarks[side === 'left' ? LM.leftShoulder : LM.rightShoulder]!;
  const elbow = landmarks[side === 'left' ? LM.leftElbow : LM.rightElbow]!;
  const lateral = Math.abs(elbow.x - shoulder.x);
  const depth = Math.abs((elbow.z ?? 0) - (shoulder.z ?? 0));

  // Front-camera side raise → lateral dominates → abduction.
  if (lateral > depth * 1.2 && abd.angleDeg >= flex.angleDeg - 12) {
    return abd;
  }
  // Side-on forward raise → depth / sagittal flexion.
  if (depth > lateral * 1.05 && flex.angleDeg >= abd.angleDeg - 12) {
    return flex;
  }
  // Otherwise take the larger elevation (more intentional raise).
  return flex.angleDeg >= abd.angleDeg ? flex : abd;
}

/** @deprecated use sampleJointAngle */
export function sampleJointFlexion(
  landmarks: Landmark[],
  joint: RomJoint,
  side: RomSide,
): JointSample | null {
  return sampleJointAngle(landmarks, joint, side, 'auto');
}

export interface AngleFilter {
  angle: number | null;
  velocity: number;
  lastTs: number | null;
}

export function createAngleFilter(): AngleFilter {
  return {angle: null, velocity: 0, lastTs: null};
}

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
  const alpha = Math.abs(delta) > 25 ? 0.28 : 0.12;
  const angle = filter.angle + alpha * delta;

  const instantVel = (angle - filter.angle) / dt;
  let velocity = filter.velocity + 0.14 * (instantVel - filter.velocity);
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
