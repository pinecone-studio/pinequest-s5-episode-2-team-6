/** Per-vertex cavity for illustration-style bone shading, derived only from the mesh itself.
 *  Positive values mark concavities (fossae, grooves, foramina), negative values ridges and crests. */
export function computeCavity(positions:Float32Array,normals:Int16Array,indices:Uint32Array):Float32Array{
 const count=positions.length/3,sum=new Float32Array(count),weight=new Float32Array(count);
 // For each edge, how far the neighbour rises above this vertex's tangent plane, relative to edge length.
 const visit=(a:number,b:number)=>{
  const dx=positions[b*3]-positions[a*3],dy=positions[b*3+1]-positions[a*3+1],dz=positions[b*3+2]-positions[a*3+2],length=Math.hypot(dx,dy,dz);
  if(!length)return;
  sum[a]+=(normals[a*3]*dx+normals[a*3+1]*dy+normals[a*3+2]*dz)/32767/length;weight[a]++;
 };
 for(let i=0;i<indices.length;i+=3){
  const a=indices[i],b=indices[i+1],c=indices[i+2];
  visit(a,b);visit(b,a);visit(b,c);visit(c,b);visit(c,a);visit(a,c);
 }
 const raw=new Float32Array(count);for(let i=0;i<count;i++)raw[i]=weight[i]?sum[i]/weight[i]:0;
 // Averaging over triangle neighbourhoods; a few passes give the bone's overall shape.
 const blur=(values:Float32Array)=>{
  const out=new Float32Array(count),n=new Float32Array(count);
  for(let i=0;i<indices.length;i+=3)for(let k=0;k<3;k++){const a=indices[i+k];for(let j=0;j<3;j++){out[a]+=values[indices[i+j]];n[a]++;}}
  for(let i=0;i<count;i++)out[i]=n[i]?out[i]/n[i]:values[i];
  return out;
 };
 const local=blur(raw);let shape=local;for(let pass=0;pass<6;pass++)shape=blur(shape);
 // Local detail relative to the overall shape (so a round shaft is not one big ridge), plus a little broad concavity.
 const cavity=new Float32Array(count);
 for(let i=0;i<count;i++)cavity[i]=Math.max(-1,Math.min(1,(local[i]-shape[i])*8+Math.max(shape[i],0)*2));
 return cavity;
}

/** Shader additions for the skeletal material: cavity darkening, ridge highlights, and a faint bone grain. */
export const BONE_VERTEX_HEADER='attribute float cavity; varying float vCavity; varying vec3 vBonePosition;\n';
export const BONE_VERTEX_BODY='vCavity = cavity; vBonePosition = position;';
export const BONE_FRAGMENT_HEADER=`varying float vCavity; varying vec3 vBonePosition;
float boneHash(vec3 p){p=fract(p*0.3183099+0.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float boneNoise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.0-2.0*f);
 return mix(mix(mix(boneHash(i),boneHash(i+vec3(1,0,0)),f.x),mix(boneHash(i+vec3(0,1,0)),boneHash(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(boneHash(i+vec3(0,0,1)),boneHash(i+vec3(1,0,1)),f.x),mix(boneHash(i+vec3(0,1,1)),boneHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
`;
export const BONE_FRAGMENT_BODY=`
float boneHollow = smoothstep(0.04, 0.6, vCavity), boneRidge = smoothstep(0.04, 0.6, -vCavity);
float boneGrain = boneNoise(vBonePosition * 900.0) * 0.6 + boneNoise(vBonePosition * 2600.0) * 0.4;
diffuseColor.rgb *= (1.0 - 0.72 * boneHollow) * (0.9 + 0.12 * boneGrain);
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0), 0.28 * boneRidge);`;
