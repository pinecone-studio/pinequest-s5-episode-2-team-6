import type {RenalSite} from './plaque-model';
// Assumed teaching geometry, not measured atlas vessels. Units: mm, mmHg, Pa·s, kg/m³.
// ΔP = RQ + ρ/2·(Q/Athroat−Q/Abase)²; ideal expansion coefficient = 1, not a fitted stenosis model.
// Fluid assumptions: https://pmc.ncbi.nlm.nih.gov/articles/PMC6107783/ ; limitations: PMC8486142.
export const HEMO={diameters:[5,3,3,3],lengths:[100,60,60,60],viscosity:.0035,density:1066,outlet:5,bed:.5} as const;
export function renalHemodynamics(narrowing:number,length:number,site:RenalSite,inlet=100,geometry?:{diameter:number;vesselLength:number}){
 const selected=['main','superior','inferior','posterior'].indexOf(site),cv=1e-6/60,mmHg=133.322;
 if(selected<0||![narrowing,length,inlet].every(Number.isFinite)||narrowing<0||narrowing>100||length<5||length>60||inlet<60||inlet>180)throw new RangeError('Invalid teaching-circuit inputs');
 if(geometry&&(![geometry.diameter,geometry.vesselLength].every(Number.isFinite)||geometry.diameter<.5||geometry.diameter>30||geometry.vesselLength<length||geometry.vesselLength>200))throw new RangeError('Invalid assumed vessel geometry');
 const vessels=HEMO.diameters.map((diameter,i)=>{
  const d=(i===selected?geometry?.diameter??diameter:diameter)/1000,vesselLength=i===selected?geometry?.vesselLength??HEMO.lengths[i]:HEMO.lengths[i],throat=d*(i===selected?1-narrowing/100:1),segment=i===selected?length/1000:0,area=Math.PI*throat**2/4,baseArea=Math.PI*d*d/4;
  const resistance=throat===0?Infinity:128*HEMO.viscosity/Math.PI*((vesselLength/1000-segment)/d**4+segment/throat**4)*cv/mmHg;
  const loss=area===0?Infinity:HEMO.density/2*(1/area-1/baseArea)**2*cv**2/mmHg;
  return {resistance,loss,area,baseArea};
 });
 const branchFlow=(pressure:number,index:number)=>{
  const {resistance,loss}=vessels[index],r=resistance+HEMO.bed,dp=pressure-HEMO.outlet;
  return !Number.isFinite(r)?0:2*dp/(r+Math.sqrt(r*r+4*loss*dp));
 };
 let low:number=HEMO.outlet,high=inlet;
 if(!Number.isFinite(vessels[0].resistance))high=low;
 else for(let i=0;i<60;i++){
  const p=(low+high)/2,total=[1,2,3].reduce((sum,index)=>sum+branchFlow(p,index),0),drop=vessels[0].resistance*total+vessels[0].loss*total*total;
  if(drop>inlet-p)high=p;else low=p;
 }
 const junction=(low+high)/2,branchFlows=[1,2,3].map(index=>branchFlow(junction,index)),totalFlow=branchFlows.reduce((a,b)=>a+b,0);
 const distalPressures=branchFlows.map(q=>HEMO.outlet+HEMO.bed*q),selectedFlow=selected===0?totalFlow:branchFlows[selected-1],vessel=vessels[selected];
 const upstream=selected===0?inlet:junction,downstream=selected===0?junction:distalPressures[selected-1];
 return {totalFlow,selectedFlow,branchFlows,distalPressures,junction,upstream,downstream,pressureDrop:upstream-downstream,velocity:vessel.area>0?selectedFlow*cv/vessel.area:null,upstreamVelocity:selectedFlow*cv/vessel.baseArea};
}
