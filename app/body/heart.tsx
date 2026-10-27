import {useEffect,useRef} from 'react';
import * as T from 'three';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';

// The heart and the stumps of its great vessels as ice-blue glass, with the coronary vessels glowing
// inside. The geometry comes from scripts/build-body-heart.mjs. It beats gently, turns on its own and
// can be spun with a drag; it renders only while it is on screen.
let pending:Promise<ArrayBuffer>|null=null;
const heartData=()=>pending??=fetch('/body/heart.bin').then(r=>{if(!r.ok)throw new Error('The heart could not be loaded.');return r.arrayBuffer();}).catch(e=>{pending=null;throw e;});

// Same layout as /landing/figure.bin; see the build script header.
async function loadHeart(){
 const [buffer]=await Promise.all([heartData(),MeshoptDecoder.ready]);
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

const VERTEX=`
uniform float uInflate;
varying vec3 vNormal;varying vec3 vView;
void main(){
 vec4 world=modelMatrix*vec4(position+normal*uInflate,1.);
 vNormal=normalize(mat3(modelMatrix)*normal);
 vView=cameraPosition-world.xyz;
 gl_Position=projectionMatrix*viewMatrix*world;
}`;
// Ice glass: deep blue where the surface faces the camera, near white along the rim, two sharp highlights.
const GLASS=`
uniform float uFade;uniform float uBack;
varying vec3 vNormal;varying vec3 vView;
void main(){
 vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;
 vec3 v=normalize(vView),l=normalize(vec3(-.5,.85,.6));
 float ndv=clamp(dot(n,v),0.,1.),fres=pow(1.-ndv,2.2),diff=clamp(dot(n,l)*.5+.5,0.,1.);
 float spec=pow(clamp(dot(n,normalize(l+v)),0.,1.),90.)+.45*pow(clamp(dot(n,normalize(normalize(vec3(.75,-.25,.6))+v)),0.,1.),28.);
 vec3 col=mix(vec3(.02,.12,.48),vec3(.14,.46,.98),diff);
 col=mix(col,vec3(.78,.95,1.),smoothstep(.35,1.,fres));
 col+=spec*(1.-uBack*.7);
 float alpha=clamp(.3+fres*.75+spec,0.,1.)*mix(1.,.5,uBack);
 gl_FragColor=vec4(col,alpha*uFade);
}`;
const GLOW=`
uniform float uFade;uniform vec3 uColor;
varying vec3 vNormal;varying vec3 vView;
void main(){
 float ndv=abs(dot(normalize(vNormal),normalize(vView)));
 gl_FragColor=vec4(uColor,(.35+.65*ndv)*uFade);
}`;
const HALO=`
uniform float uFade;
varying vec3 vNormal;varying vec3 vView;
void main(){
 float edge=pow(1.-abs(dot(normalize(vNormal),normalize(vView))),3.);
 gl_FragColor=vec4(.55,.85,1.,edge*.5*uFade);
}`;

// A lub-dub pulse: two quick swells per beat at about 62 beats a minute.
const beat=(t:number)=>{const p=(t*62/60)%1;return Math.exp(-((p-.08)**2)/.0016)+.55*Math.exp(-((p-.27)**2)/.0022);};

export default function CrystalHeart(){
 const host=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const el=host.current!;
  let disposed=false,frame=0,visible=true,ready=false,loadedAt=0;
  let renderer:T.WebGLRenderer;
  try{renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}catch{return;}
  renderer.setClearColor(0x000000,0);renderer.setPixelRatio(Math.min(devicePixelRatio,2));el.appendChild(renderer.domElement);
  // pivot turns the heart, heart beats it about its own centre, offset moves that centre to the origin.
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(28,1,.01,10),pivot=new T.Group(),heart=new T.Group(),offset=new T.Group();
  heart.add(offset);pivot.add(heart);scene.add(pivot);
  const fade={value:0};
  const material=(fragmentShader:string,extra:Record<string,T.IUniform>={},side:T.Side=T.FrontSide,blending:T.Blending=T.NormalBlending)=>new T.ShaderMaterial({vertexShader:VERTEX,fragmentShader,uniforms:{uFade:fade,uInflate:{value:0},...extra},transparent:true,depthWrite:false,side,blending});
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const spin={yaw:-.5,velocity:0,dragging:false,x:0};
  let width=0,height=0;
  const resize=()=>{
   width=el.clientWidth;height=el.clientHeight;if(!width||!height)return;
   renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
  };
  const fit=(radius:number)=>{
   const fov=T.MathUtils.degToRad(camera.fov)/2,dist=radius/Math.sin(Math.min(fov,Math.atan(Math.tan(fov)*camera.aspect)));
   camera.position.set(0,radius*.12,dist*1.02);camera.lookAt(0,0,0);
  };
  let radius=.1;
  const tick=(now:number)=>{
   frame=0;if(disposed||!ready||!width)return;
   const time=now/1000,intro=reduce?1:Math.min(1,(now-loadedAt)/900);
   fade.value=intro*intro*(3-2*intro);
   if(!spin.dragging){spin.velocity*=.94;spin.yaw+=spin.velocity+(reduce?0:.0045);}
   pivot.rotation.set(-.12,spin.yaw,.32);
   heart.scale.setScalar(1+(reduce?0:beat(time)*.035));
   renderer.render(scene,camera);
   if(!reduce||intro<1||spin.dragging||Math.abs(spin.velocity)>1e-4)request();
  };
  const request=()=>{if(!frame&&visible&&!document.hidden)frame=requestAnimationFrame(tick);};
  const sizeObserver=new ResizeObserver(()=>{resize();fit(radius);request();});sizeObserver.observe(el);
  const seen=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;request();});seen.observe(el);
  const wake=()=>request();document.addEventListener('visibilitychange',wake);
  const down=(e:PointerEvent)=>{spin.dragging=true;spin.x=e.clientX;spin.velocity=0;el.setPointerCapture(e.pointerId);request();};
  const move=(e:PointerEvent)=>{if(!spin.dragging)return;const dx=(e.clientX-spin.x)*.012;spin.x=e.clientX;spin.yaw+=dx;spin.velocity=dx;request();};
  const up=()=>{spin.dragging=false;request();};
  el.addEventListener('pointerdown',down);el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
  loadHeart().then(([shell,vessels])=>{
   if(disposed){shell.dispose();vessels.dispose();return;}
   shell.computeBoundingSphere();
   const sphere=shell.boundingSphere!;radius=sphere.radius;
   offset.position.copy(sphere.center).multiplyScalar(-1);
   const halo=new T.Mesh(shell,material(HALO,{uInflate:{value:radius*.035}},T.BackSide,T.AdditiveBlending));halo.renderOrder=0;
   const back=new T.Mesh(shell,material(GLASS,{uBack:{value:1}},T.BackSide));back.renderOrder=1;
   const glow=new T.Mesh(vessels,material(GLOW,{uColor:{value:new T.Color(.7,.92,1)}},T.FrontSide,T.AdditiveBlending));glow.renderOrder=2;
   const front=new T.Mesh(shell,material(GLASS,{uBack:{value:0}}));front.renderOrder=3;
   offset.add(halo,back,glow,front);
   fit(radius);ready=true;loadedAt=performance.now();request();
  }).catch(()=>{});
  return()=>{
   disposed=true;cancelAnimationFrame(frame);sizeObserver.disconnect();seen.disconnect();document.removeEventListener('visibilitychange',wake);
   el.removeEventListener('pointerdown',down);el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);
   scene.traverse(o=>{if(o instanceof T.Mesh)(o.material as T.Material).dispose();});
   offset.children.forEach(o=>(o as T.Mesh).geometry.dispose());
   renderer.dispose();renderer.domElement.remove();
  };
 },[]);
 return <div ref={host} className="bc-heart-canvas" aria-hidden/>;
}
