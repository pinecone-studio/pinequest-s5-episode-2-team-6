import {useEffect,useRef,useState} from 'react';
import * as T from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import type {Atlas} from '../anatomy';
import {decodeModelResponse} from '../model-download';
import {boneSegment,fallPose,segmentEndpoints,type Segment} from './fall-model';
import {fragmentPose,INITIAL_FRACTURE} from './model';

export default function FallScene({progress,reset,label}:{progress:number;reset:number;label:string}){
 const host=useRef<HTMLDivElement>(null),latest=useRef(progress),resetRef=useRef(reset);
 latest.current=progress;resetRef.current=reset;
 const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading'),[attempt,setAttempt]=useState(0);
 useEffect(()=>{
  const el=host.current!,abort=new AbortController();let disposed=false,frame=0,lastReset=resetRef.current;
  setStatus('loading');let renderer:T.WebGLRenderer;
  try{renderer=new T.WebGLRenderer({antialias:true,alpha:true});}catch{setStatus('error');return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.localClippingEnabled=true;renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.setClearColor(0x122331);el.appendChild(renderer.domElement);
  const scene=new T.Scene();scene.fog=new T.Fog(0x122331,5,12);
  const camera=new T.PerspectiveCamera(38,1,.01,30),controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;controls.minDistance=1.5;controls.maxDistance=6;controls.maxPolarAngle=Math.PI*.49;
  const home=()=>{camera.position.set(-3.4,1.75,2.4);controls.target.set(0,.8,-.1);controls.update();};home();
  scene.add(new T.HemisphereLight(0xe1efff,0x647464,2.4));
  const light=new T.DirectionalLight(0xffffff,3);light.position.set(-2,5,3);scene.add(light);
  const materials:T.Material[]=[],geometries:T.BufferGeometry[]=[];
  const material=(color:number,extra:T.MeshStandardMaterialParameters={})=>{const m=new T.MeshStandardMaterial({color,roughness:.8,...extra});materials.push(m);return m;};
  const ground=material(0x344350),tile=material(0x71808b),curb=material(0xa5b0b6),slick=material(0x65b4d0,{metalness:.35,roughness:.12});
  const box=(w:number,h:number,d:number,x:number,y:number,z:number,m:T.Material)=>{const g=new T.BoxGeometry(w,h,d);geometries.push(g);const mesh=new T.Mesh(g,m);mesh.position.set(x,y,z);scene.add(mesh);return mesh;};
  box(12,.08,12,0,-.16,0,ground);
  for(let x=-2;x<=2;x++)for(let z=-4;z<=5;z++)box(.49,.08,.49,x*.5,-.04,z*.5,tile);
  box(.12,.16,5,1.30,-.08,.25,curb);
  const patchGeometry=new T.CircleGeometry(.23,40);geometries.push(patchGeometry);
  const patch=new T.Mesh(patchGeometry,slick);patch.rotation.x=-Math.PI/2;patch.scale.y=1.45;patch.position.set(-.1,.002,.13);scene.add(patch);
  const ringGeometry=new T.RingGeometry(.065,.085,48);geometries.push(ringGeometry);
  const contactMaterial=new T.MeshBasicMaterial({color:0xffbd69,transparent:true,opacity:.9,side:T.DoubleSide});materials.push(contactMaterial);
  const contactRing=new T.Mesh(ringGeometry,contactMaterial);contactRing.rotation.x=-Math.PI/2;scene.add(contactRing);
  const slipGeometry=new T.BufferGeometry().setFromPoints([new T.Vector3(-.1,.012,.14),new T.Vector3(-.1,.012,.14)]);geometries.push(slipGeometry);
  const slipMaterial=new T.LineBasicMaterial({color:0x89e8f2});materials.push(slipMaterial);
  const slipTrail=new T.Line(slipGeometry,slipMaterial);scene.add(slipTrail);
  const slipArrow=new T.ArrowHelper(new T.Vector3(0,0,1),new T.Vector3(-.1,.025,.14),.30,0x89e8f2,.065,.04);scene.add(slipArrow);
  geometries.push(slipArrow.line.geometry,slipArrow.cone.geometry);
  materials.push(...(Array.isArray(slipArrow.line.material)?slipArrow.line.material:[slipArrow.line.material]),...(Array.isArray(slipArrow.cone.material)?slipArrow.cone.material:[slipArrow.cone.material]));
  const bodyGroups=new Map<Segment,T.Group>(),restPose=fallPose(0);
  const groupFor=(segment:Segment)=>{let g=bodyGroups.get(segment);if(!g){g=new T.Group();bodyGroups.set(segment,g);scene.add(g);}return g;};
  const boneMaterial=material(0xe6debf,{roughness:.55}),armMaterial=material(0xb9dbe0,{roughness:.45});
  const fractureMaterials=[material(0xffcf8d,{side:T.DoubleSide}),material(0xff875e,{side:T.DoubleSide})];
  const fragments:T.Group[]=[],localPlanes:T.Plane[]=[],planes:T.Plane[]=[];
  const pathGeometry=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(),new T.Vector3()]);geometries.push(pathGeometry);
  const pathMaterial=new T.LineDashedMaterial({color:0xffc768,dashSize:.035,gapSize:.02,transparent:true,opacity:.85});materials.push(pathMaterial);
  const loadPath=new T.Line(pathGeometry,pathMaterial);scene.add(loadPath);
  const markerGeometry=new T.SphereGeometry(.025,16,12);geometries.push(markerGeometry);
  const marker=new T.Mesh(markerGeometry,material(0xff875e,{emissive:0xff542f,emissiveIntensity:.7}));scene.add(marker);
  const resize=()=>{renderer.setSize(el.clientWidth,el.clientHeight);camera.aspect=el.clientWidth/Math.max(1,el.clientHeight);camera.updateProjectionMatrix();};
  const observer=new ResizeObserver(resize);observer.observe(el);resize();
  const animate=()=>{
   if(disposed)return;frame=requestAnimationFrame(animate);const pose=fallPose(latest.current);
   for(const [segment,group] of bodyGroups){
    const [a,b,c,d]=segmentEndpoints(segment,pose);
    group.position.copy(c);group.quaternion.setFromUnitVectors(b.sub(a).normalize(),d.clone().sub(c).normalize());
   }
   fragments.forEach((fragment,i)=>{const p=fragmentPose({...INITIAL_FRACTURE,side:'Right',progress:pose.fracture},i===0);fragment.position.set(p.x,p.y,0);fragment.rotation.z=p.angle;});
   scene.updateMatrixWorld(true);
   fragments.forEach((fragment,i)=>planes[i].copy(localPlanes[i]).applyMatrix4(fragment.matrixWorld));
   contactRing.visible=pose.contact;loadPath.visible=pose.contact;marker.visible=pose.fracture>0;
   contactRing.position.set(pose.handContact.x,.008,pose.handContact.z+.05);
   slipTrail.visible=pose.slipping;slipArrow.visible=pose.slipping;
   (slipGeometry.getAttribute('position') as T.BufferAttribute).setXYZ(1,pose.rightAnkle.x,.012,pose.rightAnkle.z+.10);slipGeometry.getAttribute('position').needsUpdate=true;
   const pathPositions=pathGeometry.getAttribute('position') as T.BufferAttribute;
   [pose.rightWrist,pose.rightElbow,pose.rightShoulder].forEach((p,i)=>pathPositions.setXYZ(i,p.x-.018,p.y,p.z+.025));pathPositions.needsUpdate=true;loadPath.computeLineDistances();
   const torso=bodyGroups.get('torso');if(torso)marker.position.copy(new T.Vector3(-.075,1.414,.02).sub(new T.Vector3(0,.92,0))).applyQuaternion(torso.quaternion).add(torso.position);
   if(lastReset!==resetRef.current){home();lastReset=resetRef.current;}
   controls.update();renderer.render(scene,camera);
  };animate();
  (async()=>{try{
   const response=await fetch('/models/atlas.json',{signal:abort.signal});if(!response.ok)throw new Error('Missing atlas');
   const atlas:Atlas=await response.json();
   const parts=atlas.parts.filter(p=>p.system==='skeletal'||p.system==='dental'||/costal cartilage/i.test(p.name));
   const chunks=[...new Set(parts.map(p=>p.chunk))];
   for(const ci of chunks){
    const chunk=atlas.chunks[ci],compressed=!!chunk.gzip&&typeof DecompressionStream!=='undefined';
    const buffer=await decodeModelResponse(await fetch(compressed?chunk.gzip!:chunk.url,{signal:abort.signal}),chunk.bytes,compressed);if(disposed)return;
    for(const part of parts.filter(p=>p.chunk===ci)){
     // Two source meshes represent the same hyoid; draw only one in the moving figure.
     if(part.id==='FJ2772')continue;
     const geometry=new T.BufferGeometry();geometries.push(geometry);
     geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(buffer,part.positions,part.vertexCount*3),3));
     geometry.setAttribute('normal',new T.BufferAttribute(new Int16Array(buffer,part.normals,part.vertexCount*3),3,true));
     geometry.setIndex(new T.BufferAttribute(new Uint32Array(buffer,part.indices,part.indexCount),1));
     const segment=boneSegment(part.name),group=groupFor(segment),[origin]=segmentEndpoints(segment,restPose);
     if(part.name==='Right clavicle'){
      const center=new T.Vector3().fromArray(part.bounds[0]).add(new T.Vector3().fromArray(part.bounds[1])).multiplyScalar(.5);
      const anchor=new T.Group();anchor.position.copy(center).sub(origin);group.add(anchor);
      for(let i=0;i<2;i++){
       const fragment=new T.Group(),mesh=new T.Mesh(geometry,fractureMaterials[i]);mesh.position.copy(center).negate();fragment.add(mesh);anchor.add(fragment);fragments.push(fragment);
       const local=new T.Plane(new T.Vector3(i===0?1:-1,0,0),0),plane=local.clone();localPlanes.push(local);planes.push(plane);fractureMaterials[i].clippingPlanes=[plane];
      }
     }else{
      const mesh=new T.Mesh(geometry,segment.startsWith('right')&&/Arm|Hand/.test(segment)?armMaterial:boneMaterial);mesh.position.copy(origin).negate();group.add(mesh);
     }
    }
   }
   if(!disposed)setStatus('ready');
  }catch{if(!disposed)setStatus('error');}})();
  return()=>{disposed=true;abort.abort();cancelAnimationFrame(frame);observer.disconnect();controls.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();};
 },[attempt]);
 return <div className="fall-stage" ref={host} role="region" aria-label={label} data-phase={fallPose(progress).phase}>
  {status==='loading'&&<p className="fall-loading" role="status">Loading anatomy / Анатоми ачаалж байна…</p>}
  {status==='error'&&<div className="fall-loading" role="alert"><p>Unable to load the scene / Загварыг ачаалж чадсангүй.</p><button onClick={()=>setAttempt(n=>n+1)}>Retry / Дахин оролдох</button></div>}
 </div>;
}
