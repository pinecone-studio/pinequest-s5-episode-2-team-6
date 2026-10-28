import {useEffect,useRef,type PointerEvent} from 'react';
import {Sparkles,X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import type {AnchorChannel} from './anchor';
import {useLang} from './locale';

export interface InfoBrief {
  name: string;
  latin: string;
  system: string;
  function: string;
  nerve: string;
}

interface Props {
  brief: InfoBrief | null;
  anchor: AnchorChannel;
  onAsk: () => void;
  onHighlight: () => void;
  onShowNerve: () => void;
  onIsolate: () => void;
  onClose: () => void;
}

const KEY = 'anatomy-studio-info-card-position';

function loadPlace(): {x: number; y: number} | null {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) return {x: saved.x, y: saved.y};
  } catch {
    /* Storage can be blocked; the card opens beside the structure instead. */
  }
  return null;
}

function savePlace(place: {x: number; y: number}) {
  try {
    localStorage.setItem(KEY, JSON.stringify(place));
  } catch {
    /* The spot still applies for this visit. */
  }
}

/** A compact card that hangs off the tapped structure in the 3D view. */
export default function InfoCard({brief, anchor, onAsk, onHighlight, onShowNerve, onIsolate, onClose}: Props) {
  const {t} = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const position = useRef({x: 0, y: 0});
  const offset = useRef<{id: string | null; dx: number; dy: number} | null>(null);
  const place = useRef(loadPlace());
  const drag = useRef<{pointer: number; startX: number; startY: number; cardX: number; cardY: number} | null>(null);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      const node = ref.current;
      if (!node) return;
      const point = anchor.current;
      if (!point.visible) {
        node.style.display = 'none';
        return;
      }
      if (offset.current?.id !== point.id) {
        const spot = place.current;
        offset.current = spot ? {id: point.id, dx: spot.x - point.x, dy: spot.y - point.y} : null;
      }

      const isMobile = window.innerWidth <= 768;

      // Footer-ийн дээд ирмэг: card түүнээс доош орохгүй.
      // Footer-ийн root элемент дээр data-card-boundary атрибут тавина.
      const footer = document.querySelector<HTMLElement>('[data-card-boundary]');
      const footerTop = footer
        ? footer.getBoundingClientRect().top
        : window.innerHeight - (isMobile ? 160 : 0);
      const limitBottom = footerTop - 8;

      if (isMobile) {
        const maxH = Math.max(120, Math.min(window.innerHeight * 0.28, limitBottom - 12));
        node.style.maxHeight = `${Math.round(maxH)}px`;
        node.style.overflowY = 'auto';
      } else {
        node.style.maxHeight = 'none';
        node.style.overflowY = 'visible';
      }

      const width = node.offsetWidth || 268;
      const height = node.offsetHeight || 150;

      const flip = point.x + width + 48 > window.innerWidth;
      const moved = offset.current;
      const rawX = moved ? point.x + moved.dx : flip ? point.x - width - 24 : point.x + 24;
      const rawY = moved ? point.y + moved.dy : point.y - height / 2;
      const x = Math.max(12, Math.min(window.innerWidth - width - 12, rawX));
      const y = Math.max(12, Math.min(limitBottom - height, rawY));

      position.current = {x, y};
      node.style.display = '';
      node.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [anchor]);

  if (!brief) return null;

  const startDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {pointer: e.pointerId, startX: e.clientX, startY: e.clientY, cardX: position.current.x, cardY: position.current.y};
    e.currentTarget.classList.add('dragging');
  };
  const moveDrag = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    const point = anchor.current;
    offset.current = {
      id: point.id,
      dx: d.cardX + e.clientX - d.startX - point.x,
      dy: d.cardY + e.clientY - d.startY - point.y,
    };
  };
  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (d?.pointer !== e.pointerId) return;
    drag.current = null;
    if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 3) {
      place.current = {...position.current};
      savePlace(place.current);
    }
    e.currentTarget.classList.remove('dragging');
  };

  return (
    <div
      className="info-card text-xs md:text-sm"
      ref={ref}
      role="dialog"
      aria-label={t.card.about(brief.name)}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div className="info-card-head">
        <div className="info-card-title text-sm md:text-base">
          <strong>{brief.name}</strong>
          {brief.latin && <span className="info-card-latin text-[11px]">{brief.latin}</span>}
          {brief.system && <span className="info-card-system text-[11px]">{brief.system}</span>}
        </div>
        <Button variant="ghost" className="icon-button info-card-close" onClick={onClose} aria-label={t.card.close}>
          <X size={15} />
        </Button>
      </div>
      {brief.function && (
        <p className="info-card-line text-[11px] md:text-xs">
          <b>{t.card.function}:</b> {brief.function}
        </p>
      )}
      {brief.nerve && (
        <p className="info-card-line text-[11px] md:text-xs">
          <b>{t.card.nerve}:</b> {brief.nerve}
        </p>
      )}
      <div className="info-card-actions">
        <Button variant="ghost" className="info-card-chip text-[11px]" onClick={onHighlight}>
          {t.card.highlight}
        </Button>
        {brief.nerve && (
          <Button variant="ghost" className="info-card-chip text-[11px]" onClick={onShowNerve}>
            {t.card.showNerve}
          </Button>
        )}
        <Button variant="ghost" className="info-card-chip text-[11px]" onClick={onIsolate}>
          {t.card.isolate}
        </Button>
        <Button variant="ghost" className="info-card-ask text-[11px]" onClick={onAsk}>
          <Sparkles size={14} /> {t.card.ask}
        </Button>
      </div>
    </div>
  );
}