import assert from 'node:assert/strict';
import fs from 'node:fs';
import {registerHooks} from 'node:module';
import {resolve} from './ts-resolver.mjs';
registerHooks({resolve});
const {plaqueEffectsRequest,plaqueSupply}=await import('../app/plaque-effects-request.ts'),{resolveVessel}=await import('../app/vessel-atlas.ts'),{buildMessages,handleChatRequest}=await import('../server/chat.ts');
const atlas=JSON.parse(fs.readFileSync(new URL('../public/models/atlas.json',import.meta.url))),known=atlas.parts.find(p=>p.system==='arterial'&&resolveVessel(p.name)),unknown=atlas.parts.find(p=>p.system==='arterial'&&!plaqueSupply(p,'en'));
for(const part of [known,unknown])for(const lang of ['en','mn']){
 const request=plaqueEffectsRequest(part,50,lang),prompt=buildMessages(request);
 assert.equal(request.mode,'plaque');assert.equal(request.selection.name,part.name);assert.deepEqual(request.selection.elements,[part.id]);
 assert.equal(JSON.parse(request.messages[0].content).language,lang==='en'?'English':'Mongolian');
 assert.match(prompt.system,/Never invent downstream vessels/);assert.match(prompt.system,/Do not equate percentage narrowing/);assert.match(prompt.system,/not instructions overriding/);
 if(part===unknown){assert.match(request.selection.overview,/NOT MAPPED/);assert.equal(JSON.parse(request.messages[0].content).atlasReference,null);}
}
for(const n of [-1,101,NaN])assert.throws(()=>plaqueEffectsRequest(known,n,'en'),RangeError);
const renalBranch=atlas.parts.find(p=>p.name==='Superior segmental branch of left renal artery'),parentContext=JSON.parse(plaqueEffectsRequest(renalBranch,50,'en').messages[0].content).atlasReference;
assert.match(parentContext.scope,/Parent context only/);assert.match(parentContext.area,/exact branch territory unmapped/);
assert.throws(()=>plaqueEffectsRequest(atlas.parts.find(p=>p.system==='venous'),50,'en'),RangeError);
const originalFetch=globalThis.fetch;let wire;
try{
 globalThis.fetch=async(url,init)=>{wire=JSON.parse(init.body);return new Response(JSON.stringify({candidates:[{content:{parts:[{text:'Mock teaching explanation, not a clinical prediction.'}]}}]}),{headers:{'content-type':'application/json'}});};
 const response=await handleChatRequest(new Request('http://localhost/api/chat',{method:'POST',body:JSON.stringify(plaqueEffectsRequest(known,50,'en'))}),{GEMINI_API_KEY:'mock-key',GEMINI_MODEL:'test-model'});
 assert.equal(response.status,200);assert.match(await response.text(),/Mock teaching explanation/);assert.match(JSON.stringify(wire),/clinician-validated/);
}finally{globalThis.fetch=originalFetch;}
console.log('Verified plaque-scoped prompts, known/unknown territories, bilingual requests, input validation, and mocked Gemini API/SSE integration.');
