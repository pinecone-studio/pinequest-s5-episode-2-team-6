import {Vector3,type Camera} from 'three';
import {ANATOMY_IDS,EDUCATION,type AnatomyId} from './education';
import type {Lang} from '../landing/copy';

/** Screen-space rails keep labels apart while leaders follow the actual moving bones. */
export function createAnatomyOverlay(host:HTMLElement,onSelect:(id:AnatomyId)=>void){
 const layer=document.createElement('div');layer.className='fall-anatomy-overlay';layer.setAttribute('role','group');
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('aria-hidden','true');layer.appendChild(svg);
 const labels=ANATOMY_IDS.map((id,index)=>{
  const button=document.createElement('button');button.type='button';button.className='fall-anatomy-label';button.dataset.anatomy=id;
  button.addEventListener('click',()=>onSelect(id));
  const line=document.createElementNS(svg.namespaceURI,'line');svg.appendChild(line);layer.appendChild(button);
  return {id,index,button,line};
 });host.appendChild(layer);
 return {
  update(camera:Camera,points:Map<AnatomyId,Vector3>,enabled:boolean,focused:AnatomyId|null,lang:Lang){
   layer.hidden=!enabled;layer.setAttribute('aria-label',EDUCATION[lang].inspect);if(!enabled)return;
   const w=host.clientWidth,h=host.clientHeight,labelWidth=w<480?106:132;
   svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
   for(const {id,index,button,line} of labels){
    const point=points.get(id)?.clone().project(camera),visible=!!point&&point.z>=-1&&point.z<=1&&Math.abs(point.x)<=1&&Math.abs(point.y)<=1;
    button.hidden=!visible;line.setAttribute('visibility',visible?'visible':'hidden');if(!visible||!point)continue;
    const left=index%2===0,row=Math.floor(index/2),top=76+row*61;
    button.textContent=EDUCATION[lang].structures[id].name;button.setAttribute('aria-pressed',String(id===focused));
    button.style.width=`${labelWidth}px`;button.style.top=`${Math.min(top,h-54)}px`;button.style.left=left?'10px':`${w-labelWidth-10}px`;
    line.setAttribute('x1',String((point.x*.5+.5)*w));line.setAttribute('y1',String((-point.y*.5+.5)*h));
    line.setAttribute('x2',String(left?10+labelWidth:w-labelWidth-10));line.setAttribute('y2',String(Math.min(top,h-54)+17));
    line.setAttribute('class',id===focused?'is-focused':'');
   }
  },
  dispose(){layer.remove();},
 };
}
