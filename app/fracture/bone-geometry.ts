import {Vector3,Plane} from 'three';
import type {FracturePattern} from './bone-requests';

/** Geometry-only fracture planes. No force, injury threshold, or tissue solver. */
export function fractureLayout(positions:Float32Array,pattern:FracturePattern,location=.5){
 const min=new Vector3(Infinity,Infinity,Infinity),max=new Vector3(-Infinity,-Infinity,-Infinity);
 for(let i=0;i<positions.length;i+=3){const v=new Vector3().fromArray(positions,i);min.min(v);max.max(v);}
 const center=min.clone().add(max).multiplyScalar(.5),size=max.clone().sub(min),span=Math.max(size.x,size.y,size.z);
 if(!Number.isFinite(span)||span<=0)throw new Error('Bone geometry has no measurable extent.');
 const axis=size.x>=size.y&&size.x>=size.z?0:size.y>=size.z?1:2;
 const normal=new Vector3().setComponent(axis,1);
 const cross=[0,1,2].filter(value=>value!==axis).sort((a,b)=>size.getComponent(b)-size.getComponent(a))[0],lateral=new Vector3().setComponent(cross,1);
 if(pattern==='longitudinal')normal.copy(lateral);
 if(pattern==='oblique')normal.setComponent((axis+1)%3,.55).normalize();
 const centered=positions.slice();let low=Infinity,high=-Infinity;
 for(let i=0;i<centered.length;i+=3){const v=new Vector3().fromArray(centered,i).sub(center);v.toArray(centered,i);const d=v.dot(normal);low=Math.min(low,d);high=Math.max(high,d);}
 const at=Math.max(.2,Math.min(.8,location));
 const cuts=(pattern==='segmental'?[at-.12,at+.12]:[at]).map(f=>low+(high-low)*f);
 const boundaries=[-Infinity,...cuts,Infinity];
 let fragments=boundaries.slice(0,-1).map((lower,i)=>{
  const upper=boundaries[i+1],planes:Plane[]=[];
  if(Number.isFinite(lower))planes.push(new Plane(normal.clone(),-lower));
  if(Number.isFinite(upper))planes.push(new Plane(normal.clone().negate(),upper));
  return {planes,edges:[lower,upper].filter(Number.isFinite).map(offset=>new Plane(normal.clone(),-offset))};
 });
 if(pattern==='wedge'){
  const at=cuts[0];let lo=Infinity,hi=-Infinity;
  for(let i=0;i<centered.length;i+=3)if(Math.abs(centered[i+axis]-at)<span*.08){lo=Math.min(lo,centered[i+cross]);hi=Math.max(hi,centered[i+cross]);}
  const width=hi>lo?hi-lo:size.getComponent(cross),origin=hi>lo?(hi+lo)/2:0,slope=span*.12/width,scale=Math.hypot(1,slope);
  const a=new Plane(normal.clone().addScaledVector(lateral,slope).normalize(),(-at-slope*origin)/scale),b=new Plane(normal.clone().negate().addScaledVector(lateral,slope).normalize(),(at-slope*origin)/scale);
  fragments=[[a.clone().negate()],[a,b],[a,b.clone().negate()]].map(planes=>({planes,edges:planes.map(plane=>plane.clone())}));
 }
 return {positions:centered,normal,lateral,span,fragments,cuts};
}

export function fractureContour(positions:Float32Array,indices:Uint32Array,normal:Vector3,offset:number,clipPlanes:Plane[]=[]){
 const lines:number[]=[];
 for(let i=0;i<indices.length;i+=3){
  const hits:Vector3[]=[];
  for(let edge=0;edge<3;edge++){
   const a=new Vector3().fromArray(positions,indices[i+edge]*3),b=new Vector3().fromArray(positions,indices[i+(edge+1)%3]*3),da=a.dot(normal)-offset,db=b.dot(normal)-offset;
   if((da<0&&db>=0)||(da>=0&&db<0))hits.push(a.lerp(b,da/(da-db)));
  }
  if(hits.length===2){
   let [a,b]=hits,visible=true;
   for(const plane of clipPlanes){
    const da=plane.distanceToPoint(a),db=plane.distanceToPoint(b);
    if(da< -1e-9&&db< -1e-9){visible=false;break;}
    if(da<0&&db>=0)a=a.clone().lerp(b,da/(da-db));else if(db<0&&da>=0)b=b.clone().lerp(a,db/(db-da));
   }
   if(visible&&a.distanceToSquared(b)>1e-20)lines.push(...a.toArray(),...b.toArray());
  }
 }
 return lines;
}

export function fractureAmount(progress:number){const t=Math.max(0,Math.min(1,(progress-.42)/.58));return t*t*(3-2*t);}
export function fractureStage(progress:number){return progress<.25?'intact':progress<.42?'line':progress<1?'separating':'complete';}
