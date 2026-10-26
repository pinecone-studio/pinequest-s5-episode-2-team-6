import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renalColor,renalFlow,renalTerritory} from '../app/plaque-model.ts';
import {perfusionTint} from '../app/plaque-model.ts';
assert.equal(renalFlow(0,20).flow,1);assert.equal(renalFlow(100,20).flow,0);assert.equal(renalFlow(50,0).flow,1);
assert.ok(Math.abs(renalFlow(50,20).flow-10/13)<1e-12);
for(let n=1;n<=100;n++)assert.ok(renalFlow(n,20).flow<renalFlow(n-1,20).flow);
assert.ok(renalFlow(60,40).flow<renalFlow(60,10).flow);
for(const [n,l] of [[-1,20],[101,20],[NaN,20],[50,Infinity],[50,-1]])assert.throws(()=>renalFlow(n,l),RangeError);
const atlas=JSON.parse(fs.readFileSync(new URL('../public/models/atlas.json',import.meta.url),'utf8'));
for(const side of ['Left','Right']){const ids=renalTerritory(atlas,side);assert.equal(ids.length,2);assert.ok(ids.every(id=>atlas.parts.find(p=>p.id===id).name.startsWith(side)));}
console.log('Verified baseline, occlusion, analytical flow, monotonicity, invalid inputs, and bilateral supply mappings.');
const {Color}=await import('three');
for(const flow of [0,.5,1]){const color=new Color(renalColor(flow));assert.ok([color.r,color.g,color.b].every(v=>v>0&&v<=1));}
assert.equal(renalColor(-1),renalColor(0));assert.equal(renalColor(2),renalColor(1));assert.notEqual(renalColor(0),renalColor(1));
const preview={kidney:'left',flow:0};
assert.ok(perfusionTint(preview,'left').some(v=>v>0));assert.deepEqual(perfusionTint(preview,'right'),[0,0,0]);
assert.deepEqual(perfusionTint(undefined,'left'),[0,0,0]);assert.notDeepEqual(perfusionTint(preview,'left'),perfusionTint({...preview,flow:1},'left'));
