import type {Atlas} from './anatomy';
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
 return atlas.parts.filter(p=>p.name.toLowerCase()===`${side.toLowerCase()} kidney`||p.name.toLowerCase()===`${side.toLowerCase()} renal artery`).map(p=>p.id);
}
