export type SimulationRequest = {mode:'fall'|'bone';side:'Left'|'Right';aligned:boolean};

/** Select only demonstrations actually implemented by the lab. */
export function resolveSimulationRequest(input:string):SimulationRequest|null {
 const text=input.trim().toLocaleLowerCase();
 if(!text)return null;
 const clavicle=/\b(clavicle|collarbone)\b|эгэм/.test(text);
 const fall=/\b(fall|falling|slip|slipping|backward)\b|уна|уналт|хальтир/.test(text);
 const unsupported=/\b(femur|tibia|fibula|radius|ulna|humerus|rib|ribs|skull|spine|wrist|ankle|hip|knee|left hand|left arm|forward fall|car|crash|bike)\b|бугуй|шагай|гуя/.test(text);
 if(unsupported||(!clavicle&&!fall))return null;
 const bone=/\b(detail|close.?up|fragment|displaced|nondisplaced|aligned|left)\b|зүүн|зөрөө/.test(text);
 if(fall&&!bone)return {mode:'fall',side:'Right',aligned:false};
 return {mode:'bone',side:/\bright\b|баруун/.test(text)?'Right':'Left',aligned:/\b(nondisplaced|aligned)\b|зөрөөгүй/.test(text)};
}
