import type {Atlas} from './anatomy';
import {Color} from 'three';
export interface RenalPreview {ids:string[];flow:number;contextIds?:string[];affectedIds?:string[];lesionIds?:string[]}
export const RENAL_SITES={Left:{main:'FMA14753',superior:'FMA86341',inferior:'FMA86347',posterior:'FMA86349'},Right:{main:'FMA14752',superior:'FMA86340',inferior:'FMA86346',posterior:'FMA86348'}} as const;
export type RenalSite=keyof typeof RENAL_SITES.Left;
// BodyParts3D 4.0/FMA identity map; segmental anatomy/variation: https://pubmed.ncbi.nlm.nih.gov/24783063/
// These concepts do not establish tissue boundaries or direct branch origins; clinician review remains pending.
export const RENAL_TREE={Left:['FMA14753','FMA86341','FMA86347','FMA86349','FMA70487','FMA70490','FMA66364','FMA70493'],Right:['FMA14752','FMA86340','FMA86346','FMA86348','FMA70486','FMA70489','FMA66363','FMA70492']};
export const renalColor=(flow:number)=>`hsl(${10+Math.max(0,Math.min(1,flow))*150},40%,55%)`;
export function perfusionTint(preview:RenalPreview|undefined,id:string){
 if(!preview?.ids.includes(id))return [0,0,0];
 if(preview.affectedIds&&!preview.affectedIds.includes(id))return [0,0,0];
 if(preview.flow<1&&preview.lesionIds?.includes(id))return [232,191,98];
 const color=new Color(renalColor(preview.flow));
 return [color.r,color.g,color.b].map(value=>Math.round(value*255));
}
export function renalFlow(narrowing:number,length:number){
 if(!Number.isFinite(narrowing)||!Number.isFinite(length)||narrowing<0||narrowing>100||length<0||length>100)throw new RangeError('Invalid stenosis geometry');
 // Dimensionless teaching circuit: healthy artery R=1, distal bed R=9;
 // a length/100 fraction of a 100 mm artery has resistance proportional to r^-4.
 const radius=1-narrowing/100;
 const artery=length===0?1:radius===0?Infinity:1+length/100*(radius**-4-1);
 const flow=10/(9+artery);
 return {flow,arterialLoss:1-.9*flow};
}
export function renalTerritory(atlas:Atlas,side:'Left'|'Right'){
 return atlas.parts.filter(p=>p.system==='arterial'&&RENAL_TREE[side].includes(p.conceptId)&&p.name.toLowerCase().includes(`${side.toLowerCase()} renal artery`)).map(p=>p.id);
}
export function renalLessonPreview(atlas:Atlas,side:'Left'|'Right',flow:number,stage:number,site:RenalSite='main'):RenalPreview{
 const ids=renalTerritory(atlas,side),lesionIds=atlas.parts.filter(p=>ids.includes(p.id)&&p.conceptId===RENAL_SITES[side][site]).map(p=>p.id);
 return {ids:stage===0?lesionIds:ids,flow,lesionIds,affectedIds:site==='main'?ids:lesionIds,
  contextIds:stage===2?atlas.parts.filter(part=>part.system==='urinary'&&part.name===`${side} kidney`).map(part=>part.id):[]};
}
