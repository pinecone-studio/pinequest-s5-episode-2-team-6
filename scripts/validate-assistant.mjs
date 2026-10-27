import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {register, registerHooks} from 'node:module';

const hooks = await import('./ts-resolver.mjs');
if (typeof registerHooks === 'function') registerHooks({resolve: hooks.resolve});
else register('./ts-resolver.mjs', import.meta.url);

const {askAtlas, describeStructure, findConcepts, nervePieces} = await import('../app/ai-assistant.ts');
const {resolveStructureFact} = await import('../app/structure-facts.ts');
const {LAYERS, MAX_PEEL, peelSummary, peeledSystems} = await import('../app/layers.ts');
const {QUIZ, TOURS} = await import('../app/learning-data.ts');
const {BONE_ATLAS, boneOverview} = await import('../app/bone-atlas.ts');
const {STRUCTURE_ATLAS, structureOverview} = await import('../app/structure-atlas.ts');
const {EXPLANATIONS, SYSTEMS, explanation} = await import('../app/anatomy.ts');

const atlas = JSON.parse(await readFile(new URL('../public/models/atlas.json', import.meta.url)));
const empty = {atlas, selection: null};

// A question about "this" needs something selected first.
let reply = askAtlas('What does this muscle do?', empty);
assert.match(reply.text, /tap a structure/i);
assert.equal(reply.actions.length, 0);

// Named groups highlight every member.
reply = askAtlas('Show me the rotator cuff', empty);
assert.equal(reply.actions[0].kind, 'highlight');
assert.equal(reply.actions[0].label, '4 бүтэц тодруулсан');
assert.ok(reply.actions[0].ids.length >= 4);

// Mongolian questions still drive the model actions.
reply = askAtlas('Мөрийг харуул', empty);
assert.equal(reply.actions[0].kind, 'highlight');
assert.ok(reply.actions[0].ids.length >= 4);
reply = askAtlas('Арын харагдац руу эргүүл', empty);
assert.equal(reply.actions[0].kind, 'view');
assert.equal(reply.actions[0].view, 'back');
reply = askAtlas('Сорил өг', empty);
assert.equal(reply.actions[0].kind, 'quiz');
reply = askAtlas('Аялал эхлүүл', empty);
assert.equal(reply.actions[0].kind, 'tour');
reply = askAtlas('Шошгыг нуу', empty);
assert.deepEqual(reply.actions[0], {kind: 'labels', on: false, label: 'Шошго унтраасан'});
reply = askAtlas('Шошго харуул', empty);
assert.deepEqual(reply.actions[0], {kind: 'labels', on: true, label: 'Шошго асаасан'});
// "Тайлбарла" is the verb "explain", not a request to show labels.
reply = askAtlas('Хиймэл оюун ухаан гэж юу вэ? Дэлгэрэнгүй тайлбарла', empty);
assert.equal(reply.actions.length, 0);

// Views rotate the model.
reply = askAtlas('Turn to the back view', empty);
assert.equal(reply.actions[0].kind, 'view');
assert.equal(reply.actions[0].view, 'back');

// Learning modes open the matching panel.
reply = askAtlas('Quiz me on hand bones', empty);
assert.equal(reply.actions[0].kind, 'quiz');
reply = askAtlas('Take me on a guided tour', empty);
assert.equal(reply.actions[0].kind, 'tour');

// Labels can be switched on and off.
reply = askAtlas('Show the floating labels', empty);
assert.deepEqual(reply.actions[0], {kind: 'labels', on: true, label: 'Шошго асаасан'});
reply = askAtlas('Hide the labels', empty);
assert.deepEqual(reply.actions[0], {kind: 'labels', on: false, label: 'Шошго унтраасан'});

// The selected structure answers function and nerve questions.
const biceps = {name: 'short head of right biceps brachii', system: 'muscular', conceptId: 'biceps', elements: []};
reply = askAtlas('What does this muscle do?', {atlas, selection: biceps});
assert.match(reply.text, /flexes the elbow/i);
assert.match(reply.text, /musculocutaneous/i);
assert.ok(reply.actions.some(action => action.kind === 'highlight'));

reply = askAtlas('Which nerve supplies it?', {atlas, selection: biceps});
assert.match(reply.text, /musculocutaneous/i);
assert.ok(reply.actions.some(action => action.label === 'Мэдрэлийг харуулах'));

// Mongolian function and nerve questions use the selected structure.
reply = askAtlas('Энэ булчин юу хийдэг вэ?', {atlas, selection: biceps});
assert.match(reply.text, /flexes the elbow/i);
assert.match(reply.text, /musculocutaneous/i);
reply = askAtlas('Ямар мэдрэл мэдрүүлдэг вэ?', {atlas, selection: biceps});
assert.match(reply.text, /musculocutaneous/i);
assert.ok(reply.actions.some(action => action.label === 'Мэдрэлийг харуулах'));

// Naming another structure overrides the current selection.
reply = askAtlas('What does the femur do?', {atlas, selection: biceps});
assert.match(reply.text, /longest bone/i);
assert.equal(reply.actions[0].kind, 'highlight');

// Unknown questions answer with guidance instead of guessing.
reply = askAtlas('xyzzy plugh', empty);
assert.match(reply.text, /could not match/i);
assert.equal(reply.actions.length, 0);

// Structure facts resolve by name and point at real nerve pieces.
const fact = resolveStructureFact('Left inferior oblique');
assert.equal(fact.id, 'extraocular');
assert.equal(resolveStructureFact('Right gastrocnemius').id, 'gastrocnemius');
assert.ok(nervePieces(atlas, fact.nerve).length > 0);
assert.ok(nervePieces(atlas, 'musculocutaneous nerve').length > 0);

// Descriptions resolve the system of a concept through its pieces.
const brief = describeStructure(atlas, 'heart');
assert.equal(brief.system, 'Heart');
assert.ok(brief.overview.length > 20);

// Layers peel from the outside in and always keep the deepest layer.
assert.equal(peeledSystems(0).size, 0);
assert.ok(peeledSystems(1).has('integumentary'));
assert.ok(!peeledSystems(1).has('muscular'));
assert.ok(peeledSystems(2).has('muscular'));
assert.ok(!peeledSystems(MAX_PEEL).has('nervous'));
assert.equal(peelSummary(0), 'Full body');
assert.ok(LAYERS.length > 2);

// Every tour stop and quiz answer points at a real concept.
for (const tour of TOURS) {
  for (const step of tour.steps) {
    assert.ok(findConcepts(atlas, step.concept, 1).length > 0, `tour step missing: ${step.concept}`);
  }
}
for (const question of QUIZ) {
  assert.ok(findConcepts(atlas, question.concept, 1).length > 0, `quiz concept missing: ${question.concept}`);
  assert.ok(question.options.length >= 3);
  assert.ok(question.answer >= 0 && question.answer < question.options.length);
  assert.ok(question.explain.length > 20);
}

// The detail panel has Mongolian text for every reference entry and explanation.
const mongolian = (english, translated, label) => {
  assert.match(translated, /[А-Яа-яЁёӨөҮү]/, `missing Mongolian text: ${label}`);
  assert.notEqual(translated, english, `Mongolian text repeats the English: ${label}`);
};
for (const entry of BONE_ATLAS) mongolian(entry.overview, boneOverview(entry, 'mn'), `bone ${entry.id}`);
for (const entry of STRUCTURE_ATLAS) mongolian(entry.overview, structureOverview(entry, 'mn'), `structure ${entry.id}`);
for (const [name, text] of Object.entries(EXPLANATIONS)) mongolian(text, explanation(name, SYSTEMS[0].id, 'mn'), `explanation ${name}`);

console.log('Assistant replies, structure facts, layer peeling, learning content and Mongolian detail text checks passed.');
