import {Vector3,Quaternion,Euler} from 'three';

export const FALL_DURATION=8;
export const SLIP_START=.34;
export const SLIP_END=.47;
export const HAND_CONTACT=.72;
export const FRACTURE_START=.80;
export const FALL_PHASES=[{id:'walk',at:0},{id:'slip',at:.34},{id:'brace',at:.49},{id:'contact',at:HAND_CONTACT},{id:'fracture',at:FRACTURE_START}] as const;
export type FallPhase=typeof FALL_PHASES[number]['id'];
export const REST={
 pelvis:[0,.92,0],neck:[0,1.50,0],head:[0,1.70,0],
 rightShoulder:[-.17,1.40,0],rightElbow:[-.22,1.12,0],rightWrist:[-.25,.89,.015],
 leftShoulder:[.17,1.40,0],leftElbow:[.22,1.12,0],leftWrist:[.25,.89,.015],
 rightHip:[-.085,.91,0],rightKnee:[-.09,.46,0],rightAnkle:[-.10,.095,0],
 leftHip:[.085,.91,0],leftKnee:[.09,.46,0],leftAnkle:[.10,.095,0],
} as const;
export const vec=(p:readonly number[])=>new Vector3(p[0],p[1],p[2]);
const smooth=(a:number,b:number,t:number)=>{const x=Math.min(1,Math.max(0,(t-a)/(b-a)));return x*x*(3-2*x);};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;

/** Two-link positional IK. The hinge stays in the plane defined by bendDirection. */
export function hinge(start:Vector3,end:Vector3,upper:number,lower:number,bendDirection:Vector3){
 const axis=end.clone().sub(start),distance=Math.max(1e-6,axis.length());axis.normalize();
 const d=Math.min(upper+lower-1e-6,Math.max(Math.abs(upper-lower)+1e-6,distance));
 const along=(upper*upper-lower*lower+d*d)/(2*d),height=Math.sqrt(Math.max(0,upper*upper-along*along));
 const bend=bendDirection.clone().addScaledVector(axis,-bendDirection.dot(axis)).normalize();
 return start.clone().addScaledVector(axis,along).addScaledVector(bend,height);
}

/** Authored fall choreography. Contact and fracture are timeline events, not injury predictions. */
export function fallPose(progress:number){
 if(!Number.isFinite(progress))throw new RangeError('Timeline must be finite.');
 const t=Math.min(1,Math.max(0,progress));
 // Loss of traction precedes the torso reaction; the pelvis drops as the reach develops.
 const slide=smooth(SLIP_START,SLIP_END,t),fall=smooth(.40,HAND_CONTACT,t),reach=smooth(.47,HAND_CONTACT,t);
 const lean=smooth(.40,.70,t),startle=smooth(.355,.40,t)*(1-smooth(.42,.49,t));
 const reflex=smooth(.39,.48,t)*(1-smooth(.53,.66,t));
 const walk=Math.sin(t/.34*Math.PI*4)*(1-smooth(.28,SLIP_START,t));
 const q=new Quaternion().setFromEuler(new Euler(-1.12*lean+.045*startle,0,.10*fall+.035*startle));
 const kneeYield=.045*smooth(.37,.43,t)*(1-fall);
 const root=new Vector3(-.025*startle,mix(.92,.31,fall)-kneeYield-.035*walk*walk,mix(-.85,.08,smooth(0,SLIP_START,t))-.27*fall);
 const body=(p:readonly number[])=>vec(p).sub(vec(REST.pelvis)).applyQuaternion(q).add(root);
 const rightShoulder=body(REST.rightShoulder),leftShoulder=body(REST.leftShoulder);
 const handContact=new Vector3(-.33,.065,-.86);
 const rightWrist=body(REST.rightWrist).add(new Vector3(-.04*reflex,.13*reflex,walk*.10-.16*reflex)).lerp(handContact,reach);
 const leftWrist=body(REST.leftWrist).add(new Vector3(.06*fall+.18*reflex,.08*fall+.22*reflex,-walk*.10+.08*reflex));
 // Keep the reaching hands inside the two-link arm's reachable sphere.
 for(const [shoulder,wrist] of [[rightShoulder,rightWrist],[leftShoulder,leftWrist]]){
  const delta=wrist.clone().sub(shoulder);if(delta.length()>.529)wrist.copy(shoulder).add(delta.setLength(.529));
 }
 const rightElbow=hinge(rightShoulder,rightWrist,.29,.24,new Vector3(-1,0,.3));
 const leftElbow=hinge(leftShoulder,leftWrist,.29,.24,new Vector3(1,0,.3));
 const rightHip=body(REST.rightHip),leftHip=body(REST.leftHip);
 const rightAnkle=new Vector3(-.10,.095+Math.max(0,walk)*.06,root.z+walk*.22);
 const leftAnkle=new Vector3(.10,.095+Math.max(0,-walk)*.06,root.z-walk*.22);
 // The heel slides forward while the pelvis and upper body fall backward.
 // Feet remain ahead of the pelvis as the right hand braces behind the body.
 const recovery=smooth(.48,.67,t),plant=smooth(.28,SLIP_START,t);
 const slippedFoot=new Vector3(-.10,.095+.075*Math.sin(Math.PI*recovery),mix(.04,.28,slide));
 slippedFoot.z=mix(slippedFoot.z,.52,recovery);
 rightAnkle.lerp(slippedFoot,plant);
 const leftPlant=smooth(.27,SLIP_START,t),leftRecovery=smooth(.48,.69,t);
 leftAnkle.lerp(new Vector3(.10,.095+.045*Math.sin(Math.PI*leftRecovery),mix(.015,.32,leftRecovery)),leftPlant);
 const rightKnee=hinge(rightHip,rightAnkle,.45,.37,new Vector3(0,0,1));
 const leftKnee=hinge(leftHip,leftAnkle,.45,.37,new Vector3(0,0,1));
 const phase:FallPhase=t<FALL_PHASES[1].at?'walk':t<FALL_PHASES[2].at?'slip':t<HAND_CONTACT?'brace':t<FRACTURE_START?'contact':'fracture';
 return {t,phase,root,q,neck:body(REST.neck),head:body(REST.head),rightShoulder,leftShoulder,rightElbow,leftElbow,rightWrist,leftWrist,rightHip,leftHip,rightKnee,leftKnee,rightAnkle,leftAnkle,
  contact:t>=HAND_CONTACT,fracture:smooth(FRACTURE_START,.94,t),handContact,
  slipping:t>=SLIP_START&&t<.54,slide,handPlant:smooth(.60,HAND_CONTACT,t),rightFootPitch:.22*Math.sin(Math.PI*slide)*(1-recovery)};
}

export type FallPose=ReturnType<typeof fallPose>;
export type ScenarioId='fall'|'crash'|'impact';
/** Prescribed body poses share the close-up's contact (.25) and separation (.42) times. */
export function scenarioPose(progress:number,scenario:ScenarioId):FallPose{
 const base=fallPose(progress),t=base.t,react=smooth(.25,.55,t),contact=t>=.25,fracture=smooth(.42,1,t);
 const phase:FallPhase=t<.12?'walk':t<.20?'slip':t<.25?'brace':t<.42?'contact':'fracture';
 if(scenario==='fall')return {...fallPose(t<.25?t/.25*HAND_CONTACT:HAND_CONTACT+(t-.25)/.75*(1-HAND_CONTACT)),t,phase,contact,fracture};
 const seated=scenario==='crash',travel=seated?-1.4*(1-Math.min(1,t/.25)):0;
 const root=new Vector3(seated?0:.08*react,seated?.64:.92-.045*react,travel+(seated?.045*react:0));
 const q=new Quaternion().setFromEuler(new Euler(seated?.22*react:0,0,seated?0:-.10*react));
 const body=(p:readonly number[])=>vec(p).sub(vec(REST.pelvis)).applyQuaternion(q).add(root);
 const rightShoulder=body(REST.rightShoulder),leftShoulder=body(REST.leftShoulder);
 const rightWrist=seated?new Vector3(-.21,.98,travel+.36):body(REST.rightWrist).add(new Vector3(-.14*react,.12*react,0));
 const leftWrist=seated?new Vector3(.21,.98,travel+.36):body(REST.leftWrist).add(new Vector3(.14*react,.12*react,0));
 const rightElbow=hinge(rightShoulder,rightWrist,.29,.24,new Vector3(-1,0,.2)),leftElbow=hinge(leftShoulder,leftWrist,.29,.24,new Vector3(1,0,.2));
 const rightHip=body(REST.rightHip),leftHip=body(REST.leftHip);
 const rightAnkle=new Vector3(-.10,seated?.14:.095,travel+(seated?.45:0)),leftAnkle=new Vector3(.10,seated?.14:.095,travel+(seated?.45:0));
 const rightKnee=hinge(rightHip,rightAnkle,.45,.37,new Vector3(0,0,1)),leftKnee=hinge(leftHip,leftAnkle,.45,.37,new Vector3(0,0,1));
 return {...base,t,phase,root,q,neck:body(REST.neck),head:body(REST.head),rightShoulder,leftShoulder,rightElbow,leftElbow,rightWrist,leftWrist,rightHip,leftHip,rightKnee,leftKnee,rightAnkle,leftAnkle,
  contact,fracture,handContact:seated?rightKnee.clone():rightKnee.clone().lerp(rightAnkle,.5),slipping:false,slide:0,handPlant:0,rightFootPitch:0};
}
export type Segment='torso'|'head'|'pelvis'|'rightUpperArm'|'leftUpperArm'|'rightForearm'|'leftForearm'|'rightHand'|'leftHand'|'rightThigh'|'leftThigh'|'rightShin'|'leftShin'|'rightFoot'|'leftFoot';
export function boneSegment(name:string):Segment{
 const n=name.toLowerCase(),side=n.includes('right')?'right':'left';
 if(/hip bone|sacrum|coccyx/.test(n))return 'pelvis';
 if(/humerus/.test(n))return `${side}UpperArm`;
 if(/radius|ulna/.test(n))return `${side}Forearm`;
 if(/femur|patella/.test(n))return `${side}Thigh`;
 if(/tibia|fibula/.test(n))return `${side}Shin`;
 if(/toe|metatarsal|calcaneus|talus|cuboid|cuneiform|navicular|sesamoid bone of .*foot/.test(n))return `${side}Foot`;
 if(/finger|thumb|metacarpal|capitate|hamate|lunate|pisiform|scaphoid|trapezi|triquetral/.test(n))return `${side}Hand`;
 if(/rib|vertebra|atlas$|axis$|sternum|manubrium|xiphoid|clavicle|scapula|costal cartilage/.test(n))return 'torso';
 return 'head';
}

export function segmentEndpoints(segment:Segment,pose:FallPose):[Vector3,Vector3,Vector3,Vector3]{
 const side=segment.startsWith('right')?'right':'left';
 const pair=(a:keyof typeof REST,b:keyof typeof REST)=>[vec(REST[a]),vec(REST[b]),pose[a as keyof FallPose] as Vector3,pose[b as keyof FallPose] as Vector3] as [Vector3,Vector3,Vector3,Vector3];
 if(segment==='torso'||segment==='pelvis')return [vec(REST.pelvis),vec(REST.neck),pose.root,pose.neck];
 if(segment==='head')return pair('neck','head');
 if(segment.endsWith('UpperArm'))return pair(`${side}Shoulder`,`${side}Elbow`);
 if(segment.endsWith('Forearm'))return pair(`${side}Elbow`,`${side}Wrist`);
 if(segment.endsWith('Hand')){
  const wrist=pose[`${side}Wrist`],elbow=pose[`${side}Elbow`];
  const direction=wrist.clone().sub(elbow).normalize();
  if(side==='right')direction.lerp(new Vector3(0,0,1),pose.handPlant).normalize();
  const end=wrist.clone().addScaledVector(direction,.1);
  return [vec(REST[`${side}Wrist`]),vec(REST[`${side}Wrist`]).add(new Vector3(0,-.1,0)),wrist,end];
 }
 if(segment.endsWith('Thigh'))return pair(`${side}Hip`,`${side}Knee`);
 if(segment.endsWith('Shin'))return pair(`${side}Knee`,`${side}Ankle`);
 const ankle=pose[`${side}Ankle`],pitch=side==='right'?pose.rightFootPitch:0;
 return [vec(REST[`${side}Ankle`]),vec(REST[`${side}Ankle`]).add(new Vector3(0,0,.1)),ankle,ankle.clone().add(new Vector3(0,Math.sin(pitch)*.1,Math.cos(pitch)*.1))];
}
