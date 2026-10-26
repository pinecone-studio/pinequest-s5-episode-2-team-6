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
for(const side of ['Left','Right']){
 const ids=renalTerritory(atlas,side),parts=atlas.parts.filter(p=>ids.includes(p.id));assert.ok(ids.length>1);
 assert.ok(parts.some(p=>p.name===`${side} renal artery`));assert.ok(parts.some(p=>/segmental branch/i.test(p.name)));
 assert.ok(parts.every(p=>p.system==='arterial'&&p.name.toLowerCase().includes(`${side.toLowerCase()} renal artery`)));
 for(const id of renalTerritory(atlas,side==='Left'?'Right':'Left'))assert.deepEqual(perfusionTint({ids,flow:0},id),[0,0,0]);
 for(const p of atlas.parts.filter(p=>p.system!=='arterial'||/suprarenal/i.test(p.name)))assert.deepEqual(perfusionTint({ids,flow:0},p.id),[0,0,0]);
}
assert.deepEqual(renalTerritory({parts:[]},'Left'),[]);
console.log('Verified baseline, occlusion, analytical flow, monotonicity, invalid inputs, and bilateral supply mappings.');
const {Color}=await import('three');
for(const flow of [0,.5,1]){const color=new Color(renalColor(flow));assert.ok([color.r,color.g,color.b].every(v=>v>0&&v<=1));}
assert.equal(renalColor(-1),renalColor(0));assert.equal(renalColor(2),renalColor(1));assert.notEqual(renalColor(0),renalColor(1));
const preview={ids:['left','left-branch'],flow:0};
assert.ok(perfusionTint(preview,'left').some(v=>v>0));assert.deepEqual(perfusionTint(preview,'right'),[0,0,0]);
assert.deepEqual(perfusionTint(undefined,'left'),[0,0,0]);assert.notDeepEqual(perfusionTint(preview,'left'),perfusionTint({...preview,flow:1},'left'));
assert.deepEqual(perfusionTint(preview,'left-branch'),perfusionTint(preview,'left'));
