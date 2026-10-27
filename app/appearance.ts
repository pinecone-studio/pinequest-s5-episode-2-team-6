import {SYSTEMS,type SystemId} from './anatomy';
export interface Appearance {background:string;colors:Record<SystemId,string>}
// Glass is the default: the 3D canvas turns transparent over a blue gradient and the panels turn to frosted glass.
export const GLASS='#4f84c4';
export const isGlass=(color:string)=>color===GLASS;
export const BACKGROUNDS=[{name:'Glass',color:GLASS},{name:'Paper',color:'#ebe4d6'},{name:'Studio',color:'#f2f3f3'},{name:'Warm',color:'#efe8de'},{name:'Mist',color:'#e2eaf0'},{name:'Slate',color:'#3a4551'},{name:'Midnight',color:'#11171e'},{name:'Black',color:'#000000'}];
export const DEFAULT_APPEARANCE:Appearance={background:BACKGROUNDS[0].color,colors:Object.fromEntries(SYSTEMS.map(s=>[s.id,s.color])) as Record<SystemId,string>};
const KEY='human-atlas-colors',LEGACY_KEY='human-atlas-appearance',LEGACY_DEFAULT='#f2f3f3',HEX=/^#[0-9a-f]{6}$/i;
const hex=(value:unknown,fallback:string)=>typeof value==='string'&&HEX.test(value)?value.toLowerCase():fallback;
export function loadAppearance():Appearance{
 try{
  // The old key saved the grey Studio backdrop on every visit, so it moves to paper; custom colors carry over.
  const current=localStorage.getItem(KEY),saved=JSON.parse(current??localStorage.getItem(LEGACY_KEY)??'null');if(!saved||typeof saved!=='object')return DEFAULT_APPEARANCE;
  const colors=Object.fromEntries(SYSTEMS.map(s=>[s.id,hex(saved.colors?.[s.id],DEFAULT_APPEARANCE.colors[s.id])])) as Record<SystemId,string>;
  const background=current===null&&saved.background===LEGACY_DEFAULT?DEFAULT_APPEARANCE.background:hex(saved.background,DEFAULT_APPEARANCE.background);
  return {background,colors};
 }catch{return DEFAULT_APPEARANCE;}
}
export function saveAppearance(appearance:Appearance){try{localStorage.setItem(KEY,JSON.stringify(appearance));}catch{/* Storage can be blocked in private windows; colors still apply for this visit. */}}
const rgb=(color:string)=>[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
export function mixColor(from:string,to:string,t:number){const a=rgb(from),b=rgb(to);return '#'+a.map((v,i)=>Math.round(v+(b[i]-v)*t).toString(16).padStart(2,'0')).join('');}
// Relative luminance decides when overlay text switches to light tones.
export function isDark(color:string){const [r,g,b]=rgb(color).map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4;});return .2126*r+.7152*g+.0722*b<.18;}
