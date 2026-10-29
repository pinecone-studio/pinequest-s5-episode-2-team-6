import type {Part} from './anatomy';
import {RENAL_SITES,type RenalSite} from './plaque-model';
/** Match existing renal identities; other arteries get an explicitly synthetic parent-vessel scenario. */
export function atlasCircuitSite(part:Part):{side:'Left'|'Right';site:RenalSite}|null{
 if(part.system!=='arterial')return null;
 for(const side of ['Left','Right'] as const)for(const site of Object.keys(RENAL_SITES[side]) as RenalSite[]){
  if(part.conceptId===RENAL_SITES[side][site]&&part.name.toLowerCase().includes(`${side.toLowerCase()} renal artery`))return {side,site};
 }
 return null;
}
