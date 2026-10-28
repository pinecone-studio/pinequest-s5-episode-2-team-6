import assert from 'node:assert/strict';
import {fallPose,HAND_CONTACT,FRACTURE_START,SLIP_START,SLIP_END,boneSegment,segmentEndpoints} from '../app/fracture/fall-model.ts';
assert.equal(fallPose(0).phase,'walk');
assert.equal(fallPose(.40).phase,'slip');
assert.equal(fallPose(.55).phase,'brace');
assert.equal(fallPose(HAND_CONTACT).phase,'contact');
assert.equal(fallPose(.9).phase,'fracture');
for(let i=0;i<=1000;i++){
 const p=fallPose(i/1000);
 if(p.t<=FRACTURE_START)assert.equal(p.fracture,0,'No fracture before the authored fracture event');
 if(p.contact)assert.ok(p.rightWrist.distanceTo(p.handContact)<1e-9,'Right hand stays planted after contact');
 assert.ok(p.rightKnee.y>0&&p.leftKnee.y>0,'Knees must not pass through pavement');
 assert.ok(Math.abs(p.rightShoulder.distanceTo(p.rightElbow)-.29)<1e-6);
 assert.ok(Math.abs(p.rightWrist.distanceTo(p.rightElbow)-.24)<1e-6);
 assert.ok(Math.abs(p.leftShoulder.distanceTo(p.leftElbow)-.29)<1e-6);
 assert.ok(Math.abs(p.leftWrist.distanceTo(p.leftElbow)-.24)<1e-6);
 for(const side of ['right','left']){
  assert.ok(Math.abs(p[`${side}Hip`].distanceTo(p[`${side}Knee`])-.45)<1e-6);
  assert.ok(Math.abs(p[`${side}Ankle`].distanceTo(p[`${side}Knee`])-.37)<1e-6);
 }
 for(const name of ['Right humerus','Right radius','Right clavicle','Right femur','Right tibia','Right first metatarsal bone','Frontal bone']){
  const endpoints=segmentEndpoints(boneSegment(name),p);
  assert.ok(endpoints.every(v=>v.toArray().every(Number.isFinite)));
 }
}
assert.ok(fallPose(SLIP_END).rightAnkle.z>fallPose(SLIP_START).rightAnkle.z+.20,'The slipping foot slides forward before settling');
assert.ok(fallPose(HAND_CONTACT).root.z<fallPose(SLIP_START).root.z,'Pelvis travels backward after slipping');
assert.ok(fallPose(HAND_CONTACT).head.z<fallPose(HAND_CONTACT).root.z,'Upper body leans backward');
assert.ok(fallPose(HAND_CONTACT).rightWrist.z<fallPose(HAND_CONTACT).root.z,'Right hand braces behind the body');
assert.ok(fallPose(HAND_CONTACT).rightAnkle.z>fallPose(HAND_CONTACT).root.z,'Feet stay forward of the pelvis');
assert.equal(fallPose(.37).root.y,fallPose(SLIP_START).root.y,'The foot starts sliding before the pelvis drops');
for(let t=SLIP_START;t<=SLIP_END;t+=.001){
 assert.ok(Math.abs(fallPose(t).rightAnkle.y-.095)<1e-9,'Heel remains at pavement height while sliding');
 assert.ok(Math.abs(fallPose(t).leftAnkle.z-.015)<1e-9,'The other foot remains planted during the slip');
}
const beforeHand=segmentEndpoints('rightHand',fallPose(HAND_CONTACT-1e-6))[3],afterHand=segmentEndpoints('rightHand',fallPose(HAND_CONTACT))[3];
assert.ok(beforeHand.distanceTo(afterHand)<1e-4,'Palm orientation must not snap at ground contact');
assert.equal(boneSegment('Right clavicle'),'torso');
assert.equal(boneSegment('Right humerus'),'rightUpperArm');
assert.equal(boneSegment('Distal phalanx of right thumb'),'rightHand');
assert.equal(boneSegment('Distal phalanx of right big toe'),'rightFoot');
assert.equal(fallPose(-1).phase,'walk');assert.equal(fallPose(2).fracture,1);
assert.throws(()=>fallPose(NaN),RangeError);
console.log('Verified fall stage order, fracture after contact, planted right hand, rigid arm lengths, floor clearance, bone mapping, and reversible finite poses across 1,001 samples.');
