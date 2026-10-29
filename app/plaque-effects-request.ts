import type {Part} from './anatomy';
import type {AssistantChatRequest} from './llm-types';
import {resolveVessel} from './vessel-atlas';
export function plaqueSupply(part:Part,lang:'en'|'mn'){
 const direct=resolveVessel(part.name),parent=part.name.match(/\bof (.+)$/i)?.[1],entry=direct??(parent?resolveVessel(parent):null);
 return entry?.kind==='artery'?{entry,text:direct?entry.area[lang]:`${lang==='mn'?'Үндсэн судасны холбоо, салааны нарийн хил тодорхойгүй':'Parent-vessel context; exact branch territory unmapped'}: ${parent} · ${entry.area[lang]}`,scope:direct?'Named vessel':'Parent context only; do not assign the whole parent territory to this branch'}:null;
}
export function plaqueEffectsRequest(part:Part,narrowing:number,lang:'en'|'mn'):AssistantChatRequest{
 if(part.system!=='arterial'||!Number.isFinite(narrowing)||narrowing<0||narrowing>100)throw new RangeError('Invalid arterial plaque scenario');
 const supply=plaqueSupply(part,lang);
 return {mode:'plaque',selection:{name:part.name,system:part.system,conceptId:part.conceptId,elements:[part.id],overview:supply?.text??'Supply territory NOT MAPPED; do not infer a specific organ.'},messages:[{role:'user',content:JSON.stringify({language:lang==='mn'?'Mongolian':'English',vessel:part.name,diameterNarrowingPercent:narrowing,atlasReference:supply?{from:supply.entry.from,branches:supply.entry.branches,area:supply.text,scope:supply.scope,review:'App reference; expert review pending'}:null,request:'Explain the supplied territory, conditional downstream organ effects, perfusion versus function, and compensation limits. No patient prediction. No calculated flow or damage percentage.'})}]};
}
