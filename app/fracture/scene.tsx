import {useEffect,useRef,useState} from 'react';
import * as T from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import type {Atlas} from '../anatomy';
import {decodeModelResponse} from '../model-download';
import {fragmentPose,type FractureSettings} from './model';

export default function FractureScene({settings,reset,label}:{settings:FractureSettings;reset:number;label:string}){
 const host=useRef<HTMLDivElement>(null),latest=useRef(settings),resetRef=useRef(reset);
 latest.current=settings;resetRef.current=reset;
 const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
 const [attempt,setAttempt]=useState(0);
 useEffect(()=>{
  const el=host.current!,abort=new AbortController();let disposed=false,frame=0,lastReset=resetRef.current;
  setStatus('loading');
  let renderer:T.WebGLRenderer;
  try{renderer=new T.WebGLRenderer({antialias:true,alpha:true});}catch{setStatus('error');return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.localClippingEnabled=true;
  renderer.outputColorSpace=T.SRGBColorSpace;el.appendChild(renderer.domElement);
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(35,1,.001,10);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=.09;controls.maxDistance=1;
  const home=()=>{controls.target.set(0,0,0);camera.position.set(0,.07,.35);controls.update();};home();
  scene.add(new T.HemisphereLight(0xffffff,0x657b97,2));
  const light=new T.DirectionalLight(0xffffff,3);light.position.set(-1,2,3);scene.add(light);
  const resize=()=>{const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();};
  const observer=new ResizeObserver(resize);observer.observe(el);resize();
  const geometry=new T.BufferGeometry(),materials:T.Material[]=[],groups:T.Group[]=[],planes:T.Plane[]=[],localPlanes:T.Plane[]=[];
  let cutGeometry:T.BufferGeometry|undefined;
  const cutMaterial=new T.LineBasicMaterial({color:0xff875e});materials.push(cutMaterial);
  const cuts:T.LineSegments[]=[];
  const animate=()=>{
   if(disposed)return;frame=requestAnimationFrame(animate);
   groups.forEach((group,i)=>{const pose=fragmentPose(latest.current,i===0);group.position.set(pose.x,pose.y,0);group.rotation.z=pose.angle;group.updateMatrixWorld(true);planes[i].copy(localPlanes[i]).applyMatrix4(group.matrixWorld);});
   cuts.forEach(c=>{c.visible=latest.current.fractured&&latest.current.progress>0;});
   if(lastReset!==resetRef.current){home();lastReset=resetRef.current;}
   controls.update();renderer.render(scene,camera);
  };animate();
  (async()=>{try{
   const response=await fetch('/models/atlas.json',{signal:abort.signal});if(!response.ok)throw new Error('Catalogue unavailable');
   const atlas:Atlas=await response.json(),part=atlas.parts.find(p=>p.name===`${settings.side} clavicle`);
   if(!part)throw new Error('Clavicle unavailable');
   const chunk=atlas.chunks[part.chunk],compressed=!!chunk.gzip&&typeof DecompressionStream!=='undefined';
   const buffer=await decodeModelResponse(await fetch(compressed?chunk.gzip!:chunk.url,{signal:abort.signal}),chunk.bytes,compressed);
   if(disposed)return;
   // Work around the shaft midpoint; keep the source geometry unchanged on disk.
   const center=new T.Vector3().fromArray(part.bounds[0]).add(new T.Vector3().fromArray(part.bounds[1])).multiplyScalar(.5);
   const positions=new Float32Array(buffer,part.positions,part.vertexCount*3).slice();
   for(let i=0;i<positions.length;i+=3){positions[i]-=center.x;positions[i+1]-=center.y;positions[i+2]-=center.z;}
   const indices=new Uint32Array(buffer,part.indices,part.indexCount);
   geometry.setAttribute('position',new T.BufferAttribute(positions,3));
   geometry.setAttribute('normal',new T.BufferAttribute(new Int16Array(buffer,part.normals,part.vertexCount*3),3,true));
   geometry.setIndex(new T.BufferAttribute(indices,1));
   // Trace actual triangle intersections with the midshaft plane for visible fracture edges.
   const lines:number[]=[];
   for(let i=0;i<indices.length;i+=3){
    const hits:T.Vector3[]=[];
    for(let edge=0;edge<3;edge++){
     const a=new T.Vector3().fromArray(positions,indices[i+edge]*3),b=new T.Vector3().fromArray(positions,indices[i+(edge+1)%3]*3);
     if((a.x<0&&b.x>=0)||(a.x>=0&&b.x<0))hits.push(a.clone().lerp(b,-a.x/(b.x-a.x)));
    }
    if(hits.length===2)lines.push(...hits[0].toArray(),...hits[1].toArray());
   }
   cutGeometry=new T.BufferGeometry();cutGeometry.setAttribute('position',new T.Float32BufferAttribute(lines,3));
   for(let i=0;i<2;i++){
    const sign=(settings.side==='Left'?-1:1)*(i===0?1:-1);
    const local=new T.Plane(new T.Vector3(sign,0,0),0),plane=local.clone();localPlanes.push(local);planes.push(plane);
    const material=new T.MeshStandardMaterial({color:i===0?0xf5e8c8:0xbfdacb,roughness:.6,side:T.DoubleSide,clippingPlanes:[plane]});materials.push(material);
    const group=new T.Group();group.add(new T.Mesh(geometry,material));
    const cut=new T.LineSegments(cutGeometry,cutMaterial);cuts.push(cut);group.add(cut);groups.push(group);scene.add(group);
   }
   setStatus('ready');
  }catch{if(!disposed)setStatus('error');}})();
  return()=>{disposed=true;abort.abort();cancelAnimationFrame(frame);observer.disconnect();controls.dispose();geometry.dispose();cutGeometry?.dispose();materials.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();};
 },[settings.side,attempt]);
 return <div className="fracture-stage" ref={host} role="region" aria-label={label}>
  {status==='loading'&&<p className="fracture-status" role="status">Loading / Уншиж байна…</p>}
  {status==='error'&&<div className="fracture-status" role="alert"><p>Could not load the 3D viewer. / 3D загварыг ачаалж чадсангүй.</p><button onClick={()=>setAttempt(n=>n+1)}>Retry / Дахин оролдох</button></div>}
 </div>;
}
