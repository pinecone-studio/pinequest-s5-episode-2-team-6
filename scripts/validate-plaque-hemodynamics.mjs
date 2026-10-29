import assert from 'node:assert/strict';
import {renalHemodynamics as solve,HEMO} from '../app/plaque-hemodynamics.ts';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`),cv=1e-6/60,mmHg=133.322;
const resistance=(d,l)=>128*HEMO.viscosity*(l/1000)/(Math.PI*(d/1000)**4)*cv/mmHg;
const baseline=solve(0,20,'main');near(baseline.totalFlow,95/(resistance(5,100)+(resistance(3,60)+HEMO.bed)/3));
assert.ok(solve(50,20,'main').velocity>baseline.velocity);assert.ok(solve(50,20,'main').totalFlow<baseline.totalFlow);
for(const site of ['main','superior','inferior','posterior'])for(const n of [0,25,50,75,99,100])for(const length of [5,20,60])for(const inlet of [60,100,180]){
 const h=solve(n,length,site,inlet);near(h.totalFlow,h.branchFlows.reduce((a,b)=>a+b,0));near(h.pressureDrop,h.upstream-h.downstream);
 assert.ok(h.branchFlows.every(q=>Number.isFinite(q)&&q>=0));assert.ok(h.downstream>=5&&h.upstream<=inlet&&h.downstream<=h.upstream);
 h.branchFlows.forEach((q,i)=>near(h.distalPressures[i],5+HEMO.bed*q));
 if(n<100){const d=site==='main'?.005:.003,l=site==='main'?.1:.06,throat=d*(1-n/100),area=Math.PI*throat**2/4,q=h.selectedFlow*cv;
  const viscous=128*HEMO.viscosity/Math.PI*((l-length/1000)/d**4+(length/1000)/throat**4)*q/mmHg,expansion=HEMO.density/2*(1/area-4/(Math.PI*d*d))**2*q*q/mmHg;near(h.pressureDrop,viscous+expansion);
 }
 if(n===100){assert.equal(h.selectedFlow,0);assert.equal(h.velocity,null);if(site==='main')assert.equal(h.totalFlow,0);else assert.ok(h.totalFlow>0);}
}
const branch=solve(75,20,'superior');assert.ok(branch.branchFlows[0]<baseline.branchFlows[0]);assert.ok(branch.branchFlows[1]>baseline.branchFlows[1]);
for(const args of [[-1,20,'main'],[101,20,'main'],[50,0,'main'],[50,61,'main'],[NaN,20,'main'],[50,20,'unknown'],[50,20,'main',59],[50,20,'main',181]])assert.throws(()=>solve(...args),RangeError);
console.log('Verified 216 circuit cases: analytical baseline, mass and pressure balance, SI units, boundary pressures, local speed versus total flow, redistribution, occlusion, and invalid inputs.');
