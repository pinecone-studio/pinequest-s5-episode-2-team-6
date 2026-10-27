// The upgrade dialog the atlas shows when a free user opens a premium
// tool (ROM Lab, Plaque Lab). Bilingual, links to the account page.
import type {ReactNode} from 'react';
import {Link} from 'react-router-dom';
import {Button,buttonVariants} from '@/components/ui/button';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from '@/components/ui/dialog';
import {useLang} from './locale';

const copy={
  en:{
    title:'Premium feature',
    lead:'ROM Lab and the Plaque Lab are part of Premium. The main atlas — every system, search, the tour, and the quiz — stays free.',
    perks:()=>(
      <ul className="list-disc pl-5">
        <li>Range-of-motion lab: move in front of the camera and watch muscles light up</li>
        <li>Plaque lab: renal-artery flow demonstration</li>
      </ul>
    ) as ReactNode,
    cta:'See plans',
    later:'Maybe later',
  },
  mn:{
    title:'Premium боломж',
    lead:'ROM Lab болон Plaque Lab нь Premium багцын хэсэг. Гол атлас — бүх систем, хайлт, аялал, сорил — үнэгүй.',
    perks:()=>(
      <ul className="list-disc pl-5">
        <li>Хөдөлгөөний далайцын лаб: камерын өмнө хөдөлж, ажилласан булчинг 3D дээр харна</li>
        <li>Plaque lab: бөөрний артерийн цусны урсгалын үзүүлэн</li>
      </ul>
    ) as ReactNode,
    cta:'Багц харах',
    later:'Дараа үзье',
  },
} as const;

export default function PaywallDialog({open,onClose}:{open:boolean;onClose:()=>void}){
  const {lang}=useLang();
  const dict=copy[lang];
  return(
    <Dialog open={open} onOpenChange={next=>{if(!next)onClose();}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{dict.title}</DialogTitle>
          <DialogDescription>{dict.lead}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{dict.perks()}</div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>{dict.later}</Button>
            <Link to="/account" className={buttonVariants()} onClick={onClose}>{dict.cta}</Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
