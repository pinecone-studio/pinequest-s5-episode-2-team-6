import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

// Place fixtures under the repo so the copied optimizer resolves meshoptimizer.
const root=fileURLToPath(new URL('../',import.meta.url));
const temp=fs.mkdtempSync(path.join(root,'.mesh-preservation-'));
try{
 const scripts=path.join(temp,'scripts'),models=path.join(temp,'public/models');
 fs.mkdirSync(scripts,{recursive:true});fs.mkdirSync(models,{recursive:true});
 fs.copyFileSync(path.join(root,'scripts/optimize-anatomy.mjs'),path.join(scripts,'optimize-anatomy.mjs'));
 const positions=[],indices=[];
 for(let y=0;y<=20;y++)for(let x=0;x<=20;x++)positions.push(x/20,y/20,0);
 for(let y=0;y<20;y++)for(let x=0;x<20;x++){
  const a=y*21+x;indices.push(a,a+1,a+21,a+1,a+22,a+21);
 }
 const pos=new Float32Array(positions),idx=new Uint32Array(indices);
 const normals=new Int16Array(pos.length);
 for(let i=2;i<normals.length;i+=3)normals[i]=32767;
 const bytes=Buffer.concat([Buffer.from(pos.buffer),Buffer.from(normals.buffer),Buffer.alloc(2),Buffer.from(idx.buffer)]);
 const systems=['arterial','venous','cardiac','skeletal','digestive'];
 for(const name of ['atlas.json','female-atlas.json']){
  const parts=systems.map(system=>({id:system,system,chunk:0,positions:0,normals:pos.byteLength,
   indices:pos.byteLength+normals.byteLength+2,vertexCount:pos.length/3,indexCount:idx.length}));
  fs.writeFileSync(path.join(models,'source.bin'),bytes);
  fs.writeFileSync(path.join(models,name),JSON.stringify({parts,chunks:[{url:'/models/source.bin',bytes:bytes.length}],triangles:idx.length/3*parts.length}));
  const run=spawnSync(process.execPath,[path.join(scripts,'optimize-anatomy.mjs'),name],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  const result=JSON.parse(fs.readFileSync(path.join(models,name),'utf8'));
  assert.deepEqual(result.optimized.fullResolutionSystems,systems.slice(0,4));
  for(const part of result.parts){
   if(part.system==='digestive'){assert.ok(part.indexCount<idx.length);continue;}
   assert.equal(part.indexCount,idx.length);
   const data=fs.readFileSync(path.join(models,path.basename(result.chunks[part.chunk].url)));
   const actualPos=new Float32Array(data.buffer,data.byteOffset+part.positions,part.vertexCount*3);
   const actualIdx=new Uint32Array(data.buffer,data.byteOffset+part.indices,part.indexCount);
   const actualNormals=new Int16Array(data.buffer,data.byteOffset+part.normals,part.vertexCount*3);
   // Compaction may renumber vertices; triangle coordinates and normals must match.
   for(let i=0;i<idx.length;i++)for(let axis=0;axis<3;axis++){
    assert.equal(actualPos[actualIdx[i]*3+axis],pos[idx[i]*3+axis]);
    assert.equal(actualNormals[actualIdx[i]*3+axis],normals[idx[i]*3+axis]);
   }
  }
 }
 console.log('Source triangles and normals preserved for protected systems in both optimizer paths.');
}finally{
 assert.equal(path.dirname(path.resolve(temp)),path.resolve(root));
 fs.rmSync(temp,{recursive:true,force:true});
}
