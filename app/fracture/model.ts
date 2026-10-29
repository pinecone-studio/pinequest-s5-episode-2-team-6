export type ClavicleSide='Left'|'Right';
export interface FractureSettings {side:ClavicleSide;progress:number;displacement:number;shortening:number;angle:number;fractured:boolean}
export const INITIAL_FRACTURE:FractureSettings={side:'Left',progress:0,displacement:12,shortening:8,angle:12,fractured:true};

/** Prescribed fragment positions, in meters/radians. Not a biomechanical solver. */
export function fragmentPose(settings:FractureSettings,medial:boolean){
 const values=[settings.progress,settings.displacement,settings.shortening,settings.angle];
 if(values.some(v=>!Number.isFinite(v)))throw new RangeError('Fracture controls must be finite.');
 const amount=settings.fractured?Math.min(1,Math.max(0,settings.progress)):0;
 if(amount===0)return {x:0,y:0,angle:0};
 const sign=settings.side==='Left'?1:-1;
 return {
  x:medial?0:-sign*Math.min(20,Math.max(0,settings.shortening))*.001*amount,
  y:(medial?1:-1)*Math.min(20,Math.max(0,settings.displacement))*.0005*amount,
  angle:sign*(medial?-1:1)*Math.min(25,Math.max(0,settings.angle))*Math.PI/180*amount*.5,
 };
}
