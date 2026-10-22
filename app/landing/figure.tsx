import {useEffect,useRef,type RefObject} from 'react';
import * as T from 'three';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {figureData} from './figure-data';

// Camera framing for each [data-pose] marker on the page. The figure eases between the two
// markers around the middle of the viewport, so scrolling turns, peels and reframes the body.
// x: horizontal shift as a share of the viewport. y: height the camera looks at (metres).
// glass: 0 shows the glossy skin, 1 turns it to dotted glass with bones and organs glowing inside.
type Pose={x:number;y:number;dist:number;yaw:number;pitch:number;roll:number;glass:number;fade:number};
const POSES:Record<string,Pose>={
 hero:{x:-.15,y:1.36,dist:1.8,yaw:-.55,pitch:.06,roll:.04,glass:0,fade:1},
 strip:{x:0,y:1.42,dist:1.55,yaw:-1.4,pitch:.02,roll:.1,glass:.15,fade:1},
 word0:{x:.04,y:1.48,dist:1.45,yaw:1.2,pitch:.1,roll:0,glass:.35,fade:1},
 word1:{x:0,y:1.47,dist:1.4,yaw:0,pitch:.04,roll:0,glass:1,fade:1},
 word2:{x:0,y:1.5,dist:1.3,yaw:-.2,pitch:-.02,roll:0,glass:0,fade:1},
 stats:{x:0,y:1.4,dist:1.65,yaw:.25,pitch:.04,roll:0,glass:.45,fade:1},
 unlock:{x:-.22,y:1.38,dist:1.7,yaw:.08,pitch:.02,roll:0,glass:.12,fade:1},
 finale:{x:-.22,y:1.3,dist:2.6,yaw:.6,pitch:.1,roll:0,glass:.6,fade:0},
};
const KEYS=Object.keys(POSES.hero) as (keyof Pose)[];
const smooth=(t:number)=>t*t*(3-2*t);

const VERTEX=`
uniform float uInflate;
varying vec3 vNormal;varying vec3 vView;varying float vY;
void main(){
 vec3 p=position+normal*uInflate;
 vec4 world=modelMatrix*vec4(p,1.);
 vNormal=normalize(mat3(modelMatrix)*normal);
 vView=cameraPosition-world.xyz;
 vY=position.y;
 gl_Position=projectionMatrix*viewMatrix*world;
}`;
// Shared lighting: a soft wrap-around key light, two highlights and a fresnel term for the rim.
const LIGHT=`
uniform float uFade;uniform float uGlass;uniform float uDot;
varying vec3 vNormal;varying vec3 vView;varying float vY;
float cut(){return smoothstep(.97,1.13,vY)*uFade;}
void light(out float ndv,out float diff,out float spec,out float fres){
 vec3 n=normalize(vNormal),v=normalize(vView),l=normalize(vec3(-.55,.8,.65));
 ndv=clamp(dot(n,v),0.,1.);
 diff=clamp(dot(n,l)*.5+.5,0.,1.);
 spec=pow(clamp(dot(n,normalize(l+v)),0.,1.),70.)+.35*pow(clamp(dot(n,normalize(normalize(vec3(.8,.2,.6))+v)),0.,1.),26.);
 fres=pow(1.-ndv,2.);
}
float halftone(float level){
 vec2 g=fract(gl_FragCoord.xy/uDot)-.5;
 float r=mix(.04,.48,level);
 return 1.-smoothstep(r-.07,r+.05,length(g));
}`;
const SHELL=LIGHT+`
void main(){
 float ndv,diff,spec,fres;light(ndv,diff,spec,fres);
 vec3 col=mix(vec3(.03,.1,.86),vec3(.13,.43,1.),diff);
 col=mix(col,vec3(.4,.93,1.),smoothstep(.15,.95,fres));
 col+=vec3(.42,0.,.5)*smoothstep(.1,.45,fres)*(1.-smoothstep(.45,.85,fres))*.45;
 col+=spec;
 float dots=halftone(clamp(1.15-diff*1.1+fres*.3,0.,1.));
 vec3 solid=mix(col,mix(col*.6,vec3(.45,.8,1.),.3),dots*.5*(1.-spec));
 float glass=clamp(fres*1.15+dots*.4+spec*.8,0.,1.);
 gl_FragColor=vec4(solid,mix(1.,glass,uGlass)*cut());
}`;
const HALO=LIGHT+`
void main(){
 float ndv,diff,spec,fres;light(ndv,diff,spec,fres);
 gl_FragColor=vec4(.2,.78,1.,pow(1.-abs(dot(normalize(vNormal),normalize(vView))),4.)*.4*cut());
}`;
const INNER=LIGHT+`
uniform vec3 uColor;uniform vec3 uRim;
void main(){
 float ndv,diff,spec,fres;light(ndv,diff,spec,fres);
 vec3 col=mix(uColor*(.55+.5*diff),uRim,smoothstep(.1,.9,fres))+spec*.45;
 gl_FragColor=vec4(col,uGlass*cut()*(.55+.45*halftone(1.-diff*.6)));
}`;

// Reads the meshopt-encoded file written by scripts/build-landing-figure.mjs (its header describes the layout).
async function loadFigure(){
 const [buffer]=await Promise.all([figureData(),MeshoptDecoder.ready]);
 const [count,normalStride]=new Uint32Array(buffer,0,2),sizes=new Uint32Array(buffer,8,count*5),ranges=new Float32Array(buffer,8+count*20,count*6);
 let offset=8+count*44;
 const take=(bytes:number)=>{offset=Math.ceil(offset/4)*4;const slice=new Uint8Array(buffer,offset,bytes);offset+=bytes;return slice;};
 return Array.from({length:count},(_,i)=>{
  const [vertices,indexCount,positionBytes,normalBytes,indexBytes]=sizes.subarray(i*5,i*5+5),range=ranges.subarray(i*6,i*6+6);
  const quantized=new Uint16Array(vertices*4);MeshoptDecoder.decodeVertexBuffer(new Uint8Array(quantized.buffer),vertices,8,take(positionBytes));
  const normals=normalStride===4?new Int8Array(vertices*4):new Int16Array(vertices*4);MeshoptDecoder.decodeVertexBuffer(new Uint8Array(normals.buffer),vertices,normalStride,take(normalBytes),'OCTAHEDRAL');
  const indices=vertices<65536?new Uint16Array(indexCount):new Uint32Array(indexCount);MeshoptDecoder.decodeIndexBuffer(new Uint8Array(indices.buffer),indexCount,indices.BYTES_PER_ELEMENT,take(indexBytes));
  const positions=new Float32Array(vertices*3);
  for(let v=0;v<vertices;v++)for(let a=0;a<3;a++)positions[v*3+a]=range[a]+quantized[v*4+a]*range[3+a];
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.BufferAttribute(positions,3));
  g.setAttribute('normal',new T.InterleavedBufferAttribute(new T.InterleavedBuffer(normals,4),3,0,true));
  g.setIndex(new T.BufferAttribute(indices,1));
  return g;
 });
}

export default function Figure({scroller,onReady}:{scroller:RefObject<HTMLElement|null>;onReady?:()=>void}){
 const host=useRef<HTMLDivElement>(null),announce=useRef(onReady);
 announce.current=onReady;
 useEffect(()=>{
  const el=host.current!,root=scroller.current!;
  let disposed=false;
  let renderer:T.WebGLRenderer;
  try{renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});}catch{return;}
  renderer.setClearColor(0x000000,0);el.appendChild(renderer.domElement);
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(30,1,.05,20),body=new T.Group();scene.add(body);
  const uniforms={uFade:{value:0},uGlass:{value:0},uDot:{value:5},uInflate:{value:0}};
  const material=(fragmentShader:string,extra:Record<string,T.IUniform>={},side:T.Side=T.FrontSide)=>new T.ShaderMaterial({vertexShader:VERTEX,fragmentShader,uniforms:{...uniforms,...extra},transparent:true,depthWrite:false,side});
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const current={...POSES.hero},pointer={x:0,y:0,tx:0,ty:0};
  let frame=0,loadedAt=0,width=0,height=0,ready=false;
  const resize=()=>{
   width=innerWidth;height=innerHeight;renderer.setPixelRatio(Math.min(devicePixelRatio,width<768?1.5:1.75));renderer.setSize(width,height);
   camera.aspect=width/height;camera.updateProjectionMatrix();uniforms.uDot.value=6*renderer.getPixelRatio();
  };
  const target=():Pose=>{
   const mid=root.clientHeight/2,points=[...root.querySelectorAll<HTMLElement>('[data-pose]')].map(m=>{const r=m.getBoundingClientRect();return{center:r.top+r.height/2,pose:POSES[m.dataset.pose!]};}).filter(p=>p.pose);
   if(!points.length)return POSES.hero;
   if(mid<=points[0].center)return points[0].pose;
   for(let i=0;i<points.length-1;i++){
    const a=points[i],b=points[i+1];if(mid>=b.center)continue;
    const t=smooth((mid-a.center)/(b.center-a.center)),pose={} as Pose;
    for(const k of KEYS)pose[k]=a.pose[k]+(b.pose[k]-a.pose[k])*t;
    return pose;
   }
   return points[points.length-1].pose;
  };
  const move=(e:PointerEvent)=>{pointer.tx=e.clientX/innerWidth*2-1;pointer.ty=e.clientY/innerHeight*2-1;};
  const tick=(now:number)=>{
   frame=requestAnimationFrame(tick);if(!ready)return;
   const goal=target(),ease=reduce?1:.075;
   for(const k of KEYS)current[k]+=(goal[k]-current[k])*ease;
   pointer.x+=(pointer.tx-pointer.x)*.05;pointer.y+=(pointer.ty-pointer.y)*.05;
   const intro=reduce?1:smooth(Math.min(1,(now-loadedAt)/1400)),time=reduce?0:now/1000;
   const fade=current.fade*intro;
   if(fade<.002&&uniforms.uFade.value<.002)return;
   uniforms.uFade.value=fade;uniforms.uGlass.value=current.glass;
   inner.forEach(m=>{m.visible=current.glass>.01;});
   // Small screens keep the body centred under the stacked text; a portrait tablet keeps it
   // a little larger, because it has more height to work with.
   const narrow=width<760,tablet=!narrow&&width<1100&&height>width;
   const scale=narrow?Math.min(1.5,.72/Math.max(camera.aspect,.3)):tablet?Math.max(1.1,Math.min(1.45,.9/Math.max(camera.aspect,.4))):1;
   const dist=current.dist*scale+(1-intro)*.6;
   body.rotation.set(0,current.yaw+Math.sin(time*.35)*.07+pointer.x*.14,current.roll+Math.sin(time*.27)*.012);
   const pitch=current.pitch+pointer.y*.04,y=current.y+Math.sin(time*.8)*.008;
   camera.position.set(0,y+Math.sin(pitch)*dist,Math.cos(pitch)*dist);camera.lookAt(0,y,0);
   camera.setViewOffset(width,height,-current.x*(narrow?.2:tablet?.3:1)*width,0,width,height);
   renderer.render(scene,camera);
  };
  const inner:T.Mesh[]=[];
  resize();addEventListener('resize',resize);addEventListener('pointermove',move,{passive:true});frame=requestAnimationFrame(tick);
  loadFigure().then(([shell,bones,organs])=>{
   if(disposed){[shell,bones,organs].forEach(g=>g.dispose());return;}
   const halo=new T.Mesh(shell,material(HALO,{uInflate:{value:.008}},T.BackSide));halo.renderOrder=0;
   const bone=new T.Mesh(bones,material(INNER,{uColor:{value:new T.Color(.98,.32,.36)},uRim:{value:new T.Color(1,.78,.62)}}));bone.renderOrder=1;
   const organ=new T.Mesh(organs,material(INNER,{uColor:{value:new T.Color(.86,.05,.2)},uRim:{value:new T.Color(1,.45,.5)}}));organ.renderOrder=2;
   // The skin writes depth so its own folds (arm against chest) never draw over the nearer surface.
   const skin=new T.Mesh(shell,material(SHELL));skin.material.depthWrite=true;skin.renderOrder=3;
   inner.push(bone,organ);body.add(halo,bone,organ,skin);
   ready=true;loadedAt=performance.now();announce.current?.();
  }).catch(()=>{});
  return()=>{
   disposed=true;cancelAnimationFrame(frame);removeEventListener('resize',resize);removeEventListener('pointermove',move);
   scene.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();(o.material as T.Material).dispose();}});
   renderer.dispose();renderer.domElement.remove();
  };
 },[scroller]);
 return <div ref={host} className="lp-figure" aria-hidden/>;
}
