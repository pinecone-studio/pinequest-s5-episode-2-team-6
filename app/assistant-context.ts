/** Retrieve the atlas notes that are relevant to one free-text question.
 *
 * The LLM gets the selected structure separately. Here we add a small number of
 * matching structures so questions such as "compare the rotator cuff muscles"
 * are grounded in the same reference notes the detail panel shows. */

import type {Atlas} from './anatomy';
import {describeStructure, findConcepts, findGroup} from './ai-assistant';
import type {AssistantReference} from './llm-types';

export function buildAssistantReferences(atlas: Atlas, question: string): AssistantReference[] {
  const references: AssistantReference[] = [];
  const seen = new Set<string>();

  const add = (name: string) => {
    if (references.length >= 6) return;
    const key = name.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    const brief = describeStructure(atlas, name);
    references.push({
      name: brief.name || name,
      latin: brief.latin || undefined,
      system: brief.system || undefined,
      overview: brief.overview || undefined,
      function: brief.function || undefined,
      nerve: brief.nerve || undefined,
    });
  };

  const group = findGroup(atlas, question);
  if (group) for (const member of group.members) add(member.name);
  for (const concept of findConcepts(atlas, question, 4)) add(concept.name);

  return references;
}
