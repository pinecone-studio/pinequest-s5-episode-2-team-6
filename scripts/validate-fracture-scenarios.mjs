import assert from 'node:assert/strict';
import {scenarioPose,segmentEndpoints} from '../app/fracture/fall-model.ts';

for(const scenario of ['fall','crash','impact']){
 assert.throws(()=>scenarioPose(NaN,scenario),RangeError);
 assert.equal(scenarioPose(-1,scenario).t,0);
 assert.equal(scenarioPose(2,scenario).t,1);
 assert.equal(scenarioPose(.249,scenario).contact,false);
 assert.equal(scenarioPose(.25,scenario).contact,true);
 assert.equal(scenarioPose(.42,scenario).fracture,0);
 assert.equal(scenarioPose(1,scenario).fracture,1);
 for(let step=0;step<=40;step++){
  const pose=scenarioPose(step/40,scenario);
  for(const value of Object.values(pose))if(value?.isVector3)assert.ok(value.toArray().every(Number.isFinite));
  for(const segment of ['torso','head','rightUpperArm','leftUpperArm','rightForearm','leftForearm','rightThigh','leftThigh','rightShin','leftShin']){
   const [a,b,c,d]=segmentEndpoints(segment,pose);
   assert.ok(a.distanceTo(b)>0&&c.distanceTo(d)>0,`${scenario}: collapsed ${segment}`);
  }
  for(const side of ['left','right']){
   const near=(a,b,length)=>assert.ok(Math.abs(pose[a].distanceTo(pose[b])-length)<.003,`${scenario}: ${a}-${b} changed length`);
   near(`${side}Shoulder`,`${side}Elbow`,.29);near(`${side}Elbow`,`${side}Wrist`,.24);
   near(`${side}Hip`,`${side}Knee`,.45);near(`${side}Knee`,`${side}Ankle`,.37);
  }
 }
}
assert.equal(scenarioPose(.25,'fall').rightWrist.distanceTo(scenarioPose(.25,'fall').handContact),0);
assert.ok(scenarioPose(0,'crash').root.z<scenarioPose(.25,'crash').root.z);
assert.ok(scenarioPose(.25,'crash').rightKnee.z>scenarioPose(.25,'crash').rightHip.z,'Seated knees point toward the dashboard');
assert.equal(scenarioPose(.25,'impact').rightAnkle.distanceTo(scenarioPose(1,'impact').rightAnkle),0,'Sports contact keeps the planted ankle fixed');
console.log('Verified three full-body scenarios: 123 finite poses, preserved limb lengths, contact/fracture timing, hand contact, seated crash posture, and planted sports foot.');
