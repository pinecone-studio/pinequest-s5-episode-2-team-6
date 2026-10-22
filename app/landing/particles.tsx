import {useEffect,useRef} from 'react';

// The closing wordmark drawn as a few thousand dots. They drift in from a horizontal smear
// as the section scrolls into view, then step aside around the pointer.
type Particle={tx:number;ty:number;sx:number;sy:number;delay:number;phase:number;size:number};
const STOPS=[[47,92,255],[138,77,255],[255,59,85]];
const BUCKETS=24;
const mixStops=(t:number)=>{const s=Math.min(STOPS.length-1.001,t*(STOPS.length-1)),i=Math.floor(s),f=s-i,a=STOPS[i],b=STOPS[i+1];return `rgb(${a.map((v,k)=>Math.round(v+(b[k]-v)*f)).join(',')})`;};
const COLORS=Array.from({length:BUCKETS},(_,i)=>mixStops(i/(BUCKETS-1)));
const DUST=['#2f5cff','#8a4dff','#ff3b55','#1d2129'];

export default function ParticleLogo({text}:{text:string}){
 const host=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const el=host.current!,canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)return;
  el.appendChild(canvas);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w=0,h=0,frame=0,visible=false,disposed=false,buckets:Particle[][]=[];
  let dust:{x:number;y:number;r:number;color:string;speed:number}[]=[];
  const pointer={x:-1e4,y:-1e4};
  const build=()=>{
   const rect=el.getBoundingClientRect();w=rect.width;h=rect.height;if(!w||!h)return;
   const dpr=Math.min(devicePixelRatio,2);canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
   const off=document.createElement('canvas');off.width=Math.ceil(w);off.height=Math.ceil(h);const o=off.getContext('2d',{willReadFrequently:true})!;
   const lines=w<640?text.split(' '):[text],font=(s:number)=>`500 ${s}px "Inter Tight",Inter,sans-serif`;
   o.font=font(100);const widest=Math.max(...lines.map(l=>o.measureText(l).width));
   const size=Math.min(100*w*.84/widest,h*.42/lines.length);
   o.font=font(size);o.textAlign='center';o.textBaseline='middle';o.fillStyle='#000';
   lines.forEach((line,i)=>o.fillText(line,w/2,h/2+(i-(lines.length-1)/2)*size*1.02));
   const data=o.getImageData(0,0,off.width,off.height).data,gap=3;
   buckets=Array.from({length:BUCKETS},()=>[]);
   for(let y=0;y<off.height;y+=gap)for(let x=0;x<off.width;x+=gap){
    if(data[(y*off.width+x)*4+3]<130)continue;
    const t=x/w,jx=x+(Math.random()-.5)*gap*.6,jy=y+(Math.random()-.5)*gap*.6;
    buckets[Math.min(BUCKETS-1,Math.max(0,Math.round(((t-.12)/.76)*(BUCKETS-1))))].push({tx:jx,ty:jy,sx:jx+(Math.random()-.5)*w*1.1,sy:h/2+(Math.random()-.5)*h*(Math.random()<.7?.18:1),delay:Math.random()*.35+t*.12,phase:Math.random()*Math.PI*2,size:Math.random()<.15?2.6:1.9});
   }
   dust=Array.from({length:Math.round(w*h/9000)},()=>({x:Math.random()*w,y:Math.random()*h,r:Math.random()<.1?2.6:Math.random()*1.4+.5,color:DUST[Math.floor(Math.random()*DUST.length)],speed:Math.random()*.15+.03}));
  };
  const progress=()=>{if(reduce)return 1;const top=el.getBoundingClientRect().top;return Math.min(1,Math.max(0,(innerHeight-top)/(innerHeight*.85)));};
  const draw=(now:number)=>{
   frame=0;if(disposed)return;
   const p=progress(),time=reduce?0:now/1000;
   ctx.clearRect(0,0,w,h);
   for(const d of dust){if(!reduce){d.y-=d.speed;if(d.y<-4)d.y=h+4;}ctx.globalAlpha=.55;ctx.fillStyle=d.color;ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,Math.PI*2);ctx.fill();}
   ctx.globalAlpha=1;
   buckets.forEach((list,b)=>{
    ctx.fillStyle=COLORS[b];
    for(const q of list){
     const e=Math.min(1,Math.max(0,(p-q.delay)/.5)),k=e*e*(3-2*e),loose=1-k;
     let x=q.sx+(q.tx-q.sx)*k+Math.sin(time*1.3+q.phase)*(1.2+loose*8),y=q.sy+(q.ty-q.sy)*k+Math.cos(time*1.1+q.phase)*(1.2+loose*5);
     const dx=x-pointer.x,dy=y-pointer.y,d2=dx*dx+dy*dy;
     if(d2<8100){const d=Math.sqrt(d2)||1,push=(1-d/90)*22*k;x+=dx/d*push;y+=dy/d*push;}
     ctx.fillRect(x,y,q.size,q.size);
    }
   });
   if(visible&&!reduce)frame=requestAnimationFrame(draw);
  };
  const start=()=>{if(!frame)frame=requestAnimationFrame(draw);};
  const io=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)start();});io.observe(el);
  const move=(e:PointerEvent)=>{const r=el.getBoundingClientRect();pointer.x=e.clientX-r.left;pointer.y=e.clientY-r.top;};
  const leave=()=>{pointer.x=pointer.y=-1e4;};
  let resizeTimer=0;const resize=()=>{clearTimeout(resizeTimer);resizeTimer=window.setTimeout(()=>{build();start();},150);};
  el.addEventListener('pointermove',move);el.addEventListener('pointerleave',leave);addEventListener('resize',resize);
  // Sample the wordmark only once its web font is in, or the dots spell a fallback face.
  document.fonts.load('500 100px "Inter Tight"').catch(()=>{}).finally(()=>{if(disposed)return;build();start();});
  return()=>{disposed=true;cancelAnimationFrame(frame);clearTimeout(resizeTimer);io.disconnect();el.removeEventListener('pointermove',move);el.removeEventListener('pointerleave',leave);removeEventListener('resize',resize);canvas.remove();};
 },[text]);
 return <div ref={host} className="lp-particles" aria-hidden/>;
}
