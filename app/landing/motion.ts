import {useEffect,type RefObject} from 'react';

const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const ease=(t:number)=>1-(1-t)**3;

// Scroll effects that don't need WebGL: the big words that flip in letter by letter,
// the section counter in the header, the drifting halftone blobs and one-shot reveals.
// `copy` changes when the language switches, so the new letters are picked up and placed at once.
export function useLandingMotion(scroller:RefObject<HTMLElement|null>,copy:string){
 useEffect(()=>{
  const root=scroller.current!;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const words=[...root.querySelectorAll<HTMLElement>('[data-word]')].map(word=>({
   step:root.querySelector<HTMLElement>(`[data-step="${word.dataset.word}"]`)!,
   letters:[...word.querySelectorAll<HTMLElement>('.lp-letter')],
   caption:word.querySelector<HTMLElement>('.lp-word-caption'),
  }));
  const sections=[...root.querySelectorAll<HTMLElement>('[data-index]')];
  const counter=root.querySelector<HTMLElement>('[data-counter]'),letter=root.querySelector<HTMLElement>('[data-letter]');
  const blobs=[...root.querySelectorAll<HTMLElement>('.lp-blob')];
  const reveal=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){e.target.classList.add('is-in');reveal.unobserve(e.target);}},{root,threshold:.2});
  root.querySelectorAll('[data-reveal]').forEach(n=>reveal.observe(n));
  let frame=0;
  const update=()=>{
   frame=0;
   const h=root.clientHeight,mid=h/2,y=root.scrollTop;
   for(const w of words){
    const r=w.step.getBoundingClientRect(),p=(mid-r.top)/r.height,n=w.letters.length;
    let shown=0;
    w.letters.forEach((l,i)=>{
     const enter=reduce?1:ease(clamp((p-.02-i*.035)/.24)),exit=reduce?0:clamp((p-.62-i*.025)/.22)**2;
     const off=exit>0?exit:1-enter,dir=exit>0?-1:1,spread=(i-(n-1)/2)*off;
     shown+=enter-exit;
     l.style.opacity=String(Math.max(0,enter-exit));
     l.style.transform=`translate3d(${spread*.08}em,${dir*off*.55}em,0) rotateX(${-dir*off*80}deg) rotateY(${spread*14}deg)`;
     l.style.filter=off>.01?`blur(${off*10}px)`:'';
     l.style.textShadow=off>.01?`0 ${dir*off*.22}em ${off*10}px rgb(24 26 34 / ${off*.4}),0 ${dir*off*.45}em ${off*16}px rgb(24 26 34 / ${off*.2})`:'';
    });
    if(w.caption)w.caption.style.opacity=String(clamp(shown/n));
   }
   let index=0;sections.forEach((s,i)=>{if(s.getBoundingClientRect().top<=mid)index=i;});
   if(counter)counter.textContent=`[ ${String(index+1).padStart(3,'0')} / ${String(sections.length).padStart(3,'0')} ]`;
   if(letter)letter.textContent=`( ${String.fromCharCode(65+index)} )`;
   if(!reduce)blobs.forEach((b,i)=>{b.style.transform=`translate3d(${Math.sin(y*.0011+i*1.7)*14}vw,${Math.cos(y*.0008+i*2.3)*12}vh,0)`;});
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
  root.addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);update();
  return()=>{cancelAnimationFrame(frame);root.removeEventListener('scroll',schedule);removeEventListener('resize',schedule);reveal.disconnect();};
 },[scroller,copy]);
}
