/** Educational joint → muscle maps from Limb Movements Muscles ROM reference. */

export type RomJoint = 'elbow' | 'shoulder';
export type RomSide = 'left' | 'right';
/** Tracked elevation plane for shoulder (auto resolves to one of these). */
export type ShoulderMotion = 'auto' | 'flexion' | 'abduction';
export type RomMotion = 'flexion' | 'abduction';
/** @deprecated use RomMotion / rising vs lowering phases */
export type RomProtocol = 'flexion' | 'extension';

export interface MuscleRoleMap {
  /** Prime movers (+ key assistants present in the atlas). */
  agonists: string[];
  /** Opposing group for the return motion. */
  antagonists: string[];
}

export interface MotionRomInfo {
  muscles: MuscleRoleMap;
  agonistLabel: string;
  antagonistLabel: string;
  /** Rising-motion normative max (degrees). */
  maxRom: number;
  /** Opposite-direction normative max from anatomical position. */
  oppositeMax: number;
  risingName: string;
  loweringName: string;
  tip: string;
}

export interface JointRomInfo {
  title: string;
  anatomy: string;
  /** Default motion map (elbow flexion, or shoulder flexion). */
  muscles: MuscleRoleMap;
  flexorLabel: string;
  extensorLabel: string;
  normative: {min: number; max: number; label: string};
  contextBones: string[];
  trackerSeed: number;
  motions?: Partial<Record<RomMotion, MotionRomInfo>>;
}

/**
 * Reference: Limb Movements Muscles ROM.pdf — glenohumeral + elbow tables.
 * Latissimus dorsi has no discrete mesh in BodyParts3D here; listed assistants fill in.
 */
export const JOINT_ROM: Record<RomJoint, JointRomInfo> = {
  elbow: {
    title: 'Elbow ROM lab',
    anatomy: 'Elbow (humeroulnar / humeroradial)',
    muscles: {
      // PDF: brachialis + biceps prime; brachioradialis assists. Extension: triceps + anconeus.
      agonists: ['brachialis', 'biceps brachii', 'brachioradialis'],
      antagonists: ['triceps brachii', 'anconeus'],
    },
    flexorLabel: 'Brachialis · biceps brachii (+ brachioradialis)',
    extensorLabel: 'Triceps brachii · anconeus',
    normative: {
      min: 0,
      max: 150,
      label: 'Elbow flexion 0–150° (ext. to 0°; some 5–10° hyperextension)',
    },
    contextBones: ['humerus', 'radius', 'ulna'],
    trackerSeed: 90,
  },
  shoulder: {
    title: 'Shoulder ROM lab',
    anatomy: 'Shoulder complex (glenohumeral + scapulothoracic)',
    muscles: {
      agonists: [
        'clavicular part+deltoid',
        'clavicular part+pectoralis major',
        'coracobrachialis',
        'biceps brachii',
      ],
      antagonists: [
        'spinal part+deltoid',
        'teres major',
        'long head+triceps brachii',
      ],
    },
    flexorLabel:
      'Anterior deltoid · clavicular pec. major (+ coracobrachialis · biceps)',
    extensorLabel:
      'Posterior deltoid · latissimus* · teres major · triceps (long head)',
    normative: {
      min: 0,
      max: 180,
      label: 'Shoulder flexion 0–180° / extension 0–60° (complex elevation)',
    },
    contextBones: ['humerus', 'scapula', 'clavicle'],
    trackerSeed: 40,
    motions: {
      flexion: {
        muscles: {
          agonists: [
            'clavicular part+deltoid',
            'clavicular part+pectoralis major',
            'coracobrachialis',
            'biceps brachii',
          ],
          antagonists: [
            'spinal part+deltoid',
            'teres major',
            'long head+triceps brachii',
          ],
        },
        agonistLabel:
          'Anterior deltoid · clavicular pec. major (+ coracobrachialis · biceps)',
        antagonistLabel:
          'Posterior deltoid · latissimus* · teres major · triceps long head',
        maxRom: 180,
        oppositeMax: 60,
        risingName: 'Flexion',
        loweringName: 'Extension',
        tip: 'Turn side-on to the camera and raise the arm forward.',
      },
      abduction: {
        muscles: {
          agonists: ['acromial part+deltoid', 'supraspinatus'],
          antagonists: [
            'pectoralis major',
            'teres major',
            'coracobrachialis',
          ],
        },
        agonistLabel: 'Middle deltoid · supraspinatus',
        antagonistLabel: 'Pectoralis major · latissimus* · teres major · coracobrachialis',
        maxRom: 180,
        oppositeMax: 45,
        risingName: 'Abduction',
        loweringName: 'Adduction',
        tip: 'Face the camera and raise the arm out to the side.',
      },
    },
  },
};

export const ELBOW_MUSCLES = JOINT_ROM.elbow.muscles;
export const NORMATIVE_ROM: Record<
  RomJoint,
  {min: number; max: number; label: string}
> = {
  elbow: JOINT_ROM.elbow.normative,
  shoulder: JOINT_ROM.shoulder.normative,
};

export const ELBOW_FLEXOR_LABEL = JOINT_ROM.elbow.flexorLabel;
export const ELBOW_EXTENSOR_LABEL = JOINT_ROM.elbow.extensorLabel;
export const SHOULDER_FLEXOR_LABEL = JOINT_ROM.shoulder.flexorLabel;
export const SHOULDER_EXTENSOR_LABEL = JOINT_ROM.shoulder.extensorLabel;

export const ROM_JOINTS: RomJoint[] = ['elbow', 'shoulder'];
export const SHOULDER_MOTIONS: ShoulderMotion[] = ['auto', 'flexion', 'abduction'];

export function shoulderMotionInfo(motion: RomMotion): MotionRomInfo {
  return JOINT_ROM.shoulder.motions![motion]!;
}

export function musclesFor(
  joint: RomJoint,
  motion: RomMotion = 'flexion',
): MuscleRoleMap {
  if (joint === 'shoulder') {
    return shoulderMotionInfo(motion).muscles;
  }
  return JOINT_ROM.elbow.muscles;
}

function matchesPattern(partNameLower: string, pattern: string): boolean {
  if (pattern.includes('+')) {
    return pattern
      .split('+')
      .map((p) => p.trim())
      .filter(Boolean)
      .every((p) => matchesPattern(partNameLower, p));
  }

  const p = pattern.toLowerCase();
  if (p === 'brachialis') {
    return (
      partNameLower.includes('brachialis') &&
      !partNameLower.includes('coracobrachialis')
    );
  }
  if (p === 'biceps brachii') {
    return partNameLower.includes('biceps brachii');
  }
  if (p === 'deltoid') {
    return partNameLower.includes('deltoid') && !partNameLower.includes('branch');
  }
  if (p === 'teres major') {
    return partNameLower.includes('teres major');
  }
  if (p === 'teres minor') {
    return partNameLower.includes('teres minor');
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

export function jointMuscleIds(
  partNames: {id: string; name: string}[],
  joint: RomJoint,
  side: RomSide,
  motion: RomMotion = 'flexion',
): {flexors: string[]; extensors: string[]} {
  const map = musclesFor(joint, motion);
  return {
    flexors: matchPartsForPatterns(partNames, map.agonists, side),
    extensors: matchPartsForPatterns(partNames, map.antagonists, side),
  };
}

/** Muscle + bone ids to isolate/frame on the atlas for one side. */
export function jointAtlasFocusIds(
  partNames: {id: string; name: string}[],
  joint: RomJoint,
  side: RomSide,
  motion: RomMotion = 'flexion',
): string[] {
  const motions: RomMotion[] =
    joint === 'shoulder' ? ['flexion', 'abduction'] : [motion];
  const muscleIds = new Set<string>();
  for (const m of motions) {
    const {flexors, extensors} = jointMuscleIds(partNames, joint, side, m);
    flexors.forEach((id) => muscleIds.add(id));
    extensors.forEach((id) => muscleIds.add(id));
  }
  // Include SITS helpers when framing the shoulder (PDF rotator-cuff note).
  if (joint === 'shoulder') {
    for (const id of matchPartsForPatterns(
      partNames,
      ['infraspinatus', 'teres minor', 'subscapularis'],
      side,
    )) {
      muscleIds.add(id);
    }
  }
  const bones = matchPartsForPatterns(
    partNames,
    JOINT_ROM[joint].contextBones,
    side,
  );
  return [...new Set([...muscleIds, ...bones])];
}

export function elbowAtlasFocusIds(
  partNames: {id: string; name: string}[],
  side: RomSide,
): string[] {
  return jointAtlasFocusIds(partNames, 'elbow', side);
}
