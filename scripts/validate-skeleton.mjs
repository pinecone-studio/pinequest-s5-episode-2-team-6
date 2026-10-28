import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ADULT_BONE_COUNT,adultBoneInventory} from '../app/skeleton.ts';

const atlas=JSON.parse(fs.readFileSync(new URL('../public/models/atlas.json',import.meta.url)));
const bones=adultBoneInventory(atlas.parts);
assert.equal(bones.length,ADULT_BONE_COUNT);
assert.deepEqual(bones.filter(b=>!b.elements.length).map(b=>b.name),['Coccyx']);
assert.equal(bones.find(b=>b.id==='sternum').elements.length,3);
assert.equal(bones.filter(b=>/hyoid/i.test(b.name)).length,1);
assert.equal(bones.find(b=>/hyoid/i.test(b.name)).elements.length,2);
assert.equal(bones.filter(b=>/malleus|incus|stapes/i.test(b.name)).length,6);
assert.equal(atlas.parts.filter(p=>/costal cartilage/i.test(p.name)&&p.system==='connective').length,14);
assert.equal(bones.filter(b=>/costal cartilage|sesamoid bone/i.test(b.name)).length,0);
// Independent regional totals catch missing or duplicated sided limb bones.
const limb=/hip bone|clavicle|scapula|humerus|radius|ulna|femur|patella|tibia|fibula|phalanx|metacarpal|metatarsal|calcaneus|capitate|cuboid|hamate|cuneiform|lunate|pisiform|scaphoid|talus|trapezium|trapezoid|triquetral|navicular/i;
assert.equal(bones.filter(b=>limb.test(b.name)).length,126);
assert.equal(bones.filter(b=>!limb.test(b.name)).length,80);
assert.equal(new Set(bones.flatMap(b=>b.elements)).size,bones.flatMap(b=>b.elements).length);
console.log('Verified 206 reference bones (80 axial, 126 appendicular), 205 mapped bones, and explicit missing coccyx.');
