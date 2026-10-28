import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fragmentPose,INITIAL_FRACTURE} from '../app/fracture/model.ts';
const atlas=JSON.parse(fs.readFileSync(new URL('../public/models/atlas.json',import.meta.url)));
for(const side of ['Left','Right']){
 const part=atlas.parts.find(p=>p.name===`${side} clavicle`);assert.ok(part);
 const bytes=fs.readFileSync(new URL(`../public${atlas.chunks[part.chunk].url}`,import.meta.url));
 const positions=new Float32Array(bytes.buffer,bytes.byteOffset+part.positions,part.vertexCount*3);
 const midpoint=(part.bounds[0][0]+part.bounds[1][0])/2;
 assert.ok(Array.from(positions).filter((_,i)=>i%3===0).some(x=>x<midpoint));
 assert.ok(Array.from(positions).filter((_,i)=>i%3===0).some(x=>x>midpoint));
 const settings={...INITIAL_FRACTURE,side,progress:1};
 const medial=fragmentPose(settings,true),lateral=fragmentPose(settings,false);
 assert.ok(medial.y>0&&lateral.y<0);
 assert.equal(medial.y-lateral.y,.012);
 assert.equal(Math.abs(lateral.x),.008);
 assert.ok(side==='Left'?lateral.x<0:lateral.x>0);
 assert.ok(Math.abs(Math.abs(medial.angle-lateral.angle)-12*Math.PI/180)<1e-12);
 for(const fractured of [true,false])for(const medial of [true,false])assert.deepEqual(fragmentPose({...settings,progress:0,fractured},medial),{x:0,y:0,angle:0});
}
assert.throws(()=>fragmentPose({...INITIAL_FRACTURE,angle:NaN},true),RangeError);
const left=fragmentPose({...INITIAL_FRACTURE,progress:1},false),right=fragmentPose({...INITIAL_FRACTURE,side:'Right',progress:1},false);
assert.equal(left.x,-right.x);assert.equal(left.angle,-right.angle);assert.equal(left.y,right.y);
console.log('Verified source clavicles, midshaft splits, mirrored fragment positions, units, neutral state, and invalid inputs.');
