import fs from 'node:fs';
import {MeshoptEncoder,MeshoptSimplifier} from 'meshoptimizer';
await Promise.all([MeshoptSimplifier.ready,MeshoptEncoder.ready]);
// Builds the small bust the landing page renders: the skin as a glossy shell plus the bones,
// heart and lungs inside it. Everything below the hips is cut so the hero stays a head-to-waist portrait.
// Positions are quantized to 16 bits per axis, normals to 8-bit octahedral, and every stream is
// meshopt-encoded (vertex codec v0, which the decoder bundled with three.js reads).
// Layout: Uint32 [layerCount, normalStride], per layer Uint32 [vertexCount, indexCount, positionBytes,
// normalBytes, indexBytes], per layer Float32 [minX, minY, minZ, stepX, stepY, stepZ], then each layer's
// encoded positions, normals and indices, 4-byte aligned.
const CUT=.95,NORMAL_BITS=8,NORMAL_STRIDE=4;
const LAYERS=[
 {name:'shell',match:p=>p.name==='Skin',triangles:26000},
 {name:'bones',match:p=>p.system==='skeletal',triangles:36000},
 {name:'organs',match:p=>p.system==='cardiac'||p.system==='respiratory',triangles:14000},
];
const dir=new URL('../public/models/',import.meta.url),atlas=JSON.parse(fs.readFileSync(new URL('atlas.json',dir),'utf8'));
const chunks=atlas.chunks.map(c=>fs.readFileSync(new URL(c.url.split('/').pop(),dir)));
const built=LAYERS.map(layer=>{
 const pos=[],nor=[],idx=[];
 for(const p of atlas.parts.filter(layer.match)){
  const b=chunks[p.chunk],P=new Float32Array(b.buffer,b.byteOffset+p.positions,p.vertexCount*3),N=new Int16Array(b.buffer,b.byteOffset+p.normals,p.vertexCount*3),I=new Uint32Array(b.buffer,b.byteOffset+p.indices,p.indexCount);
  const remap=new Map(),base=pos.length/3;
  const vertex=i=>{let n=remap.get(i);if(n===undefined){n=base+remap.size;remap.set(i,n);pos.push(P[i*3],P[i*3+1],P[i*3+2]);nor.push(N[i*3],N[i*3+1],N[i*3+2]);}return n;};
  for(let t=0;t<I.length;t+=3){
   if(P[I[t]*3+1]<CUT&&P[I[t+1]*3+1]<CUT&&P[I[t+2]*3+1]<CUT)continue;
   idx.push(vertex(I[t]),vertex(I[t+1]),vertex(I[t+2]));
  }
 }
 const positions=new Float32Array(pos),source=new Uint32Array(idx);
 const [simplified]=MeshoptSimplifier.simplify(source,positions,3,Math.min(source.length,layer.triangles*3),.01);
 // Reorder for the vertex cache and for compression. This also drops vertices the simplifier
 // no longer uses: remap[old] is each kept vertex's new slot, or 0xffffffff.
 const [remap,count]=MeshoptEncoder.reorderMesh(simplified,true,true);
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let old=0;old<remap.length;old++){if(remap[old]===0xffffffff)continue;for(let a=0;a<3;a++){min[a]=Math.min(min[a],positions[old*3+a]);max[a]=Math.max(max[a],positions[old*3+a]);}}
 const step=max.map((m,a)=>(m-min[a])/65535||1);
 const quantized=new Uint16Array(count*4),normals=new Float32Array(count*4);
 for(let old=0;old<remap.length;old++){
  const n=remap[old];if(n===0xffffffff)continue;
  for(let a=0;a<3;a++){quantized[n*4+a]=Math.round((positions[old*3+a]-min[a])/step[a]);normals[n*4+a]=nor[old*3+a]/32767;}
 }
 const encoded={
  positions:MeshoptEncoder.encodeVertexBufferLevel(new Uint8Array(quantized.buffer),count,8,2,0),
  normals:MeshoptEncoder.encodeVertexBufferLevel(MeshoptEncoder.encodeFilterOct(normals,count,NORMAL_STRIDE,NORMAL_BITS),count,NORMAL_STRIDE,2,0),
  indices:MeshoptEncoder.encodeIndexBuffer(new Uint8Array(simplified.buffer),simplified.length,4),
 };
 console.log(layer.name,{triangles:simplified.length/3,vertices:count,bytes:encoded.positions.length+encoded.normals.length+encoded.indices.length});
 return {count,indexCount:simplified.length,min,step,encoded};
});
const header=new Uint32Array([built.length,NORMAL_STRIDE,...built.flatMap(l=>[l.count,l.indexCount,l.encoded.positions.length,l.encoded.normals.length,l.encoded.indices.length])]);
const ranges=new Float32Array(built.flatMap(l=>[...l.min,...l.step]));
const segments=[Buffer.from(header.buffer),Buffer.from(ranges.buffer)];let bytes=header.byteLength+ranges.byteLength;
const append=a=>{const padding=(4-bytes%4)%4;if(padding){segments.push(Buffer.alloc(padding));bytes+=padding;}segments.push(Buffer.from(a.buffer,a.byteOffset,a.byteLength));bytes+=a.byteLength;};
for(const l of built){append(l.encoded.positions);append(l.encoded.normals);append(l.encoded.indices);}
fs.writeFileSync(new URL('../public/landing/figure.bin',import.meta.url),Buffer.concat(segments));
console.log({bytes});
