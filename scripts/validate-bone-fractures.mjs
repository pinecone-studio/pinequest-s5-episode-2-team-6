import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveBoneRequest} from '../app/fracture/bone-requests.ts';
import {fractureLayout,fractureContour,fractureAmount,fractureStage} from '../app/fracture/bone-geometry.ts';
const atlas=JSON.parse(fs.readFileSync(new URL('../public/models/atlas.json',import.meta.url)));
const bones=atlas.parts.filter(part=>part.system==='skeletal');
const resolve=text=>resolveBoneRequest(text,bones);
const names=text=>resolve(text).request?.boneIds.map(id=>bones.find(part=>part.id===id).name).sort();
assert.equal(resolve('show every bone fracture').request.boneIds.length,bones.length);
assert.equal(resolve('all bones').request.boneIds.length,bones.length);
assert.deepEqual(names('oblique right femur fracture'),['Right femur']);
assert.equal(resolve('oblique right femur fracture').request.pattern,'oblique');
assert.deepEqual(names('left radius and left ulna'),['Left radius','Left ulna']);
assert.deepEqual(names('left femur and right tibia'),['Left femur','Right tibia']);
assert.deepEqual(names('both femurs'),['Left femur','Right femur']);
assert.deepEqual(names('left 5th rib'),['Left fifth rib']);
assert.equal(names('right ribs').length,12);
assert.deepEqual(names('segmental T7 fracture'),['Seventh thoracic vertebra']);
assert.equal(resolve('segmental T7 fracture').request.pattern,'segmental');
assert.deepEqual(names('C3 fracture'),['Third cervical vertebra']);
assert.deepEqual(names('aligned right collarbone fracture'),['Right clavicle']);
assert.equal(resolve('aligned right collarbone fracture').request.aligned,true);
assert.deepEqual(names('Зүүн эгэмний зөрөөгүй хугарал'),['Left clavicle']);
assert.equal(resolve('Зүүн эгэмний зөрөөгүй хугарал').request.aligned,true);
assert.equal(resolve('left femur upper third').request.location,.68);
assert.ok(names('skull fracture').includes('Frontal bone'));
assert.ok(names('spine fracture').includes('Atlas'));
assert.ok(names('left wrist fracture').every(name=>name.startsWith('Left')));
for(const input of ['spiral femur','compression T7','open tibia fracture','greenstick radius'])assert.equal(resolve(input).error,'pattern');
assert.equal(resolve('femoral neck fracture').error,'location');
assert.equal(resolve('hello').error,'bone');
for(const [prompt,pattern] of [['wedge right femur','wedge'],['butterfly left tibia','wedge'],['longitudinal radius','longitudinal'],['тууш шаант','longitudinal']])assert.equal(resolve(prompt).request.pattern,pattern);
assert.equal(resolve('wedge T7').error,'location','A vertebral wedge needs a compression model, not a shaft fragment');
for(const [prompt,bone,pattern,scenario] of [['Simulate Shoulder fall','Right clavicle','transverse','fall'],['Simulate Car crash','Right femur','segmental','crash'],['Simulate Sports impact','Right tibia','oblique','impact'],['Автомашины осол','Right femur','segmental','crash']]){
 assert.deepEqual(names(prompt),[bone]);
 assert.equal(resolve(prompt).request.pattern,pattern);
 assert.equal(resolve(prompt).request.scenario,scenario);
}
assert.equal(resolve('backward fall').error,'bone','Keep the existing full-body fall lesson');
assert.equal(resolve('car crash open fracture').error,'pattern','Scenarios cannot bypass unsupported fracture patterns');
assert.deepEqual(names('car crash left tibia'),['Left tibia'],'Explicit bone selection takes priority over scenario defaults');
assert.equal(resolveBoneRequest('car crash',[]).error,'bone','An unavailable preset bone must not recurse forever');
const chunks=new Map();let contours=0;
for(const part of bones){
 assert.ok(resolve(`Animate a fracture of ${part.name}`).request?.boneIds.includes(part.id),`Prompt cannot select ${part.name} (${part.id})`);
 if(!chunks.has(part.chunk))chunks.set(part.chunk,fs.readFileSync(new URL(`../public${atlas.chunks[part.chunk].url}`,import.meta.url)));
 const bytes=chunks.get(part.chunk),positions=new Float32Array(bytes.buffer,bytes.byteOffset+part.positions,part.vertexCount*3),indices=new Uint32Array(bytes.buffer,bytes.byteOffset+part.indices,part.indexCount);
 const before=positions.slice();
 for(const pattern of ['transverse','oblique','segmental','longitudinal',...(/^\w+ (femur|tibia|fibula|humerus|radius|ulna|clavicle)$/.test(part.name)?['wedge']:[])])for(const location of [.32,.5,.68]){
  const layout=fractureLayout(positions,pattern,location);
  assert.equal(layout.fragments.length,pattern==='segmental'||pattern==='wedge'?3:2);
  assert.ok(Number.isFinite(layout.span)&&layout.span>0);
  for(const fragment of layout.fragments)for(const plane of fragment.edges){
   const contour=fractureContour(layout.positions,indices,plane.normal,-plane.constant,fragment.planes);
   assert.ok(contour.length>=6,`Empty ${pattern} contour for ${part.name} at ${location}`);
   assert.ok(contour.every(Number.isFinite));contours++;
  }
  // Every vertex belongs to a fragment, and each fragment contains source vertices.
  const counts=layout.fragments.map(()=>0);
  for(let i=0;i<layout.positions.length;i+=3){
   const distances=layout.fragments.map(fragment=>fragment.planes.map(plane=>layout.positions[i]*plane.normal.x+layout.positions[i+1]*plane.normal.y+layout.positions[i+2]*plane.normal.z+plane.constant));
   assert.ok(distances.some(values=>values.every(value=>value>=-1e-9)),'Every source vertex must belong to a fragment');
   assert.ok(distances.filter(values=>values.every(value=>value>1e-9)).length<=1,'Fragment interiors must not overlap');
   distances.forEach((values,index)=>{if(values.every(value=>value>=-1e-9))counts[index]++;});
  }
  assert.ok(counts.every(count=>count>0),`Empty fragment for ${part.name}`);
 }
 assert.deepEqual(positions,before,'Fracturing must not mutate source geometry');
}
assert.equal(fractureAmount(0),0);assert.equal(fractureAmount(.42),0);assert.equal(fractureAmount(1),1);
assert.equal(fractureStage(0),'intact');assert.equal(fractureStage(.3),'line');assert.equal(fractureStage(.7),'separating');assert.equal(fractureStage(1),'complete');
console.log(`Verified ${bones.length} skeletal meshes with 4 patterns, plus wedge cuts on supported shafts, at 3 locations: ${contours} nonempty clipped contours, complete nonoverlapping fragments, source preservation, parsing, and animation stages.`);
