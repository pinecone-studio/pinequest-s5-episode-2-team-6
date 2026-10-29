import assert from 'node:assert/strict';
import fs from 'node:fs';
import {registerHooks} from 'node:module';
import {resolve} from './ts-resolver.mjs';
registerHooks({resolve});
const {atlasCircuitSite}=await import('../app/atlas-circuit-model.ts');
const {renalHemodynamics:solve,HEMO}=await import('../app/plaque-hemodynamics.ts');
const {RENAL_SITES}=await import('../app/plaque-model.ts');
const atlas=JSON.parse(fs.readFileSync(new URL('../public/models/atlas.json',import.meta.url)));
for(const side of ['Left','Right'])for(const site of ['main','superior','inferior','posterior']){
 const parts=atlas.parts.filter(p=>p.conceptId===RENAL_SITES[side][site]);assert.ok(parts.length);
 for(const part of parts)assert.deepEqual(atlasCircuitSite(part),{side,site});
}
assert.equal(atlasCircuitSite(atlas.parts.find(p=>p.name==='Left femoral artery')),null);
assert.equal(atlasCircuitSite({system:'venous',conceptId:RENAL_SITES.Left.main,name:'Left renal artery'}),null);
for(const site of ['main','superior','inferior','posterior'])for(const diameter of [.5,3,30])for(const vesselLength of [5,60,200]){
 const length=Math.min(20,vesselLength),h=solve(50,length,site,100,{diameter,vesselLength});
 assert.ok(Number.isFinite(h.totalFlow)&&h.totalFlow>=0);assert.ok(h.downstream>=HEMO.outlet&&h.upstream<=100);
 assert.ok(Math.abs(h.totalFlow-h.branchFlows.reduce((a,b)=>a+b,0))<1e-7);
}
const cv=1e-6/60,r=(d,l)=>128*HEMO.viscosity*l/(Math.PI*d**4)*cv/133.322;
const custom=solve(0,20,'main',100,{diameter:4,vesselLength:80});
assert.ok(Math.abs(custom.totalFlow-95/(r(.004,.08)+(r(.003,.06)+HEMO.bed)/3))<1e-7,'Custom geometry must affect the physical circuit');
for(const geometry of [{diameter:0,vesselLength:100},{diameter:31,vesselLength:100},{diameter:5,vesselLength:10},{diameter:5,vesselLength:201},{diameter:NaN,vesselLength:100}])assert.throws(()=>solve(50,20,'main',100,geometry),RangeError);
console.log('Verified renal identity mapping, nonrenal fallback, editable geometry, circuit conservation, analytical units, and geometry limits.');
