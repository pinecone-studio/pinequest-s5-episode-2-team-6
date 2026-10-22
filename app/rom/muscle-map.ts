/** Educational joint → muscle name patterns matched against BodyParts3D part names. */

export type RomJoint = 'elbow';
export type RomSide = 'left' | 'right';
export type RomProtocol = 'flexion' | 'extension';

export interface MuscleRoleMap {
  /** Prime movers for the named protocol. */
  agonists: string[];
  /** Opposing group (shown during the opposite motion). */
  antagonists: string[];
}

/**
 * Elbow (humeroulnar / humeroradial) — teaching ROM map.
 * Flexion 0–145°: biceps brachii, brachialis, brachioradialis.
 * Extension 145–0° (hyperextension ~5–10°): triceps brachii, anconeus.
 */
export const ELBOW_MUSCLES: MuscleRoleMap = {
  agonists: ['biceps brachii', 'brachialis', 'brachioradialis'],
  antagonists: ['triceps brachii', 'anconeus'],
};

export const JOINT_PROTOCOLS: Record<
  RomJoint,
  Record<'flexion', MuscleRoleMap>
> = {
  elbow: {flexion: ELBOW_MUSCLES},
};

/** Approximate normative elbow flexion ROM (degrees) for UI reference only. */
export const NORMATIVE_ROM: Record<RomJoint, {min: number; max: number; label: string}> = {
  elbow: {
    min: 0,
    max: 145,
    label: 'Elbow flexion / extension (approx. normative 0–145°)',
  },
};

export const ELBOW_FLEXOR_LABEL =
  'Biceps brachii · brachialis · brachioradialis';
export const ELBOW_EXTENSOR_LABEL = 'Triceps brachii · anconeus';

function matchesPattern(partNameLower: string, pattern: string): boolean {
  const p = pattern.toLowerCase();
  // Avoid coracobrachialis when matching brachialis.
  if (p === 'brachialis') {
    return (
      partNameLower.includes('brachialis') &&
      !partNameLower.includes('coracobrachialis')
    );
  }
  // Avoid biceps femoris when matching arm flexors.
  if (p === 'biceps brachii') {
    return partNameLower.includes('biceps brachii');
  }
  return partNameLower.includes(p);
}

export function matchPartsForPatterns(
  partNames: {id: string; name: string}[],
  patterns: string[],
  side: RomSide,
): string[] {
  const sideToken = side === 'left' ? 'left' : 'right';
  const ids: string[] = [];
  for (const part of partNames) {
    const lower = part.name.toLowerCase();
    if (!lower.includes(sideToken)) continue;
    if (patterns.some((p) => matchesPattern(lower, p))) ids.push(part.id);
  }
  return ids;
}

/** Arm bones kept visible for context while ROM isolates the elbow. */
const ELBOW_CONTEXT_BONES = ['humerus', 'radius', 'ulna'];

export function elbowMuscleIds(
  partNames: {id: string; name: string}[],
  side: RomSide,
): {flexors: string[]; extensors: string[]} {
  return {
    flexors: matchPartsForPatterns(partNames, ELBOW_MUSCLES.agonists, side),
    extensors: matchPartsForPatterns(partNames, ELBOW_MUSCLES.antagonists, side),
  };
}

/** Muscle + bone ids to isolate/frame on the atlas for one arm. */
export function elbowAtlasFocusIds(
  partNames: {id: string; name: string}[],
  side: RomSide,
): string[] {
  const {flexors, extensors} = elbowMuscleIds(partNames, side);
  const bones = matchPartsForPatterns(partNames, ELBOW_CONTEXT_BONES, side);
  return [...new Set([...flexors, ...extensors, ...bones])];
}
