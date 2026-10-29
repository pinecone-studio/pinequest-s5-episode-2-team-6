import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createAtlasPlaque,vascularSceneState} from '../app/atlas-plaque.ts';
const atlas=JSON.parse(fs.readFileSync(new URL('../public/models/atlas.json',import.meta.url)));
const arterial=atlas.parts.find(p=>p.system==='arterial'),organ=atlas.parts.find(p=>p.name==='Left kidney');
const initial=Object.freeze({selected:Object.freeze([arterial.id,organ.id]),visible:Object.freeze(['skeletal','urinary','arterial']),isolate:false,explode:1,peel:6,slice:{on:true,axis:'z',depth:.5},view:'front',rotate:false,reset:0});
for(const systems of [['arterial','venous'],['arterial'],['venous'],['skeletal','urinary']]){
 const state=vascularSceneState(atlas,initial,systems),shown=atlas.parts.filter(p=>state.visible.includes(p.system)||state.selected.includes(p.id));
 assert.ok(shown.every(p=>p.system==='arterial'||p.system==='venous'),'No organs, bones, or muscles may enter the vessel workspace');
 assert.ok(!state.selected.includes(organ.id));assert.equal(state.explode,0);assert.equal(state.peel,0);assert.equal(state.slice.on,false);
 assert.equal(shown.length,systems.includes('arterial')?639+(systems.includes('venous')?395:0):systems.includes('venous')?395:0);
}
assert.equal(initial.selected.length,2);assert.equal(initial.explode,1,'The ordinary anatomy state remains untouched');
assert.equal(vascularSceneState(atlas,{...initial,isolate:true},['venous']).isolate,false,'A hidden selection cannot isolate a nonvascular scene');
for(const part of atlas.parts){
 if(part.system==='arterial')for(const n of [0,50,100])assert.deepEqual(createAtlasPlaque(part,n),{id:part.id,narrowing:n});
 else assert.throws(()=>createAtlasPlaque(part,50),RangeError);
}
const artery=atlas.parts.find(p=>p.system==='arterial');
for(const n of [-1,101,NaN,Infinity])assert.throws(()=>createAtlasPlaque(artery,n),RangeError);
assert.throws(()=>createAtlasPlaque(artery,50,[Infinity,0,0]),RangeError);
assert.throws(()=>createAtlasPlaque(artery,50,[]),RangeError);
const chunks=new Map();let sites=0;
for(const part of atlas.parts.filter(p=>p.system==='arterial')){
 if(!chunks.has(part.chunk))chunks.set(part.chunk,fs.readFileSync(new URL(`../public${atlas.chunks[part.chunk].url}`,import.meta.url)));
 const bytes=chunks.get(part.chunk),vertices=new Float32Array(bytes.buffer,bytes.byteOffset+part.positions,part.vertexCount*3);
 for(const index of [0,Math.floor(part.vertexCount/2),part.vertexCount-1]){const point=Array.from(vertices.slice(index*3,index*3+3)),placed=createAtlasPlaque(part,50,point);assert.deepEqual(placed.point,point);point[0]+=1;assert.notDeepEqual(placed.point,point);sites++;}
}
console.log(`Verified ${sites} source-mesh site samples and immutable placement coordinates.`);
console.log('Verified plaque placement on every atlas artery, exclusion of other anatomy, and narrowing/point bounds.');
