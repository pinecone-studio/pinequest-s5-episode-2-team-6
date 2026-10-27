import fs from 'node:fs';
import {MeshoptEncoder,MeshoptSimplifier} from 'meshoptimizer';
await Promise.all([MeshoptSimplifier.ready,MeshoptEncoder.ready]);
// Builds the crystal heart the body check screen renders: the heart walls with the stumps of the
// great vessels as a glass shell, and the coronary arteries and cardiac veins glowing inside it.
// The file uses the same layout as public/landing/figure.bin (see scripts/build-landing-figure.mjs):
// Uint32 [layerCount, normalStride], per layer Uint32 [vertexCount, indexCount, positionBytes,
// normalBytes, indexBytes], per layer Float32 [minX, minY, minZ, stepX, stepY, stepZ], then each layer's
// meshopt-encoded positions, normals and indices, 4-byte aligned.
const NORMAL_BITS=8,NORMAL_STRIDE=4;
// Vessels are trimmed to short stumps so the heart keeps its familiar silhouette.
const TOP=1.43,BOTTOM=1.235;
const VESSELS=['ascending aorta','arch of aorta','pulmonary trunk','right pulmonary artery','left pulmonary artery','superior vena cava','inferior vena cava','brachiocephalic artery','left common carotid artery','left subclavian artery'];
const LAYERS=[
 {name:'shell',match:p=>(p.system==='cardiac'&&!p.name.startsWith('Cavity'))||VESSELS.includes(p.name.toLowerCase()),triangles:22000},
 {name:'vessels',match:p=>/coronary|cardiac vein|vein of left ventricle|coronary sinus/i.test(p.name),triangles:9000},
];
const dir=new URL('../public/models/',import.meta.url),atlas=JSON.parse(fs.readFileSync(new URL('atlas.json',dir),'utf8'));
const chunks=new Map();
const chunk=i=>{if(!chunks.has(i))chunks.set(i,fs.readFileSync(new URL(atlas.chunks[i].url.split('/').pop(),dir)));return chunks.get(i);};
const built=LAYERS.map(layer=>{
 const pos=[],nor=[],idx=[];
 for(const p of atlas.parts.filter(layer.match)){
  const b=chunk(p.chunk),P=new Float32Array(b.buffer,b.byteOffset+p.positions,p.vertexCount*3),N=new Int16Array(b.buffer,b.byteOffset+p.normals,p.vertexCount*3),I=new Uint32Array(b.buffer,b.byteOffset+p.indices,p.indexCount);
  const remap=new Map(),base=pos.length/3;
  const vertex=i=>{let n=remap.get(i);if(n===undefined){n=base+remap.size;remap.set(i,n);pos.push(P[i*3],P[i*3+1],P[i*3+2]);nor.push(N[i*3],N[i*3+1],N[i*3+2]);}return n;};
  const outside=i=>P[i*3+1]>TOP||P[i*3+1]<BOTTOM;
  for(let t=0;t<I.length;t+=3){
   if(outside(I[t])||outside(I[t+1])||outside(I[t+2]))continue;
   idx.push(vertex(I[t]),vertex(I[t+1]),vertex(I[t+2]));
  }
 }
 const positions=new Float32Array(pos),source=new Uint32Array(idx);
 const [simplified]=MeshoptSimplifier.simplify(source,positions,3,Math.min(source.length,layer.triangles*3),.01);
 // Reorder for the vertex cache and for compression; remap[old] is each kept vertex's new slot, or 0xffffffff.
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
fs.mkdirSync(new URL('../public/body/',import.meta.url),{recursive:true});
fs.writeFileSync(new URL('../public/body/heart.bin',import.meta.url),Buffer.concat(segments));
console.log({bytes});
