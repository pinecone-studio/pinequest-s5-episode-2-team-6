import type {Part} from './anatomy';

/** Conventional adult count, not a count of rendering meshes.
 * https://openstax.org/books/anatomy-and-physiology-2e/pages/7-1-divisions-of-the-skeletal-system
 * Additional sesamoids are retained in the viewer but excluded from this convention.
 */
export const ADULT_BONE_COUNT = 206;
export interface AdultBone {id:string;name:string;elements:string[]}

export function adultBoneInventory(parts:Part[]):AdultBone[] {
  const bones=new Map<string,AdultBone>();
  for(const part of parts){
    if(part.system!=='skeletal'||/costal cartilage|sesamoid bone of .* foot/i.test(part.name))continue;
    const sternum=/^(manubrium|body of sternum|xiphoid process)$/i.test(part.name);
    // Source hyoid duplicates share a concept; paired bones keep their sided name.
    const id=sternum?'sternum':part.name.toLowerCase();
    const bone=bones.get(id)??{id,name:sternum?'Sternum':part.name,elements:[]};
    bone.elements.push(part.id);
    bones.set(id,bone);
  }
  // A reference entry must never fabricate selectable geometry.
  if(!bones.has('coccyx'))bones.set('coccyx',{id:'coccyx',name:'Coccyx',elements:[]});
  return [...bones.values()];
}
