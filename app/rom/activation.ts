import {
  JOINT_ROM,
  jointAtlasFocusIds,
  matchPartsForPatterns,
  musclesFor,
  shoulderMotionInfo,
  type RomJoint,
  type RomMotion,
  type RomProtocol,
  type RomSide,
} from './muscle-map';

export type RomPhase = 'flexion' | 'extension' | 'hold';
/** @deprecated use RomPhase */
export type ElbowPhase = RomPhase;

export interface ActivationFrame {
  joint: RomJoint;
  motion: RomMotion;
  /** partId → 0..1 contraction intensity (muscles only). */
  byPartId: Record<string, number>;
  agonistIds: string[];
  antagonistIds: string[];
  agonistLevel: number;
  antagonistLevel: number;
  phase: RomPhase;
  activeIds: string[];
  focusIds: string[];
  risingName: string;
  loweringName: string;
  agonistLabel: string;
  antagonistLabel: string;
  maxRom: number;
}

const ENTER_FLEX_VEL = 36;
const ENTER_EXT_VEL = -36;
const EXIT_VEL = 16;

function muscleGroups(
  parts: {id: string; name: string}[],
  joint: RomJoint,
  side: RomSide,
  motion: RomMotion,
) {
  const map = musclesFor(joint, motion);
  return {
    agonistIds: matchPartsForPatterns(parts, map.agonists, side),
    antagonistIds: matchPartsForPatterns(parts, map.antagonists, side),
    focusIds: jointAtlasFocusIds(parts, joint, side, motion),
  };
}

function labels(joint: RomJoint, motion: RomMotion) {
  if (joint === 'shoulder') {
    const info = shoulderMotionInfo(motion);
    return {
      risingName: info.risingName,
      loweringName: info.loweringName,
      agonistLabel: info.agonistLabel,
      antagonistLabel: info.antagonistLabel,
      maxRom: info.maxRom,
    };
  }
  return {
    risingName: 'Flexion',
    loweringName: 'Extension',
    agonistLabel: JOINT_ROM.elbow.flexorLabel,
    antagonistLabel: JOINT_ROM.elbow.extensorLabel,
    maxRom: JOINT_ROM.elbow.normative.max,
  };
}

function resolvePhase(
  velocity: number,
  angleDeg: number,
  previous: RomPhase,
  maxRom: number,
): RomPhase {
  if (velocity >= ENTER_FLEX_VEL) return 'flexion';
  if (velocity <= ENTER_EXT_VEL) return 'extension';
  if (previous === 'flexion' && velocity > -EXIT_VEL) return 'flexion';
  if (previous === 'extension' && velocity < EXIT_VEL) return 'extension';
  if (angleDeg >= maxRom * 0.72) return 'flexion';
  if (angleDeg <= maxRom * 0.18) return 'extension';
  return 'hold';
}

function smoothLevel(previous: number | undefined, next: number): number {
  if (previous == null) return next;
  return previous + 0.22 * (next - previous);
}

export function idleJointActivation(
  parts: {id: string; name: string}[],
  joint: RomJoint,
  side: RomSide,
  motion: RomMotion = 'flexion',
): ActivationFrame {
  const {agonistIds, antagonistIds, focusIds} = muscleGroups(
    parts,
    joint,
    side,
    motion,
  );
  const meta = labels(joint, motion);
  const byPartId: Record<string, number> = {};
  for (const id of agonistIds) byPartId[id] = 0.2;
  for (const id of antagonistIds) byPartId[id] = 0.2;
  return {
    joint,
    motion,
    byPartId,
    agonistIds,
    antagonistIds,
    agonistLevel: 0.2,
    antagonistLevel: 0.2,
    phase: 'hold',
    activeIds: [...agonistIds, ...antagonistIds],
    focusIds,
    ...meta,
  };
}

export function idleElbowActivation(
  parts: {id: string; name: string}[],
  side: RomSide,
): ActivationFrame {
  return idleJointActivation(parts, 'elbow', side, 'flexion');
}

export function computeJointActivation(
  parts: {id: string; name: string}[],
  joint: RomJoint,
  side: RomSide,
  angleDeg: number,
  velocityDegPerSec: number,
  previousPhase: RomPhase,
  previousLevels?: {agonist: number; antagonist: number},
  motion: RomMotion = 'flexion',
): ActivationFrame {
  const {agonistIds, antagonistIds, focusIds} = muscleGroups(
    parts,
    joint,
    side,
    motion,
  );
  const meta = labels(joint, motion);
  const phase = resolvePhase(
    velocityDegPerSec,
    angleDeg,
    previousPhase,
    meta.maxRom,
  );
  const flexNorm = Math.min(1, Math.max(0, angleDeg / meta.maxRom));

  let agonistTarget = 0;
  let antagonistTarget = 0;

  if (phase === 'flexion') {
    const drive = Math.max(0, velocityDegPerSec);
    agonistTarget = Math.min(1, 0.58 + Math.min(0.35, drive / 200));
    antagonistTarget = 0.08;
  } else if (phase === 'extension') {
    const drive = Math.max(0, -velocityDegPerSec);
    antagonistTarget = Math.min(1, 0.58 + Math.min(0.35, drive / 200));
    agonistTarget = 0.08;
  } else {
    agonistTarget = 0.18 + flexNorm * 0.42;
    antagonistTarget = 0.18 + (1 - flexNorm) * 0.38;
  }

  if (angleDeg > meta.maxRom * 0.85 && phase !== 'extension') {
    agonistTarget = Math.min(1, agonistTarget + 0.1);
  }
  if (angleDeg < meta.maxRom * 0.12 && phase !== 'flexion') {
    antagonistTarget = Math.min(1, antagonistTarget + 0.1);
  }

  const agonistLevel = smoothLevel(previousLevels?.agonist, agonistTarget);
  const antagonistLevel = smoothLevel(previousLevels?.antagonist, antagonistTarget);

  const byPartId: Record<string, number> = {};
  for (const id of agonistIds) byPartId[id] = agonistLevel;
  for (const id of antagonistIds) byPartId[id] = antagonistLevel;

  const activeIds =
    phase === 'extension'
      ? antagonistIds
      : phase === 'flexion'
        ? agonistIds
        : [...agonistIds, ...antagonistIds];

  return {
    joint,
    motion,
    byPartId,
    agonistIds,
    antagonistIds,
    agonistLevel,
    antagonistLevel,
    phase,
    activeIds,
    focusIds,
    ...meta,
  };
}

export function computeElbowActivation(
  parts: {id: string; name: string}[],
  side: RomSide,
  angleDeg: number,
  velocityDegPerSec: number,
  previousPhase: RomPhase,
  previousLevels?: {agonist: number; antagonist: number},
): ActivationFrame {
  return computeJointActivation(
    parts,
    'elbow',
    side,
    angleDeg,
    velocityDegPerSec,
    previousPhase,
    previousLevels,
    'flexion',
  );
}

export function protocolLabel(joint: RomJoint, protocol: RomProtocol): string {
  if (protocol === 'flexion') return `${joint} flexion`;
  if (protocol === 'extension') return `${joint} extension`;
  return `${joint} ${protocol}`;
}
