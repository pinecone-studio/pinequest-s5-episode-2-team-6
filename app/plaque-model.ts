import type {Atlas} from './anatomy';
import {Color} from 'three';
export interface RenalPreview {ids:string[];flow:number;contextIds?:string[]}
export const renalColor=(flow:number)=>`hsl(${10+Math.max(0,Math.min(1,flow))*150},40%,55%)`;
export function perfusionTint(preview:RenalPreview|undefined,id:string){
 if(!preview?.ids.includes(id))return [0,0,0];
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
 const artery=`${side.toLowerCase()} renal artery`;
 return atlas.parts.filter(p=>p.system==='arterial'&&(p.name.toLowerCase()===artery||p.name.toLowerCase().endsWith(`of ${artery}`))).map(p=>p.id);
}
export function renalLessonPreview(atlas:Atlas,side:'Left'|'Right',flow:number,stage:number):RenalPreview{
 const ids=renalTerritory(atlas,side);
 return {ids:stage===0?ids.filter(id=>atlas.parts.find(part=>part.id===id)?.name===`${side} renal artery`):ids,flow,
  contextIds:stage===2?atlas.parts.filter(part=>part.system==='urinary'&&part.name===`${side} kidney`).map(part=>part.id):[]};
}
