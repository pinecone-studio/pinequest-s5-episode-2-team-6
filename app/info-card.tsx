import {useEffect,useRef} from 'react';
import type {PointerEvent as ReactPointerEvent} from 'react';
import {GripHorizontal,Sparkles,X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import type {AnchorChannel} from './anchor';

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

// Movement below this many pixels is a click on the card, not a drag.
const DRAG_THRESHOLD = 4;

/** A compact card that hangs off the tapped structure in the 3D view.
 *
 * Dragging it (anywhere but its buttons) pins it where it is dropped, so it stops
 * following the model; selecting another structure, or double-clicking the card,
 * attaches it to the model again. */
export default function InfoCard({brief, anchor, onAsk, onHighlight, onShowNerve, onIsolate, onClose}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const pinned = useRef<{x: number; y: number; id: string | null} | null>(null);
  const drag = useRef<{pointer: number; startX: number; startY: number; dx: number; dy: number; moved: boolean} | null>(null);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      const node = ref.current;
      if (!node) return;
      const point = anchor.current;
      if (pinned.current && pinned.current.id !== point.id) pinned.current = null;
      if (!pinned.current && !point.visible) {
        node.style.display = 'none';
        return;
      }
      const width = node.offsetWidth || 268;
      const height = node.offsetHeight || 150;
      let x: number, y: number;
      if (pinned.current) {
        ({x, y} = pinned.current);
      } else {
        const flip = point.x + width + 48 > window.innerWidth;
        x = flip ? point.x - width - 24 : point.x + 24;
        y = point.y - height / 2;
      }
      // Keep the card on screen, including a pinned one after the window shrinks.
      x = Math.max(12, Math.min(window.innerWidth - width - 12, x));
      y = Math.max(12, Math.min(window.innerHeight - height - 12, y));
      node.style.display = '';
      node.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [anchor]);

  if (!brief) return null;

  const onButton = (e: ReactPointerEvent) => e.target instanceof Element && !!e.target.closest('button,a');
  const grab = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || onButton(e)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    drag.current = {pointer: e.pointerId, startX: e.clientX, startY: e.clientY, dx: e.clientX - rect.left, dy: e.clientY - rect.top, moved: false};
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  };
  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < DRAG_THRESHOLD) return;
    d.moved = true;
    e.currentTarget.classList.add('is-dragging');
    pinned.current = {x: e.clientX - d.dx, y: e.clientY - d.dy, id: anchor.current.id};
  };
  const drop = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current || drag.current.pointer !== e.pointerId) return;
    drag.current = null;
    e.currentTarget.classList.remove('is-dragging');
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div
      className="info-card"
      ref={ref}
      role="dialog"
      aria-label={`About ${brief.name}`}
      onPointerDown={grab}
      onPointerMove={move}
      onPointerUp={drop}
      onPointerCancel={drop}
      onDoubleClick={e => {
        if (!(e.target instanceof Element && e.target.closest('button,a'))) pinned.current = null;
      }}
    >
      <GripHorizontal size={14} className="info-card-grip" aria-hidden />
      <div className="info-card-head">
        <div className="info-card-title">
          <strong>{brief.name}</strong>
          {brief.latin && <span className="info-card-latin">{brief.latin}</span>}
          {brief.system && <span className="info-card-system">{brief.system}</span>}
        </div>
        <Button variant="ghost" className="icon-button info-card-close" onClick={onClose} aria-label="Close information card">
          <X size={15} />
        </Button>
      </div>
      {brief.function && (
        <p className="info-card-line">
          <b>Function:</b> {brief.function}
        </p>
      )}
      {brief.nerve && (
        <p className="info-card-line">
          <b>Nerve:</b> {brief.nerve}
        </p>
      )}
      <div className="info-card-actions">
        <Button variant="ghost" className="info-card-chip" onClick={onHighlight}>
          Highlight
        </Button>
        {brief.nerve && (
          <Button variant="ghost" className="info-card-chip" onClick={onShowNerve}>
            Show its nerve
          </Button>
        )}
        <Button variant="ghost" className="info-card-chip" onClick={onIsolate}>
          Isolate
        </Button>
        <Button variant="ghost" className="info-card-ask" onClick={onAsk}>
          <Sparkles size={14} /> Ask AI about this
        </Button>
      </div>
    </div>
  );
}
