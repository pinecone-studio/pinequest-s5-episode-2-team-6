// Corrects system assignments that the source system map got wrong. Idempotent: rerun after convert-anatomy.py.
// Rules match the part name with any left/right qualifier removed.
import fs from 'node:fs';
const path=new URL('../public/models/atlas.json',import.meta.url),atlas=JSON.parse(fs.readFileSync(path,'utf8'));
const RULES=[
 // Brain ventricles and CSF spaces were filed under the heart.
 ['nervous',/^(third|fourth|lateral) ventricle$|^interventricular foramen$|^choroid plexus of cerebral hemisphere$/],
 // Papillary muscles belong to the heart wall, not skeletal muscle.
 ['cardiac',/papillary muscle/],
 // Limb, shoulder, hip, and pharyngeal muscles filed under skeleton, connective tissue, or respiratory.
 ['muscular',/^(fibularis (brevis|longus|tertius)|tibialis (anterior|posterior)|subscapularis|levator scapulae|tensor fasciae latae|(inferior|middle|superior) pharyngeal constrictor|palatopharyngeus|salpingopharyngeus|stylopharyngeus)$/],
 // Laryngeal and nasal cartilages are airway structures.
 ['respiratory',/^(cricoid|thyroid|arytenoid|cuneiform|corniculate|major alar) cartilage$/],
 // Bones filed under respiratory or sensory organs.
 ['skeletal',/^(inferior nasal concha|lacrimal bone)$/],
 ['connective',/^iliotibial tract$|^flexor retinaculum of wrist$/],
 ['digestive',/^gingiva of (upper|lower) jaw$/],
];
const normalize=name=>name.toLowerCase().replace(/\b(left|right) /g,'').replace(/ +/g,' ').trim();
const moved={};
for(const p of atlas.parts){
 const rule=RULES.find(([,pattern])=>pattern.test(normalize(p.name)));
 if(!rule||p.system===rule[0])continue;
 const key=`${p.system} -> ${rule[0]}`;(moved[key]??=[]).push(p.name);p.system=rule[0];
}
fs.writeFileSync(path,JSON.stringify(atlas));
for(const [key,names] of Object.entries(moved))console.log(`${key} (${names.length}): ${[...new Set(names.map(normalize))].join(', ')}`);
if(!Object.keys(moved).length)console.log('No changes; system assignments already corrected.');
