import type {Part} from '../anatomy';

export type FracturePattern='transverse'|'oblique'|'segmental';
export interface BoneRequest {boneIds:string[];pattern:FracturePattern;aligned:boolean;location:number}
export type BoneResolution={request:BoneRequest;error?:never}|{error:'bone'|'pattern'|'location';request?:never};
const ordinals=['first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth','eleventh','twelfth'];
const aliases:Record<string,string>={
 collarbone:'clavicle',thighbone:'femur',shinbone:'tibia',kneecap:'patella','upper arm':'humerus','shoulder blade':'scapula',
 'lower jaw':'mandible','upper jaw':'maxilla','breastbone':'sternum','heel bone':'calcaneus','hip bone':'hip',
 эгэм:'clavicle',бугалга:'humerus','цацраг яс':'radius','богтос яс':'ulna','гуяны яс':'femur',шаант:'tibia',тахилзуур:'fibula',тойг:'patella',хавирга:'rib',дал:'scapula',эрүү:'mandible',
 'big toe':'big toe',thumb:'thumb',
};
export function normalizeBoneText(value:string){
 let text=value.toLowerCase().normalize('NFKC').replace(/[-–—]/g,' ').replace(/эгэмний/g,'clavicle').replace(/\b(?:upper|top|lower|bottom) third\b/g,' ');
 for(const [from,to] of Object.entries(aliases))text=text.replaceAll(from,to);
 text=text.replace(/баруун/g,' right ').replace(/зүүн/g,' left ').replace(/эгэмний/g,'clavicle');
 text=text.replace(/\b(c|t|l)(\d{1,2})\b/g,(_,region:string,number:string)=>`${ordinals[Number(number)-1]??number} ${{c:'cervical',t:'thoracic',l:'lumbar'}[region]} vertebra`);
 text=text.replace(/\b(\d+)(?:st|nd|rd|th)?\b/g,(match,number)=>ordinals[Number(number)-1]??match);
 return text.replace(/\b(ribs|vertebrae|femurs|clavicles|humeri|radii|ulnae|tibias|fibulas|patellae)\b/g,word=>({ribs:'rib',vertebrae:'vertebra',femurs:'femur',clavicles:'clavicle',humeri:'humerus',radii:'radius',ulnae:'ulna',tibias:'tibia',fibulas:'fibula',patellae:'patella'}[word]!)).replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
}
const words=(text:string)=>text.split(' ').filter(word=>word&&!['left','right','bone','of','the'].includes(word));
export function resolveBoneRequest(input:string,parts:Part[]):BoneResolution{
 const raw=input.toLowerCase(),text=normalizeBoneText(input);
 if(/\b(spiral|compression|greenstick|stress|comminuted|compound)\b|\bopen\s+(?:\w+\s+)?fracture\b/.test(raw))return {error:'pattern'};
 if(/\b(neck|head|intra\s*articular|joint|proximal|distal)\b/.test(raw)&&!/phalanx/.test(raw))return {error:'location'};
 const skeleton=parts.filter(part=>part.system==='skeletal');
 const all=/\b(all|every|entire)\b/.test(text)&&/\b(bones?|skeleton|body)\b/.test(text);
 const region=/\bskull\b/.test(text)?/frontal|parietal|temporal|occipital|sphenoid|ethmoid|nasal|lacrimal|zygomatic|maxilla|mandible|palatine|vomer|concha/:/\bspine\b/.test(text)?/vertebra|^atlas$|^axis$|sacrum/:/\bwrist\b/.test(text)?/scaphoid|lunate|triquetral|pisiform|trapezium|trapezoid|capitate|hamate/:/\bhand\b/.test(text)?/metacarpal|finger|thumb|scaphoid|lunate|triquetral|pisiform|trapezium|trapezoid|capitate|hamate/:/\bfoot\b/.test(text)?/toe|metatarsal|calcaneus|talus|navicular|cuboid|cuneiform|sesamoid/:/\bsternum\b/.test(text)?/sternum|manubrium|xiphoid/:null;
 const clauses=text.split(/\s+(?:and|plus|with)\s+|,/);
 const matches=skeleton.filter(part=>{
  const name=normalizeBoneText(part.name);
  const relevant=clauses.filter(clause=>words(name).some(word=>new Set(clause.split(' ')).has(word)));
  const sideMatches=(clause:string)=>{
   const both=/\bboth\b/.test(clause)||(/\bleft\b/.test(clause)&&/\bright\b/.test(clause));
   if(both)return true;
   if(/\bleft\b/.test(clause)&&/\bright\b/.test(name))return false;
   if(/\bright\b/.test(clause)&&/\bleft\b/.test(name))return false;
   return true;
  };
  if(all)return sideMatches(text);
  // Each clause retains its own side, e.g. "left femur and right tibia".
  const matched=relevant.some(clause=>{
   const clauseTokens=new Set(clause.split(' '));
   if(!sideMatches(clause))return false;
   if(words(name).every(word=>clauseTokens.has(word)))return true;
   const core=words(name).filter(word=>!ordinals.includes(word));
   return words(name).some(word=>ordinals.includes(word))&&core.length>0&&core.every(word=>clauseTokens.has(word))&&!ordinals.some(word=>clauseTokens.has(word));
  });
  if(matched)return true;
  return !!region&&region.test(name)&&sideMatches(text);
 });
 if(!matches.length)return {error:'bone'};
 return {request:{boneIds:matches.map(part=>part.id),pattern:/\b(segmental|three fragments|3 fragments)\b|гурван хэсэг/.test(raw)?'segmental':/\b(oblique|angled|diagonal)\b|ташуу/.test(raw)?'oblique':'transverse',aligned:/\b(nondisplaced|non[ -]displaced|aligned|undisplaced)\b|зөрөөгүй/.test(raw),location:/\b(upper third|top third)\b/.test(raw)?.68:/\b(lower third|bottom third)\b/.test(raw)?.32:.5}};
}
