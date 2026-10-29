import {useEffect,useRef,useState} from 'react';
import * as T from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import type {Atlas} from '../anatomy';
import {decodeModelResponse} from '../model-download';
import {boneSegment,fallPose,scenarioPose,segmentEndpoints,type Segment,type ScenarioId} from './fall-model';
import {fractureLayout,fractureContour,fractureAmount} from './bone-geometry';
import type {FracturePattern} from './bone-requests';
import {fragmentPose,INITIAL_FRACTURE} from './model';
import {anatomyId,type AnatomyId} from './education';
import {createAnatomyOverlay} from './anatomy-overlay';
import type {Lang} from '../landing/copy';

type ScenarioFracture={bone:string;pattern:FracturePattern;location:number;aligned:boolean};
export default function FallScene({progress,reset,label,overlays=false,focused=null,lang='en',onAnatomySelect=()=>{},scenario,fracture,onReady=()=>{}}:{progress:number;reset:number;label:string;overlays?:boolean;focused?:AnatomyId|null;lang?:Lang;onAnatomySelect?:(id:AnatomyId)=>void;scenario?:ScenarioId;fracture?:ScenarioFracture;onReady?:()=>void}){
 const host=useRef<HTMLDivElement>(null),latest=useRef(progress),resetRef=useRef(reset);
 latest.current=progress;resetRef.current=reset;
 const scenarioOptions=useRef({fracture,onReady});scenarioOptions.current={fracture,onReady};
 const overlayOptions=useRef({overlays,focused,lang,onAnatomySelect});overlayOptions.current={overlays,focused,lang,onAnatomySelect};
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
  patch.visible=!scenario||scenario==='fall';
  const vehicle=new T.Group();scene.add(vehicle);vehicle.visible=scenario==='crash';
  const frameMaterial=material(0x3e697e),glass=material(0x79c3d3,{transparent:true,opacity:.18,depthWrite:false}),rubber=material(0x15212b);
  const carBox=(w:number,h:number,d:number,x:number,y:number,z:number,m:T.Material)=>{const mesh=box(w,h,d,x,y,z,m);vehicle.add(mesh);return mesh;};
  if(scenario==='crash'){
   carBox(1.2,.08,1.7,0,.18,0,frameMaterial);carBox(.6,.08,.5,0,.57,-.12,rubber);carBox(.6,.6,.08,0,.9,-.18,rubber);
   carBox(1.05,.1,.1,0,.58,.5,frameMaterial);carBox(1.1,.3,.3,0,.37,.72,frameMaterial);
   for(const x of [-.6,.6])carBox(.04,.5,1.4,x,.6,-.1,glass);
   const wheel=new T.CylinderGeometry(.21,.21,.12,24);geometries.push(wheel);
   for(const x of [-.65,.65])for(const z of [-.54,.54]){const mesh=new T.Mesh(wheel,rubber);mesh.rotation.z=Math.PI/2;mesh.position.set(x,.22,z);vehicle.add(mesh);}
   box(2,1,.12,0,.5,.96,curb);
  }
  const ballGeometry=new T.SphereGeometry(.13,24,16);geometries.push(ballGeometry);
  const ball=new T.Mesh(ballGeometry,material(0xe5ab56));scene.add(ball);ball.visible=scenario==='impact';
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
  const selectedMaterial=material(0xdff878,{emissive:0x92ae25,emissiveIntensity:.35});
  const anatomyMeshes:{mesh:T.Mesh;original:T.Material;id:AnatomyId}[]=[];
  const anatomyAnchors=new Map<AnatomyId,{point:T.Vector3;segment:Segment;count:number}>();
  const anatomyOverlay=createAnatomyOverlay(el,id=>overlayOptions.current.onAnatomySelect(id));
  const fractureMaterials=[material(0xffcf8d,{side:T.DoubleSide}),material(0xff875e,{side:T.DoubleSide})];
  const fragments:T.Group[]=[],localPlanes:T.Plane[]=[],planes:T.Plane[]=[];
  const bodyFragments:{group:T.Group;local:T.Plane[];world:T.Plane[];edges:T.LineSegments[];normal:T.Vector3;lateral:T.Vector3;span:number;index:number;count:number}[]=[];
  let fractureAnchor:T.Object3D|undefined;
  const pathGeometry=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(),new T.Vector3()]);geometries.push(pathGeometry);
  const pathMaterial=new T.LineDashedMaterial({color:0xffc768,dashSize:.035,gapSize:.02,transparent:true,opacity:.85});materials.push(pathMaterial);
  const loadPath=new T.Line(pathGeometry,pathMaterial);scene.add(loadPath);
  const markerGeometry=new T.SphereGeometry(.025,16,12);geometries.push(markerGeometry);
  const marker=new T.Mesh(markerGeometry,material(0xff875e,{emissive:0xff542f,emissiveIntensity:.7}));scene.add(marker);
  const resize=()=>{renderer.setSize(el.clientWidth,el.clientHeight);camera.aspect=el.clientWidth/Math.max(1,el.clientHeight);camera.updateProjectionMatrix();};
  const observer=new ResizeObserver(resize);observer.observe(el);resize();
  const animate=()=>{
   if(disposed)return;frame=requestAnimationFrame(animate);const progress=latest.current,pose=scenario?scenarioPose(progress,scenario):fallPose(progress);
   const approach=Math.min(1,progress/.25),recoil=Math.min(1,Math.max(0,(progress-.25)/.3));
   vehicle.position.z=-1.4*(1-approach);vehicle.scale.z=1-.035*recoil;
   ball.position.set(-1.6+1.35*approach-.5*recoil,.28+.4*recoil,0);ball.rotation.z=progress*8;
   for(const [segment,group] of bodyGroups){
    const [a,b,c,d]=segmentEndpoints(segment,pose);
    group.position.copy(c);group.quaternion.setFromUnitVectors(b.sub(a).normalize(),d.clone().sub(c).normalize());
   }
   fragments.forEach((fragment,i)=>{const p=fragmentPose({...INITIAL_FRACTURE,side:'Right',progress:pose.fracture},i===0);fragment.position.set(p.x,p.y,0);fragment.rotation.z=p.angle;});
   const amount=scenarioOptions.current.fracture?.aligned?0:fractureAmount(progress);
   bodyFragments.forEach(({group,normal,lateral,span,index,count})=>{
    const sign=index-(count-1)/2;group.position.copy(normal).multiplyScalar(sign*span*.055*amount);
    if(count===3&&index===1)group.position.copy(fracture?.pattern==='wedge'?lateral:new T.Vector3(0,0,1)).multiplyScalar(span*.04*amount);
    group.rotation.z=sign*.055*amount;
   });
   scene.updateMatrixWorld(true);
   bodyFragments.forEach(({group,local,world,edges})=>{local.forEach((plane,i)=>world[i].copy(plane).applyMatrix4(group.matrixWorld));edges.forEach(edge=>{edge.visible=progress>=.25;edge.geometry.setDrawRange(0,Math.floor(edge.geometry.attributes.position.count*Math.min(1,Math.max(0,(progress-.25)/.17))/2)*2);});});
   fragments.forEach((fragment,i)=>planes[i].copy(localPlanes[i]).applyMatrix4(fragment.matrixWorld));
   contactRing.visible=pose.contact&&(!scenario||scenario==='fall');loadPath.visible=pose.contact&&(!scenario||scenario==='fall');marker.visible=scenario?progress>=.25:pose.fracture>0;
   contactRing.position.set(pose.handContact.x,.008,pose.handContact.z+.05);
   slipTrail.visible=pose.slipping&&(!scenario||scenario==='fall');slipArrow.visible=slipTrail.visible;
   (slipGeometry.getAttribute('position') as T.BufferAttribute).setXYZ(1,pose.rightAnkle.x,.012,pose.rightAnkle.z+.10);slipGeometry.getAttribute('position').needsUpdate=true;
   const pathPositions=pathGeometry.getAttribute('position') as T.BufferAttribute;
   [pose.rightWrist,pose.rightElbow,pose.rightShoulder].forEach((p,i)=>pathPositions.setXYZ(i,p.x-.018,p.y,p.z+.025));pathPositions.needsUpdate=true;loadPath.computeLineDistances();
   const torso=bodyGroups.get('torso');if(torso)marker.position.copy(new T.Vector3(-.075,1.414,.02).sub(new T.Vector3(0,.92,0))).applyQuaternion(torso.quaternion).add(torso.position);
   if(fractureAnchor)fractureAnchor.getWorldPosition(marker.position);
   if(lastReset!==resetRef.current){home();lastReset=resetRef.current;}
   const options=overlayOptions.current,selection=options.overlays?options.focused:null;
   anatomyMeshes.forEach(({mesh,original,id})=>{mesh.material=id===selection?selectedMaterial:original;});
   fractureMaterials.forEach(m=>{m.emissive.setHex(selection==='clavicle'?0x9ab32e:0);m.emissiveIntensity=.5;});
   const points=new Map<AnatomyId,T.Vector3>();
   anatomyAnchors.forEach(({point,segment,count},id)=>{const group=bodyGroups.get(segment);if(group)points.set(id,point.clone().divideScalar(count).applyMatrix4(group.matrixWorld));});
   controls.update();anatomyOverlay.update(camera,points,options.overlays,options.focused,options.lang);renderer.render(scene,camera);
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
     const educationalId=anatomyId(part.name);
     if(educationalId){
      const center=new T.Vector3().fromArray(part.bounds[0]).add(new T.Vector3().fromArray(part.bounds[1])).multiplyScalar(.5).sub(origin);
      const anchor=anatomyAnchors.get(educationalId)??{point:new T.Vector3(),segment,count:0};anchor.point.add(center);anchor.count++;anatomyAnchors.set(educationalId,anchor);
     }
     if(fracture&&part.name===fracture.bone){
      const layout=fractureLayout(geometry.getAttribute('position').array as Float32Array,fracture.pattern,fracture.location);
      geometry.setAttribute('position',new T.BufferAttribute(layout.positions,3));
      const center=new T.Vector3().fromArray(part.bounds[0]).add(new T.Vector3().fromArray(part.bounds[1])).multiplyScalar(.5),anchor=new T.Group();anchor.position.copy(center).sub(origin);group.add(anchor);
      fractureAnchor=new T.Object3D();fractureAnchor.position.copy(layout.normal).multiplyScalar(layout.cuts[0]);anchor.add(fractureAnchor);
      layout.fragments.forEach((fragment,index)=>{
       const world=fragment.planes.map(plane=>plane.clone()),piece=new T.Group();anchor.add(piece);
       piece.add(new T.Mesh(geometry,material([0xffcf8d,0xb9dbe0,0xff875e][index],{side:T.DoubleSide,clippingPlanes:world})));
       const edges=fragment.edges.map(plane=>{const cut=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(fractureContour(layout.positions,geometry.index!.array as Uint32Array,plane.normal,-plane.constant,fragment.planes),3));geometries.push(cut);const line=new T.LineSegments(cut,new T.LineBasicMaterial({color:0xff875e,depthTest:false}));materials.push(line.material);line.renderOrder=2;piece.add(line);return line;});
       bodyFragments.push({group:piece,local:fragment.planes,world,edges,normal:layout.normal,lateral:layout.lateral,span:layout.span,index,count:layout.fragments.length});
      });
     }else if(part.name==='Right clavicle'&&!fracture){
      const center=new T.Vector3().fromArray(part.bounds[0]).add(new T.Vector3().fromArray(part.bounds[1])).multiplyScalar(.5);
      const anchor=new T.Group();anchor.position.copy(center).sub(origin);group.add(anchor);
      for(let i=0;i<2;i++){
       const fragment=new T.Group(),mesh=new T.Mesh(geometry,fractureMaterials[i]);mesh.position.copy(center).negate();fragment.add(mesh);anchor.add(fragment);fragments.push(fragment);
       const local=new T.Plane(new T.Vector3(i===0?1:-1,0,0),0),plane=local.clone();localPlanes.push(local);planes.push(plane);fractureMaterials[i].clippingPlanes=[plane];
      }
     }else{
      const mesh=new T.Mesh(geometry,segment.startsWith('right')&&/Arm|Hand/.test(segment)?armMaterial:boneMaterial);mesh.position.copy(origin).negate();group.add(mesh);
      if(educationalId)anatomyMeshes.push({mesh,original:mesh.material,id:educationalId});
     }
    }
   }
   if(!disposed){setStatus('ready');scenarioOptions.current.onReady();}
  }catch{if(!disposed)setStatus('error');}})();
  return()=>{disposed=true;abort.abort();cancelAnimationFrame(frame);observer.disconnect();controls.dispose();anatomyOverlay.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();};
 },[attempt,scenario,fracture?.bone,fracture?.pattern,fracture?.location]);
 return <div className="fall-stage" ref={host} role="region" aria-label={label} data-phase={(scenario?scenarioPose(progress,scenario):fallPose(progress)).phase}>
  {status==='loading'&&<p className="fall-loading" role="status">Loading anatomy / Анатоми ачаалж байна…</p>}
  {status==='error'&&<div className="fall-loading" role="alert"><p>Unable to load the scene / Загварыг ачаалж чадсангүй.</p><button onClick={()=>setAttempt(n=>n+1)}>Retry / Дахин оролдох</button></div>}
 </div>;
}
