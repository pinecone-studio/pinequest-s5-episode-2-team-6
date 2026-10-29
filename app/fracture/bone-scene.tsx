import {useEffect,useRef,useState} from 'react';
import * as T from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import type {Atlas,Part} from '../anatomy';
import {decodeModelResponse} from '../model-download';
import type {FracturePattern} from './bone-requests';
import {fractureLayout,fractureContour,fractureAmount} from './bone-geometry';

export default function BoneScene({atlas,part,pattern,location,aligned,progress,reset,onReady}:{atlas:Atlas;part:Part;pattern:FracturePattern;location:number;aligned:boolean;progress:number;reset:number;onReady:()=>void}){
 const host=useRef<HTMLDivElement>(null),latest=useRef({progress,aligned,reset,onReady});latest.current={progress,aligned,reset,onReady};
 const [status,setStatus]=useState('loading'),[attempt,setAttempt]=useState(0);
 useEffect(()=>{
  const el=host.current!,abort=new AbortController();let disposed=false,frame=0,lastReset=reset;
  setStatus('loading');
  let renderer:T.WebGLRenderer;
  try{renderer=new T.WebGLRenderer({antialias:true,alpha:true});}catch{setStatus('error');return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.localClippingEnabled=true;renderer.outputColorSpace=T.SRGBColorSpace;el.appendChild(renderer.domElement);
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(35,1,.00001,100),controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;
  scene.add(new T.HemisphereLight(0xffffff,0x657b97,2));const light=new T.DirectionalLight(0xffffff,3);light.position.set(-1,2,3);scene.add(light);
  const geometry=new T.BufferGeometry(),materials:T.Material[]=[],edgeGeometries:T.BufferGeometry[]=[],fragments:{group:T.Group;local:T.Plane[];world:T.Plane[];edges:T.LineSegments[]}[]=[];
  let extent=.2,normal=new T.Vector3(1,0,0),lateral=new T.Vector3(0,1,0);
  const home=()=>{controls.target.set(0,0,0);const distance=extent*.9/(Math.tan(T.MathUtils.degToRad(camera.fov/2))*Math.min(1,camera.aspect));camera.position.set(extent*.3,extent*.2,distance);if(Math.abs(normal.z)>.7)camera.position.set(distance,extent*.2,extent*.3);camera.near=extent/1000;camera.far=extent*50;camera.updateProjectionMatrix();controls.minDistance=extent*.3;controls.maxDistance=Math.max(extent*10,distance*2);controls.update();};home();
  const resize=()=>{const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();};
  const observer=new ResizeObserver(resize);observer.observe(el);resize();
  const tick=()=>{
   if(disposed)return;frame=requestAnimationFrame(tick);
   const {progress,aligned}=latest.current,amount=aligned?0:fractureAmount(progress);
   fragments.forEach(({group,local,world,edges},index)=>{
    const sign=index-(fragments.length-1)/2;
    group.position.copy(normal).multiplyScalar(sign*extent*.055*amount);
    if(fragments.length===3&&index===1)group.position.copy(pattern==='wedge'?lateral:new T.Vector3(0,0,1)).multiplyScalar(extent*.04*amount);
    group.rotation.z=sign*.055*amount;group.updateMatrixWorld(true);
    local.forEach((plane,i)=>world[i].copy(plane).applyMatrix4(group.matrixWorld));
    edges.forEach(edge=>{edge.visible=progress>=.25;edge.geometry.setDrawRange(0,Math.floor(edge.geometry.attributes.position.count*Math.min(1,Math.max(0,(progress-.25)/.17))/2)*2);});
   });
   if(lastReset!==latest.current.reset){home();lastReset=latest.current.reset;}
   controls.update();renderer.render(scene,camera);
  };tick();
  (async()=>{try{
   const chunk=atlas.chunks[part.chunk],compressed=!!chunk.gzip&&typeof DecompressionStream!=='undefined';
   const buffer=await decodeModelResponse(await fetch(compressed?chunk.gzip!:chunk.url,{signal:abort.signal}),chunk.bytes,compressed);
   if(disposed)return;
   const source=new Float32Array(buffer,part.positions,part.vertexCount*3),indices=new Uint32Array(buffer,part.indices,part.indexCount);
   const layout=fractureLayout(source,pattern,location);extent=layout.span;normal=layout.normal;lateral=layout.lateral;home();
   geometry.setAttribute('position',new T.BufferAttribute(layout.positions,3));geometry.setAttribute('normal',new T.BufferAttribute(new Int16Array(buffer,part.normals,part.vertexCount*3),3,true));geometry.setIndex(new T.BufferAttribute(indices,1));
   const edgeMaterial=new T.LineBasicMaterial({color:0xff875e,depthTest:false});materials.push(edgeMaterial);
   layout.fragments.forEach((fragment,index)=>{
    const world=fragment.planes.map(p=>p.clone()),material=new T.MeshStandardMaterial({color:[0xf5e8c8,0xbfdacb,0xc5d2f4][index],roughness:.6,side:T.DoubleSide,clippingPlanes:world});materials.push(material);
    const group=new T.Group();group.add(new T.Mesh(geometry,material));
    const edges=fragment.edges.map(plane=>{
     const cut=new T.BufferGeometry();cut.setAttribute('position',new T.Float32BufferAttribute(fractureContour(layout.positions,indices,plane.normal,-plane.constant,fragment.planes),3));edgeGeometries.push(cut);
     const edge=new T.LineSegments(cut,edgeMaterial);edge.renderOrder=2;group.add(edge);return edge;
    });
    fragments.push({group,local:fragment.planes,world,edges});scene.add(group);
   });
   setStatus('ready');latest.current.onReady();
  }catch{if(!disposed)setStatus('error');}})();
  return()=>{disposed=true;abort.abort();cancelAnimationFrame(frame);observer.disconnect();controls.dispose();geometry.dispose();edgeGeometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
 },[atlas,part,pattern,location,attempt]);
 return <div className="fracture-stage bone-fracture-stage" ref={host} role="region" aria-label={`${part.name} fracture animation`}>
  {status==='loading'&&<p className="fracture-status" role="status">Loading bone / Ясыг ачаалж байна…</p>}
  {status==='error'&&<div className="fracture-status" role="alert"><p>Could not load this bone. / Ясыг ачаалж чадсангүй.</p><button onClick={()=>setAttempt(n=>n+1)}>Retry / Дахин оролдох</button></div>}
 </div>;
}
