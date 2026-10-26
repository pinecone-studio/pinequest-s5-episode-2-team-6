export type SystemId = 'skeletal'|'dental'|'muscular'|'arterial'|'venous'|'nervous'|'digestive'|'respiratory'|'urinary'|'reproductive'|'lymphatic'|'endocrine'|'integumentary'|'connective'|'sensory'|'cardiac';
export const SYSTEMS: {id:SystemId;name:string;color:string;description:string}[] = [
 {id:'skeletal',name:'Skeleton',color:'#e2d9ba',description:'Bones form the supporting framework of the body, protect organs, and provide attachment points for muscles. Their internal tissue also stores minerals and produces blood cells.'},
 {id:'dental',name:'Teeth',color:'#e9e4d8',description:'Teeth sit in the alveolar bone of the jaws and are not bones themselves: each carries a crown capped with enamel around dentin and a living pulp. The incisors cut, the canines guide the bite, and the premolars and molars grind food.'},
 {id:'muscular',name:'Muscles',color:'#a85b50',description:'Skeletal muscles generate movement by pulling on their attachments. Together with tendons, they move joints, stabilize posture, and produce heat.'},
 {id:'cardiac',name:'Heart',color:'#b96760',description:'The heart is a muscular pump with four chambers. Its valves direct blood forward through the pulmonary and systemic circuits.'},
 {id:'sensory',name:'Sensory organs',color:'#b0c8ce',description:'These structures contribute to special senses, including sight, hearing, and balance. Their specialized tissues detect stimuli and work with the nervous system to convey information.'},
 {id:'arterial',name:'Arteries',color:'#c05245',description:'The heart drives blood through the circulation. Arteries carry blood away from the heart to supply tissues or, in the pulmonary circuit, to the lungs.'},
 {id:'venous',name:'Veins',color:'#527c9f',description:'Veins return blood toward the heart. Superficial and deep networks collect blood from the tissues; the pulmonary veins bring oxygenated blood back from the lungs.'},
 {id:'nervous',name:'Nervous system',color:'#d8b565',description:'The brain, spinal cord, and peripheral nerves carry and process signals. They support sensation, movement, coordination, and automatic regulation of body functions.'},
 {id:'respiratory',name:'Respiratory',color:'#b98991',description:'The airways conduct air to the lungs, where oxygen and carbon dioxide move between air and blood. Breathing depends on pressure changes produced by respiratory muscles.'},
 {id:'digestive',name:'Digestive',color:'#b8916b',description:'The digestive tract breaks down food, absorbs nutrients and water, and moves waste onward. Accessory organs contribute bile and digestive enzymes.'},
 {id:'urinary',name:'Urinary',color:'#b47961',description:'The kidneys filter blood and regulate fluid, electrolyte, and acid–base balance. Urine travels through the ureters to the bladder and exits through the urethra.'},
 {id:'lymphatic',name:'Lymphatic',color:'#879f7c',description:'Lymphatic vessels return excess tissue fluid to the circulation. Lymph nodes and other lymphoid organs support immune surveillance and responses.'},
 {id:'endocrine',name:'Endocrine',color:'#c5a09a',description:'Endocrine organs release hormones into the blood to coordinate processes such as metabolism, growth, stress responses, and reproduction.'},
 {id:'reproductive',name:'Reproductive',color:'#bda098',description:'The male reproductive structures represented here contribute to sperm production, maturation, transport, and the production of sex hormones.'},
 {id:'integumentary',name:'Body surface',color:'#ba9b7d',description:'The body surface provides an outer anatomical reference. The integumentary system forms a protective barrier and contributes to sensation and temperature regulation.'},
 {id:'connective',name:'Connective tissue',color:'#aec3bb',description:'Cartilage, ligaments, and other connective tissues support, connect, and separate structures. Their roles include stabilizing joints and distributing mechanical loads.'},
];
export interface Part {id:string;name:string;conceptId:string;system:SystemId;chunk:number;positions:number;normals:number;indices:number;vertexCount:number;indexCount:number;bounds:[number[],number[]]}
export interface Concept {id:string;name:string;elements:string[]}
export interface Atlas {version:string;sex?:'male';source?:string;scope?:string;parts:Part[];concepts:Concept[];chunks:{url:string;bytes:number;gzip?:string;gzipBytes?:number}[];triangles:number}
export type View = 'three-quarter'|'front'|'back'|'side';
export interface SliceState {on:boolean;depth:number;axis:'x'|'z'}
export interface SceneState {perfusion?:{kidney:string;flow:number};inspectorOpen?:boolean;explode:number;visible:SystemId[];selected:string[];isolate:boolean;view:View;rotate:boolean;reset:number;labels?:boolean;peel?:number;slice?:SliceState}
export const DEFAULT_VISIBLE:SystemId[] = ['cardiac','sensory','skeletal','dental','muscular','arterial','venous','nervous','respiratory','digestive','urinary','lymphatic','endocrine','reproductive','connective'];
export const EXPLANATIONS:Record<string,string> = {
 'heart':'A muscular pump in the chest. Its right side sends blood to the lungs; its left side sends blood through the systemic circulation.',
 'liver':'A large organ beneath the right side of the diaphragm. It processes absorbed nutrients, produces bile, and synthesizes many proteins carried in the blood.',
 'brain':'The central organ of the nervous system. Its interconnected regions support perception, movement, memory, language, and the regulation of bodily functions.',
 'stomach':'A muscular chamber between the esophagus and small intestine. It stores and mixes food with acid and enzymes before releasing it into the duodenum.',
 'spleen':'A lymphoid organ in the upper left abdomen. It filters blood, removes aging blood cells, and participates in immune responses.',
 'pancreas':'An abdominal organ with digestive and endocrine roles. It supplies enzymes to the small intestine and releases hormones including insulin and glucagon.',
 'urinary bladder':'A muscular reservoir in the pelvis that stores urine arriving from the kidneys through the ureters.',
 'trachea':'The main airway connecting the larynx to the bronchi. Its cartilage supports keep the airway open during breathing.',
 'diaphragm':'A broad muscle separating the chest and abdomen. When it contracts, it increases chest volume and helps draw air into the lungs.',
 // Non-skeletal entries below are informed by https://www.anatomystandard.com/ (muscles, joints, and teeth pages).
 'digastric':'A two-bellied suprahyoid muscle. The anterior belly rises from the digastric fossa of the mandible, the posterior belly from the mastoid notch; their shared tendon hooks through a fibrous loop on the hyoid bone. It steadies and raises the hyoid, and with the hyoid fixed the anterior belly lowers the jaw.',
 'mylohyoid':'A flat suprahyoid muscle stretching from the mylohyoid line of the mandible to the median raphe and hyoid body. It forms the muscular floor of the mouth and lifts the hyoid bone forward during swallowing and speech.',
 'geniohyoid':'A slender strap beside the midline, running from the mental spine of the mandible to the hyoid body. It is the strongest anterior mover of the hyoid and works early in the swallow.',
 'stylohyoid':'A thin suprahyoid muscle from the styloid process of the temporal bone to the hyoid near its lesser horn. It draws the hyoid upward and backward and splits to let the digastric tendon pass.',
 'medial meniscus':'A crescent of fibrocartilage on the medial tibial plateau. Its firm bond with the tibial collateral ligament makes it the less mobile of the two menisci and the more frequently torn.',
 'lateral meniscus':'A crescent of fibrocartilage covering most of the lateral tibial plateau. A clear gap separates it from the fibular collateral ligament, so it slides freely during knee motion.',
 'anterior cruciate ligament':'A central knee ligament running from the front of the tibia to the inner side of the lateral femoral condyle. It restrains forward sliding of the tibia and guides the rotation that locks the extended knee.',
 'posterior cruciate ligament':'The stronger central knee ligament, resisting backward displacement of the tibia under the femur. Its fibers twist and retension through the range of flexion.',
 'transverse ligament of knee':'A small ligament joining the anterior horns of the two menisci, letting them glide together across the tibial surface.',
 'meniscotibial ligament':'A short coronary ligament anchoring the rim and horns of a meniscus to the tibial plateau.',
 'meniscopatellar ligament':'A delicate link joining the meniscus to the margins of the patella and its supporting tendon.',
 'articular capsule of knee joint':'A complex capsular sleeve around the femur, tibia, and patella. Posteriorly it thickens into the oblique popliteal ligament, continued from the semimembranosus tendon, and the arcuate popliteal ligament, which arches over the popliteus tendon passing inside the capsule.',
 'intervertebral disk':'An elastic ring joining two vertebral bodies. Laminated bands of collagen—the annulus fibrosus—enclose the gel-like nucleus pulposus, distributing compression across the spine.',
};
export function explanation(name:string,system:SystemId){
  const normalized=name.toLowerCase().replace(/^(left|right) /,'');
  return EXPLANATIONS[normalized] ?? EXPLANATIONS[name.toLowerCase()] ?? SYSTEMS.find(s=>s.id===system)?.description ?? '';
}
export function hasExplanation(name:string){return Boolean(EXPLANATIONS[name.toLowerCase().replace(/^(left|right) /,'')] ?? EXPLANATIONS[name.toLowerCase()]);}
