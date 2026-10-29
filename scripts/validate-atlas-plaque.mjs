import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createAtlasPlaque} from '../app/atlas-plaque.ts';
const atlas=JSON.parse(fs.readFileSync(new URL('../public/models/atlas.json',import.meta.url)));
for(const part of atlas.parts){
 if(part.system==='arterial')for(const n of [0,50,100])assert.deepEqual(createAtlasPlaque(part,n),{id:part.id,narrowing:n});
 else assert.throws(()=>createAtlasPlaque(part,50),RangeError);
}
const artery=atlas.parts.find(p=>p.system==='arterial');
for(const n of [-1,101,NaN,Infinity])assert.throws(()=>createAtlasPlaque(artery,n),RangeError);
assert.throws(()=>createAtlasPlaque(artery,50,[Infinity,0,0]),RangeError);
console.log('Verified plaque placement on every atlas artery, exclusion of other anatomy, and narrowing/point bounds.');
