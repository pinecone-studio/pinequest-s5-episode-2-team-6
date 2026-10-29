import type {Atlas,Part,SceneState,SystemId} from './anatomy';
export interface AtlasFlowPreview {ids:string[];flow:number}
export function vascularSceneState(atlas:Atlas,state:SceneState,systems:SystemId[]=['arterial','venous']):SceneState{
 const visible=systems.filter(system=>system==='arterial'||system==='venous'),allowed=new Set<SystemId>(visible);
 const selected=state.selected.filter(id=>{const part=atlas.parts.find(p=>p.id===id);return part&&allowed.has(part.system);});
 return {...state,visible,selected,isolate:state.isolate&&selected.length>0,explode:0,peel:0,slice:{on:false,axis:'x',depth:.5}};
}
export interface AtlasPlaque {id:string;narrowing:number;point?:[number,number,number]}
export function createAtlasPlaque(part:Part,narrowing:number,point?:[number,number,number]):AtlasPlaque{
 if(part.system!=='arterial'||!Number.isFinite(narrowing)||narrowing<0||narrowing>100)throw new RangeError('Plaque requires an artery and 0–100% narrowing.');
 if(point&&(point.length!==3||point.some((v,i)=>!Number.isFinite(v)||v<part.bounds[0][i]-.00001||v>part.bounds[1][i]+.00001)))throw new RangeError('Plaque point is outside its vessel.');
 return {id:part.id,narrowing,...(point?{point:[...point] as [number,number,number]}:{} )};
}
