// Adds structures missing from BodyParts3D using Z-Anatomy FBX exports (CC BY-SA 4.0; see public/ATTRIBUTION.md).
// Usage: node --max-old-space-size=8000 scripts/import-zanatomy.mjs FBX_DIRECTORY [--include-nc]
// FBX source: https://github.com/LluisV/Z-Anatomy/tree/PC-Version/Resources/Models/FBX
// Idempotent: earlier imported parts, concepts, and chunks are replaced. --include-nc adds the cochlea and vestibule,
// which derive from a CC BY-NC-SA model and must not be used commercially.
import fs from 'node:fs';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {MeshoptSimplifier} from 'meshoptimizer';
// FBXLoader only touches these browser globals when creating textures, which the anatomy meshes do not use.
globalThis.self=globalThis;globalThis.window=globalThis;
globalThis.document={createElementNS:()=>({style:{},addEventListener(){},setAttribute(){}})};
const THREE=await import('three');
const {FBXLoader}=await import('three/examples/jsm/loaders/FBXLoader.js');
await MeshoptSimplifier.ready;

const source=process.argv[2],includeNC=process.argv.includes('--include-nc');
if(!source)throw new Error('Pass the directory that holds the Z-Anatomy FBX files.');
const dir=new URL('../public/models/',import.meta.url),atlasPath=new URL('atlas.json',dir);
const atlas=JSON.parse(fs.readFileSync(atlasPath,'utf8'));
const PREFIX='ZA',CHUNK='zanatomy';

// Remove the output of a previous run so the import can be repeated.
const keep=atlas.chunks.map((c,i)=>[c,i]).filter(([c])=>!c.url.includes(`/${CHUNK}-`));
for(const c of atlas.chunks.filter(c=>c.url.includes(`/${CHUNK}-`)))for(const u of [c.url,c.gzip])if(u)fs.rmSync(new URL(u.split('/').pop(),dir),{force:true});
const removed=atlas.parts.filter(p=>p.id.startsWith(PREFIX));
atlas.parts=atlas.parts.filter(p=>!p.id.startsWith(PREFIX));
atlas.concepts=atlas.concepts.filter(c=>!c.id.startsWith(`${PREFIX}:`));
atlas.triangles-=removed.reduce((n,p)=>n+p.indexCount/3,0);
atlas.chunks=keep.map(([c])=>c);

// Which source meshes to add, and the display system for each. Structures already in the atlas are skipped by name.
const SOURCES=[
 ['NervousSystem100.fbx',[
  ['sensory',/^(tympanic membrane|auditory tube)$/],
  ...(includeNC?[['sensory',/^(cochlea|vestibule)$/]]:[]),
  ['nervous',/nerve|plexus|gangli|sympathetic|cauda equina|spinal|tract$|fasciculus|horn of|nucleus proprius|intermedio|intermediate substance|reticular process|spinal dura|falx cerebri|tentorium cerebelli|chorda tympani|root of/],
 ],/nucleus of|nuclei|salivatory|vestibular nuclei|optic tract|cochlea$|vestibule$/],
 ['LymphoidOrgans100.fbx',[['lymphatic',/nodes?$|tonsil/]],/^lymph node$/],
 ['VisceralSystem100.fbx',[
  ['endocrine',/^(thyroid gland|superior parathyroid gland|inferior parathyroid gland)$/],
  ['digestive',/^(parotid gland|accessory parotid gland|parotid duct|submandibular duct|soft palate|uvula of palate|nasopharynx|oropharynx|laryngopharynx|bile duct|accessory pancreatic duct)$/],
  ['respiratory',/^(mucosa of nasal cavity|sinus of frontal bone|sinus of sphenoid bone)$/],
  ['urinary',/^renal pelvis$/],
 ]],
 ['SkeletalSystem100.fbx',[['sensory',/^(malleus|incus|stapes)$/]]],
 ['Joints100.fbx',[['connective',/meniscus|meniscotibial|meniscopatellar|cruciate ligament|collateral ligament$|tibial collateral|transverse ligament of knee|popliteal ligament|popliteofibular|articular capsule of knee|infrapatellar fat pad|sacrospinous|sacrotuberous|sacro-iliac|iliolumbar|obturator membrane|pubic symphysis|pubic ligament|interpubic disc/]]],
];

const loader=new FBXLoader();
function load(file){
 const b=fs.readFileSync(path.join(source,file));
 const root=loader.parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');root.updateMatrixWorld(true);
 const meshes=[];root.traverse(o=>{if(o.isMesh&&o.geometry.attributes.position.count>36)meshes.push(o);});
 return meshes;
}
// Z-Anatomy marks sides with a trailing l/r; labels end in j/i and carry no anatomy.
function parse(name,names){
 let base=name.replace(/['*]/g,''),side='';
 const last=base.slice(-1),stem=base.slice(0,-1);
 if((last==='l'||last==='r')&&(names.has(stem+(last==='l'?'r':'l'))||/\)$/.test(stem))){side=last==='l'?'left':'right';base=stem;}
 base=base.replace(/_+/g,' ').replace(/^\((.*)\)$/,'$1').replace(/\s+/g,' ').trim();
 return {side,base,key:base.toLowerCase().replace(/ \([ivx]+\)$/,'')};
}
const normalize=name=>name.toLowerCase().replace(/\b(left|right) /g,'').replace(/ +/g,' ').trim();
const existing=new Set(atlas.parts.map(p=>normalize(p.name)));

function worldGeometry(mesh){
 const g=mesh.geometry.clone();g.applyMatrix4(mesh.matrixWorld);if(!g.attributes.normal)g.computeVertexNormals();
 const pos=g.attributes.position.array,nor=g.attributes.normal.array,index=g.index?g.index.array:null;
 // FBX exports split vertices per face; weld coincident positions and average their normals before simplifying.
 const map=new Map(),wp=[],wn=[],count=g.attributes.position.count,remap=new Uint32Array(count);
 for(let i=0;i<count;i++){
  const k=`${pos[i*3].toFixed(4)},${pos[i*3+1].toFixed(4)},${pos[i*3+2].toFixed(4)}`;let n=map.get(k);
  if(n===undefined){n=wp.length/3;map.set(k,n);wp.push(pos[i*3],pos[i*3+1],pos[i*3+2]);wn.push(0,0,0);}
  remap[i]=n;for(let a=0;a<3;a++)wn[n*3+a]+=nor[i*3+a];
 }
 const indices=index?Uint32Array.from(index,i=>remap[i]):remap;
 return {positions:new Float32Array(wp),normals:wn,indices};
}
function bounds(p){const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<p.length;i+=3)for(let a=0;a<3;a++){min[a]=Math.min(min[a],p[i+a]);max[a]=Math.max(max[a],p[i+a]);}return [min,max];}
const center=b=>b[0].map((v,i)=>(v+b[1][i])/2);

// Both models share BodyParts3D axes (Y up, +X left, +Z anterior); Z-Anatomy is in centimeters at a different origin.
// Fit one scale and a translation from bones present in both, rejecting pairs whose remeshing moved them.
const skeleton=load('SkeletalSystem100.fbx'),skeletonNames=new Set(skeleton.map(m=>m.name));
const byName=new Map(atlas.parts.filter(p=>p.system==='skeletal').map(p=>[p.name.toLowerCase(),p]));
let pairs=[];
for(const mesh of skeleton){
 const {side,base}=parse(mesh.name,skeletonNames),part=byName.get(`${side?side+' ':''}${base}`.toLowerCase());
 if(part)pairs.push([center(bounds(worldGeometry(mesh).positions)),center(part.bounds)]);
}
let scale=0,offset=[0,0,0];
for(let pass=0;pass<3;pass++){
 const mean=k=>[0,1,2].map(a=>pairs.reduce((n,p)=>n+p[k][a],0)/pairs.length),mz=mean(0),ma=mean(1);
 let num=0,den=0;for(const [z,a] of pairs)for(let i=0;i<3;i++){num+=(z[i]-mz[i])*(a[i]-ma[i]);den+=(z[i]-mz[i])**2;}
 scale=num/den;offset=ma.map((v,i)=>v-scale*mz[i]);
 const residual=([z,a])=>Math.hypot(...[0,1,2].map(i=>scale*z[i]+offset[i]-a[i]));
 if(pass<2)pairs=pairs.filter(p=>residual(p)<.015);
 else{const r=pairs.map(residual).sort((x,y)=>x-y);console.log(`Aligned with ${pairs.length} bones: scale ${scale.toFixed(6)}, median error ${(r[r.length>>1]*1000).toFixed(1)} mm`);}
}

const parts=[],concepts=new Map(),segments=[],chunks=[];let bytes=0,triangles=0,skipped=0;
const flush=()=>{if(!bytes)return;const url=`/models/${CHUNK}-${chunks.length}.bin`,data=Buffer.concat(segments),gz=gzipSync(data,{level:9});
 fs.writeFileSync(new URL(url.split('/').pop(),dir),data);fs.writeFileSync(new URL(url.split('/').pop()+'.gz',dir),gz);
 chunks.push({url,bytes:data.length,gzip:url+'.gz',gzipBytes:gz.length});segments.length=0;bytes=0;};
const append=a=>{const padding=(4-bytes%4)%4;if(padding){segments.push(Buffer.alloc(padding));bytes+=padding;}const offset=bytes,b=Buffer.from(a.buffer,a.byteOffset,a.byteLength);segments.push(b);bytes+=b.length;return offset;};
const seen=new Set();
for(const [file,rules,exclude] of SOURCES){
 const meshes=file==='SkeletalSystem100.fbx'?skeleton:load(file),names=new Set(meshes.map(m=>m.name));
 for(const mesh of meshes){
  const {side,base,key}=parse(mesh.name,names),rule=rules.find(([,pattern])=>pattern.test(key));
  if(!rule||exclude?.test(key))continue;
  const name=`${side?side[0].toUpperCase()+side.slice(1)+' ':''}${side?base[0].toLowerCase()+base.slice(1):base}`;
  if(existing.has(key)||existing.has(normalize(name))||seen.has(name.toLowerCase())){skipped++;continue;}
  seen.add(name.toLowerCase());
  const g=worldGeometry(mesh),pos=g.positions;
  for(let i=0;i<pos.length;i+=3)for(let a=0;a<3;a++)pos[i+a]=pos[i+a]*scale+offset[a];
  const normals=new Int16Array(g.normals.length);
  for(let i=0;i<normals.length;i+=3){const l=Math.hypot(g.normals[i],g.normals[i+1],g.normals[i+2])||1;for(let a=0;a<3;a++)normals[i+a]=Math.round(g.normals[i+a]/l*32767);}
  // Same budget as optimize-anatomy.mjs: keep small structures, bound error to 0.2% of each part's extent.
  const target=Math.max(96,Math.floor(g.indices.length*.22/3)*3);
  const [simplified]=MeshoptSimplifier.simplify(g.indices,pos,3,Math.min(g.indices.length,target),.002);
  if(simplified.length<3)continue;
  const [remap,count]=MeshoptSimplifier.compactMesh(simplified);
  const positions=new Float32Array(count*3),compactNormals=new Int16Array(count*3);
  for(let old=0;old<remap.length;old++){const n=remap[old];if(n===0xffffffff)continue;positions.set(pos.subarray(old*3,old*3+3),n*3);compactNormals.set(normals.subarray(old*3,old*3+3),n*3);}
  if(bytes>4_000_000)flush();
  const conceptId=`${PREFIX}:${key.replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}`,id=`${PREFIX}${String(parts.length+1).padStart(4,'0')}`;
  const offsets={chunk:atlas.chunks.length+chunks.length,positions:append(positions),normals:append(compactNormals),indices:append(simplified)};
  parts.push({id,name,conceptId,system:rule[0],...offsets,vertexCount:count,indexCount:simplified.length,bounds:bounds(positions)});
  if(!concepts.has(conceptId))concepts.set(conceptId,{id:conceptId,name:base.toLowerCase(),elements:[]});
  concepts.get(conceptId).elements.push(id);triangles+=simplified.length/3;
 }
}
flush();
atlas.parts.push(...parts);atlas.concepts.push(...concepts.values());atlas.chunks.push(...chunks);atlas.triangles+=triangles;
atlas.supplement={source:'Z-Anatomy',license:'CC BY-SA 4.0',parts:parts.length,nonCommercialIncluded:includeNC};
fs.writeFileSync(atlasPath,JSON.stringify(atlas));
const bySystem={};for(const p of parts)bySystem[p.system]=(bySystem[p.system]??0)+1;
console.log(JSON.stringify({added:parts.length,concepts:concepts.size,skippedExisting:skipped,triangles,chunks:chunks.length,gzipBytes:chunks.reduce((n,c)=>n+c.gzipBytes,0),bySystem}));
