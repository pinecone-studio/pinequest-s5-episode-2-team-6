import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renalFlow,renalTerritory} from '../app/plaque-model.ts';
assert.equal(renalFlow(0,20).flow,1);assert.equal(renalFlow(100,20).flow,0);assert.equal(renalFlow(50,0).flow,1);
assert.ok(Math.abs(renalFlow(50,20).flow-10/13)<1e-12);
for(let n=1;n<=100;n++)assert.ok(renalFlow(n,20).flow<renalFlow(n-1,20).flow);
assert.ok(renalFlow(60,40).flow<renalFlow(60,10).flow);
for(const [n,l] of [[-1,20],[101,20],[NaN,20],[50,Infinity],[50,-1]])assert.throws(()=>renalFlow(n,l),RangeError);
const atlas=JSON.parse(fs.readFileSync(new URL('../public/models/atlas.json',import.meta.url),'utf8'));
for(const side of ['Left','Right']){const ids=renalTerritory(atlas,side);assert.equal(ids.length,2);assert.ok(ids.every(id=>atlas.parts.find(p=>p.id===id).name.startsWith(side)));}
console.log('Verified baseline, occlusion, analytical flow, monotonicity, invalid inputs, and bilateral supply mappings.');
