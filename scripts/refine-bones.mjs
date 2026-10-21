// Restores full source resolution for BodyParts3D bones, which optimize-anatomy.mjs reduced to ~22% of their triangles.
// Usage: node scripts/refine-bones.mjs OBJ_DIRECTORY   (isa_BP3D_4.0_obj_99), then node scripts/compress-models.mjs
// Idempotent: bones always come straight from the OBJ; other parts are copied byte-for-byte into compacted chunks.
import fs from 'node:fs';
import path from 'node:path';
const source=process.argv[2];if(!source)throw new Error('Usage: node scripts/refine-bones.mjs OBJ_DIRECTORY');
const dir=new URL('../public/models/',import.meta.url),manifestPath=new URL('atlas.json',dir),manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const file=url=>new URL(url.split('/').pop(),dir);
const old=manifest.chunks.map(c=>({url:c.url,data:fs.readFileSync(file(c.url))}));
const isBone=p=>p.system==='skeletal'&&fs.existsSync(path.join(source,p.id+'.obj'));
// Same transform as convert-anatomy.py: millimeters/Z-up to meters/Y-up, resting on the stage.
function readObj(id){
 const v=[],n=[],idx=[];
 for(const line of fs.readFileSync(path.join(source,id+'.obj'),'utf8').split('\n')){
  if(line.startsWith('v ')){const [x,y,z]=line.split(/\s+/).slice(1,4).map(Number);v.push(x*.001,z*.001+.0781112,-y*.001-.1);}
  else if(line.startsWith('vn ')){const [x,y,z]=line.split(/\s+/).slice(1,4).map(Number);n.push(Math.round(x*32767),Math.round(z*32767),Math.round(-y*32767));}
  else if(line.startsWith('f ')){const f=line.trim().split(/\s+/).slice(1).map(s=>parseInt(s)-1);for(let j=1;j<f.length-1;j++)idx.push(f[0],f[j],f[j+1]);}
 }
 if(n.length!==v.length)throw new Error(`${id}: normals do not match vertices`);
 return {positions:new Float32Array(v),normals:new Int16Array(n),indices:new Uint32Array(idx)};
}
const chunks=[];
function packer(url){
 const segments=[];let bytes=0;
 const append=a=>{const pad=(4-bytes%4)%4;if(pad){segments.push(Buffer.alloc(pad));bytes+=pad;}const offset=bytes;segments.push(Buffer.from(a.buffer,a.byteOffset,a.byteLength));bytes+=a.byteLength;return offset;};
 return {append,get bytes(){return bytes;},flush(){if(!bytes)return false;fs.writeFileSync(file(url),Buffer.concat(segments));chunks.push({url,bytes});return true;}};
}
const place=(p,pk,g)=>{p.chunk=chunks.length;p.positions=pk.append(g.positions);p.normals=pk.append(g.normals);p.indices=pk.append(g.indices);p.vertexCount=g.positions.length/3;p.indexCount=g.indices.length;};
// Compact every existing non-bone chunk without its bones, keeping its file name; earlier bones-* chunks drop out.
const bones=manifest.parts.filter(isBone),others=manifest.parts.filter(p=>!isBone(p)),byChunk=old.map((_,i)=>others.filter(p=>p.chunk===i));
old.forEach((c,i)=>{
 if(c.url.includes('/bones-'))return;
 const pk=packer(c.url),members=byChunk[i],b=c.data;
 for(const p of members)place(p,pk,{positions:new Float32Array(b.buffer,b.byteOffset+p.positions,p.vertexCount*3),normals:new Int16Array(b.buffer,b.byteOffset+p.normals,p.vertexCount*3),indices:new Uint32Array(b.buffer,b.byteOffset+p.indices,p.indexCount)});
 pk.flush();
});
let pk=packer(`/models/bones-0.bin`),n=1,boneTriangles=0;
for(const p of bones){
 if(pk.bytes>4_000_000){pk.flush();pk=packer(`/models/bones-${n++}.bin`);}
 const g=readObj(p.id);place(p,pk,g);boneTriangles+=g.indices.length/3;
}
pk.flush();
const keep=new Set(chunks.map(c=>c.url));
for(const c of old)if(!keep.has(c.url)){fs.rmSync(file(c.url),{force:true});fs.rmSync(file(c.url+'.gz'),{force:true});}
manifest.chunks=chunks;manifest.triangles=manifest.parts.reduce((t,p)=>t+p.indexCount/3,0);
manifest.optimized={...manifest.optimized,fullResolutionSystems:['skeletal']};
fs.writeFileSync(manifestPath,JSON.stringify(manifest));
console.log(JSON.stringify({bones:bones.length,boneTriangles,triangles:manifest.triangles,chunks:chunks.length,bytes:chunks.reduce((t,c)=>t+c.bytes,0)}));
