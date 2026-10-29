import assert from 'node:assert/strict';
import {resolveSimulationRequest as resolve} from '../app/fracture/simulation-request.ts';
assert.deepEqual(resolve('Simulate a backward fall'),{mode:'fall',side:'Right',aligned:false});
assert.deepEqual(resolve('Show a left clavicle fracture close-up'),{mode:'bone',side:'Left',aligned:false});
assert.deepEqual(resolve('Show an aligned right clavicle fracture'),{mode:'bone',side:'Right',aligned:true});
assert.equal(resolve('Арагш унахыг үзүүл').mode,'fall');
assert.equal(resolve('Баруун эгэмний зөрөөгүй хугарал').aligned,true);
for(const prompt of ['', 'hello', 'Simulate a wrist fracture', 'Simulate a forward fall', 'A fall onto the left hand', 'A bike crash with a clavicle fracture'])assert.equal(resolve(prompt),null,prompt);
console.log('Verified bilingual requests, side/alignment selection, and unsupported scenario handling.');
