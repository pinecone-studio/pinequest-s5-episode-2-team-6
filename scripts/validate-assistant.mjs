import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {register, registerHooks} from 'node:module';

const hooks = await import('./ts-resolver.mjs');
if (typeof registerHooks === 'function') registerHooks({resolve: hooks.resolve});
else register('./ts-resolver.mjs', import.meta.url);

const {askAtlas, describeStructure, findConcepts, nervePieces} = await import('../app/ai-assistant.ts');
const {resolveStructureFact} = await import('../app/structure-facts.ts');
const {LAYERS, MAX_PEEL, peelSummary, peeledSystems} = await import('../app/layers.ts');
const {QUIZ, QUIZ_LEVELS, QUIZ_TOPICS, dealQuiz, matching, quizFor} = await import('../app/quiz/questions.ts');
const {BONE_ATLAS, boneOverview} = await import('../app/bone-atlas.ts');
const {STRUCTURE_ATLAS, structureOverview} = await import('../app/structure-atlas.ts');
const {EXPLANATIONS, SYSTEMS, explanation} = await import('../app/anatomy.ts');

const atlas = JSON.parse(await readFile(new URL('../public/models/atlas.json', import.meta.url)));
const empty = {atlas, selection: null};
function mongolianText(english, translated, label) {
  assert.match(translated, /[А-Яа-яЁёӨөҮү]/, `missing Mongolian text: ${label}`);
  assert.notEqual(translated, english, `Mongolian text repeats the English: ${label}`);
}

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
assert.equal(reply.actions[0].topic, undefined);
reply = askAtlas('Гарын ясаар сорил өг', empty);
assert.equal(reply.actions[0].topic, 'bones');
reply = askAtlas('Зүрхний тест', empty);
assert.equal(reply.actions[0].topic, 'heart');
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

// A quiz request opens the quiz page.
reply = askAtlas('Quiz me on hand bones', empty);
assert.equal(reply.actions[0].kind, 'quiz');
assert.equal(reply.actions[0].topic, 'bones');
reply = askAtlas('Test me on the nerves of the arm', empty);
assert.equal(reply.actions[0].topic, 'nerves');

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

// Every quiz answer points at a real concept, and every question has a topic, a level and a unique id.
assert.equal(new Set(QUIZ.map(question => question.id)).size, QUIZ.length, 'quiz ids repeat');
for (const question of QUIZ) {
  assert.ok(findConcepts(atlas, question.concept, 1).length > 0, `quiz concept missing: ${question.concept}`);
  assert.ok(QUIZ_TOPICS.includes(question.topic), `quiz topic: ${question.id}`);
  assert.ok(QUIZ_LEVELS.includes(question.level), `quiz level: ${question.id}`);
  assert.ok(question.options.length >= 3);
  assert.equal(new Set(question.options).size, question.options.length, `quiz options repeat: ${question.id}`);
  assert.ok(question.answer >= 0 && question.answer < question.options.length);
  assert.ok(question.explain.length > 20);
}
// Saved results from before topics existed name the first twelve by position.
assert.deepEqual(QUIZ.slice(0, 3).map(question => question.concept), ['biceps brachii', 'triceps brachii', 'diaphragm']);
// Every topic has questions at every level, so any setup can deal a quiz.
for (const topic of QUIZ_TOPICS) for (const level of QUIZ_LEVELS) assert.ok(matching(QUIZ, topic, level).length > 0, `no ${topic} questions at level ${level}`);
// Translated questions are Mongolian, and their options keep the count and order of the English ones.
quizFor('mn').forEach((question, index) => {
  assert.equal(question.id, QUIZ[index].id);
  assert.equal(question.options.length, QUIZ[index].options.length, `quiz options mismatch: ${index}`);
  assert.equal(new Set(question.options).size, question.options.length, `Mongolian quiz options repeat: ${question.id}`);
  mongolianText(QUIZ[index].prompt, question.prompt, `quiz prompt ${question.id}`);
  mongolianText(QUIZ[index].explain, question.explain, `quiz explanation ${question.id}`);
});
// A dealt quiz has no repeats, shuffles each question's options as a permutation, and keeps sequences in order.
for (let round = 0; round < 50; round += 1) {
  const dealt = dealQuiz(QUIZ, 10);
  assert.equal(dealt.length, 10);
  assert.equal(new Set(dealt.map(card => card.id)).size, 10);
  for (const card of dealt) {
    const question = QUIZ.find(item => item.id === card.id);
    assert.deepEqual([...card.order].sort((a, b) => a - b), question.options.map((_, i) => i));
    if (question.keepOrder) assert.deepEqual(card.order, question.options.map((_, i) => i));
  }
  // Ten mixed questions over six topics never put more than two on one topic.
  const perTopic = new Map();
  for (const card of dealt) {
    const topic = QUIZ.find(item => item.id === card.id).topic;
    perTopic.set(topic, (perTopic.get(topic) ?? 0) + 1);
  }
  assert.equal(perTopic.size, QUIZ_TOPICS.length);
  assert.ok(Math.max(...perTopic.values()) <= 2);
}
// Asking for more than a pool holds deals the whole pool.
assert.equal(dealQuiz(matching(QUIZ, 'joints', 3), 20).length, matching(QUIZ, 'joints', 3).length);

// The detail panel has Mongolian text for every reference entry and explanation.
const mongolian = mongolianText;
for (const entry of BONE_ATLAS) mongolian(entry.overview, boneOverview(entry, 'mn'), `bone ${entry.id}`);
for (const entry of STRUCTURE_ATLAS) mongolian(entry.overview, structureOverview(entry, 'mn'), `structure ${entry.id}`);
for (const [name, text] of Object.entries(EXPLANATIONS)) mongolian(text, explanation(name, SYSTEMS[0].id, 'mn'), `explanation ${name}`);

console.log('Assistant replies, structure facts, layer peeling, quiz content and Mongolian detail text checks passed.');
