// Indexes Anatomy Standard figures (CC BY-NC 4.0) and their Latin–English term lists into app/anatomy-standard.json.
// Only image URLs are stored: figures stay hosted on anatomystandard.com and load from there with their logo intact.
// Rerun to refresh: node scripts/import-anatomy-standard.mjs
import fs from 'node:fs';
const BASE='https://www.anatomystandard.com',SECTIONS=/^\/(ossa-et-juncturae|musculi)\//;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// Navigation lists a few pages that are not published yet; those resolve to null and are skipped.
const get=async url=>{const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 (human-atlas figure index)'}});await sleep(400);return r.ok?r.text():null;};
const decode=s=>s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ').replace(/&#(\d+);/g,(_,d)=>String.fromCodePoint(+d));
const clean=s=>decode(s.replace(/<sup>[\s\S]*?<\/sup>/g,'').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').replace(/\s([.,;:])/g,'$1').trim();
// Each figure is a crossfade pair: "bottom" drawing plus a "top" layer that is either the label markup (empty alt) or an alternate view.
const FIGURE=/padding-bottom:\s*([\d.]+)%[\s\S]*?<img class="bottom" src="([^"]+)" alt="([^"]*)">\s*<img class="top" src="([^"]+)" alt="([^"]*)">/g;
const terms=caption=>((caption.match(/<details>[\s\S]*?<\/summary>([\s\S]*?)<\/details>/)||[,''])[1]).split(/<br\s*\/?>/).flatMap(line=>{
 const latin=clean((line.match(/<em>([\s\S]*?)<\/em>/)||[,''])[1]),english=clean(line.replace(/<em>[\s\S]*?<\/em>/,'')).replace(/^[–—-]\s*/,'');
 return latin?[{latin,english:english||latin}]:[];
});
const nav=await get(`${BASE}/navigation-2023.html`);
const paths=[...new Set([...nav.matchAll(/href="([^"]+\.html)"/g)].map(m=>m[1]).filter(p=>SECTIONS.test(p)))].sort();
const pages={};
for(const path of paths){
 const html=await get(BASE+path);if(!html){console.warn(path,'unavailable');continue;}
 const dir=path.replace(/[^/]+$/,''),rel=src=>src.startsWith('/')?src:dir+src;
 const figures=[...html.matchAll(FIGURE)].map(m=>{
  const caption=(html.slice(m.index+m[0].length).match(/<figcaption>([\s\S]*?)<\/figcaption>/)||[,''])[1];
  return {aspect:+(100/+m[1]).toFixed(3),base:rel(m[2]),overlay:rel(m[4]),overlayKind:m[5]?'alternate':'labels',alt:clean(m[3]),overlayAlt:clean(m[5]),caption:clean(caption.replace(/<(bullet|details)>[\s\S]*$/,'')),terms:terms(caption)};
 });
 if(figures.length)pages[path]={title:clean((html.match(/<h1>([\s\S]*?)<\/h1>/)||[,''])[1]),figures};
 console.log(path,figures.length);
}
const out=new URL('../app/anatomy-standard.json',import.meta.url);
fs.writeFileSync(out,JSON.stringify({source:BASE,license:'CC BY-NC 4.0',retrieved:new Date().toISOString().slice(0,10),pages})+'\n');
console.log(`${Object.keys(pages).length} pages, ${Object.values(pages).reduce((n,p)=>n+p.figures.length,0)} figures`);
