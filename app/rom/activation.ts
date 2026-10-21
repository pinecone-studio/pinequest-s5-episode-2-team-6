import {
  JOINT_PROTOCOLS,
  matchPartsForPatterns,
  type MuscleRoleMap,
  type RomJoint,
  type RomProtocol,
  type RomSide,
} from './muscle-map';

export interface ActivationFrame {
  /** partId → 0..1 contraction intensity */
  byPartId: Record<string, number>;
  agonistIds: string[];
  antagonistIds: string[];
  agonistLevel: number;
  antagonistLevel: number;
}

/**
 * Educational heuristic: rising flexion recruits agonists; lowering recruits antagonists.
 * Not EMG — for teaching visualization only.
 */
export function computeElbowActivation(
  parts: {id: string; name: string}[],
  side: RomSide,
  angleDeg: number,
  previousAngle: number | null,
  dtSec: number,
): ActivationFrame {
  const map: MuscleRoleMap = JOINT_PROTOCOLS.elbow.flexion;
  const agonistIds = matchPartsForPatterns(parts, map.agonists, side);
  const antagonistIds = matchPartsForPatterns(parts, map.antagonists, side);

  const velocity =
    previousAngle == null || dtSec <= 1e-3
      ? 0
      : (angleDeg - previousAngle) / dtSec;

  // Base tone from how flexed the elbow is (isometric component).
  const flexNorm = Math.min(1, Math.max(0, angleDeg / 140));
  let agonistLevel = 0.15 + flexNorm * 0.35;
  let antagonistLevel = 0.12 + (1 - flexNorm) * 0.25;

  // Concentric / eccentric bias from angular velocity (deg/s).
  if (velocity > 15) {
    agonistLevel = Math.min(1, agonistLevel + Math.min(0.55, velocity / 180));
    antagonistLevel *= 0.45;
  } else if (velocity < -15) {
    antagonistLevel = Math.min(1, antagonistLevel + Math.min(0.55, -velocity / 180));
    agonistLevel *= 0.55;
  }

  // End-range co-contraction cue.
  if (angleDeg > 125) agonistLevel = Math.min(1, agonistLevel + 0.15);
  if (angleDeg < 20) antagonistLevel = Math.min(1, antagonistLevel + 0.1);

  const byPartId: Record<string, number> = {};
  for (const id of agonistIds) byPartId[id] = agonistLevel;
  for (const id of antagonistIds) byPartId[id] = antagonistLevel;

  return {byPartId, agonistIds, antagonistIds, agonistLevel, antagonistLevel};
}

export function protocolLabel(joint: RomJoint, protocol: RomProtocol): string {
  if (joint === 'elbow' && protocol === 'flexion') return 'Elbow flexion';
  return `${joint} ${protocol}`;
}
