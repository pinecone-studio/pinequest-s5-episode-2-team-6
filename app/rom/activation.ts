import {
  ELBOW_MUSCLES,
  elbowAtlasFocusIds,
  matchPartsForPatterns,
  type RomJoint,
  type RomProtocol,
  type RomSide,
} from './muscle-map';

export type ElbowPhase = 'flexion' | 'extension' | 'hold';

export interface ActivationFrame {
  /** partId → 0..1 contraction intensity (muscles only). */
  byPartId: Record<string, number>;
  agonistIds: string[];
  antagonistIds: string[];
  agonistLevel: number;
  antagonistLevel: number;
  /** Which action is currently driving the highlight. */
  phase: ElbowPhase;
  /** Muscle ids that should read as “in use” right now. */
  activeIds: string[];
  /** Muscle + bone ids to isolate / frame on the atlas. */
  focusIds: string[];
}

/** Enter motion phases only with clear angular speed (deg/s). */
const ENTER_FLEX_VEL = 36;
const ENTER_EXT_VEL = -36;
/** Drop back to hold when motion settles. */
const EXIT_VEL = 16;

function muscleGroups(parts: {id: string; name: string}[], side: RomSide) {
  return {
    agonistIds: matchPartsForPatterns(parts, ELBOW_MUSCLES.agonists, side),
    antagonistIds: matchPartsForPatterns(parts, ELBOW_MUSCLES.antagonists, side),
    focusIds: elbowAtlasFocusIds(parts, side),
  };
}

function resolvePhase(
  velocity: number,
  angleDeg: number,
  previous: ElbowPhase,
): ElbowPhase {
  if (velocity >= ENTER_FLEX_VEL) return 'flexion';
  if (velocity <= ENTER_EXT_VEL) return 'extension';

  // Hysteresis: stay in the current motion phase until speed clearly drops.
  if (previous === 'flexion' && velocity > -EXIT_VEL) return 'flexion';
  if (previous === 'extension' && velocity < EXIT_VEL) return 'extension';

  // Posture-based hold — wide dead band so mid-range does not flicker.
  if (angleDeg >= 115) return 'flexion';
  if (angleDeg <= 28) return 'extension';
  return 'hold';
}

function smoothLevel(previous: number | undefined, next: number): number {
  if (previous == null) return next;
  return previous + 0.22 * (next - previous);
}

/** Baseline atlas focus before tracking — keeps elbow structures on screen. */
export function idleElbowActivation(
  parts: {id: string; name: string}[],
  side: RomSide,
): ActivationFrame {
  const {agonistIds, antagonistIds, focusIds} = muscleGroups(parts, side);
  const byPartId: Record<string, number> = {};
  for (const id of agonistIds) byPartId[id] = 0.2;
  for (const id of antagonistIds) byPartId[id] = 0.2;
  return {
    byPartId,
    agonistIds,
    antagonistIds,
    agonistLevel: 0.2,
    antagonistLevel: 0.2,
    phase: 'hold',
    activeIds: [...agonistIds, ...antagonistIds],
    focusIds,
  };
}

/**
 * Educational heuristic from clinical elbow ROM:
 *  - Flexion (0→145°): biceps brachii, brachialis, brachioradialis
 *  - Extension (145→0°): triceps brachii, anconeus
 * Not EMG — for teaching visualization only.
 */
export function computeElbowActivation(
  parts: {id: string; name: string}[],
  side: RomSide,
  angleDeg: number,
  velocityDegPerSec: number,
  previousPhase: ElbowPhase,
  previousLevels?: {agonist: number; antagonist: number},
): ActivationFrame {
  const {agonistIds, antagonistIds, focusIds} = muscleGroups(parts, side);
  const phase = resolvePhase(velocityDegPerSec, angleDeg, previousPhase);
  const flexNorm = Math.min(1, Math.max(0, angleDeg / 145));

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

  if (angleDeg > 125 && phase !== 'extension') {
    agonistTarget = Math.min(1, agonistTarget + 0.1);
  }
  if (angleDeg < 20 && phase !== 'flexion') {
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
    byPartId,
    agonistIds,
    antagonistIds,
    agonistLevel,
    antagonistLevel,
    phase,
    activeIds,
    focusIds,
  };
}

export function protocolLabel(joint: RomJoint, protocol: RomProtocol): string {
  if (joint === 'elbow' && protocol === 'flexion') return 'Elbow flexion';
  if (joint === 'elbow' && protocol === 'extension') return 'Elbow extension';
  return `${joint} ${protocol}`;
}
