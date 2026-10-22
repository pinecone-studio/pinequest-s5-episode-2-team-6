// The landing page starts this download when it mounts, so the body arrives alongside
// the lazily loaded 3D code instead of after it. A failed request is retried on the next call.
let pending:Promise<ArrayBuffer>|null=null;
export function figureData(){
  pending??=fetch('/landing/figure.bin').then(r=>{if(!r.ok)throw new Error('The landing figure could not be loaded.');return r.arrayBuffer();}).catch(e=>{pending=null;throw e;});
  return pending;
}
