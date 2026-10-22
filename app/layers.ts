/** Depth layers used by the bottom dock "Layers" tool.
 *  Peeling walks from the outside in: skin, then muscle, then bone, then viscera,
 *  and stops with the vessels and nerves exposed. */

import type {SystemId} from './anatomy';

export interface AnatomyLayer {
  id: string;
  name: string;
  systems: SystemId[];
}

export const LAYERS: AnatomyLayer[] = [
  {id: 'surface', name: 'Body surface', systems: ['integumentary']},
  {id: 'muscles', name: 'Muscles', systems: ['muscular']},
  {id: 'frame', name: 'Skeleton', systems: ['skeletal', 'dental', 'connective']},
  {
    id: 'organs',
    name: 'Organs',
    systems: ['cardiac', 'respiratory', 'digestive', 'urinary', 'endocrine', 'reproductive', 'lymphatic', 'sensory'],
  },
  {id: 'deep', name: 'Vessels and nerves', systems: ['arterial', 'venous', 'nervous']},
];

/** Highest peel level that still leaves the deepest layer on screen. */
export const MAX_PEEL = LAYERS.length - 1;

/** Systems hidden at a peel level: level n removes the n outermost layers. */
export function peeledSystems(peel: number): Set<SystemId> {
  const hidden = new Set<SystemId>();
  const level = Math.max(0, Math.min(MAX_PEEL, Math.round(peel)));
  for (let index = 0; index < level; index += 1) {
    for (const system of LAYERS[index].systems) hidden.add(system);
  }
  return hidden;
}

/** Human readable summary of what a peel level has removed. */
export function peelSummary(peel: number): string {
  const level = Math.max(0, Math.min(MAX_PEEL, Math.round(peel)));
  if (level === 0) return 'Full body';
  const removed = LAYERS.slice(0, level).map(layer => layer.name.toLowerCase());
  return `Removed ${removed.join(', ')}`;
}

/** The deepest layer still visible at a peel level. */
export function peelLayerName(peel: number): string {
  const level = Math.max(0, Math.min(MAX_PEEL, Math.round(peel)));
  return LAYERS[Math.min(level, LAYERS.length - 1)].name;
}
