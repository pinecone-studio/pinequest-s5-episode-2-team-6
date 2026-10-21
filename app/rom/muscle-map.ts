/** Educational joint → muscle name patterns matched against BodyParts3D part names. */

export type RomJoint = 'elbow';
export type RomSide = 'left' | 'right';
export type RomProtocol = 'flexion';

export interface MuscleRoleMap {
  agonists: string[];
  antagonists: string[];
}

/** Substrings matched case-insensitively against atlas part names. */
export const ELBOW_MUSCLES: MuscleRoleMap = {
  agonists: ['biceps brachii', 'brachialis', 'brachioradialis'],
  antagonists: ['triceps brachii'],
};

export const JOINT_PROTOCOLS: Record<
  RomJoint,
  Record<RomProtocol, MuscleRoleMap>
> = {
  elbow: {flexion: ELBOW_MUSCLES},
};

/** Approximate normative elbow flexion ROM (degrees) for UI reference only. */
export const NORMATIVE_ROM: Record<RomJoint, {min: number; max: number; label: string}> = {
  elbow: {min: 0, max: 145, label: 'Elbow flexion (approx. normative)'},
};

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
    if (patterns.some((p) => lower.includes(p))) ids.push(part.id);
  }
  return ids;
}
