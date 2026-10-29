import assert from 'node:assert/strict';
import fs from 'node:fs';
import {EDUCATION,ANATOMY_IDS,PREDICTION_STOPS,nextPrediction,anatomyId} from '../app/fracture/education.ts';
import {SLIP_START,HAND_CONTACT,FRACTURE_START,FALL_PHASES} from '../app/fracture/fall-model.ts';
assert.ok(PREDICTION_STOPS[0].at<SLIP_START);
assert.ok(PREDICTION_STOPS[1].at<HAND_CONTACT);
assert.ok(PREDICTION_STOPS[2].at>HAND_CONTACT&&PREDICTION_STOPS[2].at<FRACTURE_START);
assert.equal(nextPrediction(0,1,[]).id,'direction','Large seeks cannot skip the first prompt');
assert.equal(nextPrediction(.32,1,['direction']).id,'hand');
assert.equal(nextPrediction(.685,1,['direction','hand']).id,'outcome');
assert.equal(nextPrediction(0,1,PREDICTION_STOPS.map(p=>p.id)),undefined);
assert.equal(nextPrediction(.9,.1,[]),undefined,'Backward inspection does not trigger a prompt');
assert.equal(nextPrediction(.32,.32,[]).id,'direction','A paused boundary remains gated until continued');
for(const lang of ['en','mn']){
 const copy=EDUCATION[lang];
 for(const {id} of PREDICTION_STOPS){const q=copy.predictions[id];assert.ok(q.question&&q.explanation);assert.equal(q.options.length,3);assert.ok(q.correct>=0&&q.correct<q.options.length);}
 for(const {id} of FALL_PHASES){const stage=copy.stages[id];assert.ok(stage.observe&&stage.anatomy&&stage.takeaway);}
 for(const id of ANATOMY_IDS)assert.ok(copy.structures[id].name&&copy.structures[id].latin&&copy.structures[id].detail);
}
const atlas=JSON.parse(fs.readFileSync(new URL('../public/models/atlas.json',import.meta.url)));
assert.deepEqual([...new Set(atlas.parts.map(p=>anatomyId(p.name)).filter(Boolean))].sort(),[...ANATOMY_IDS].sort());
assert.equal(anatomyId('Left radius'),undefined);
assert.equal(anatomyId('Right radial artery'),undefined);
assert.equal(anatomyId('Distal phalanx of right thumb'),'hand');
console.log('Verified prediction order/boundaries/seek gating, bilingual questions, all five stage explanations, and six real right-sided anatomy mappings.');
