import {useEffect,useRef} from 'react';
import {Sparkles,X} from 'lucide-react';
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

/** A compact card that hangs off the tapped structure in the 3D view. */
export default function InfoCard({brief, anchor, onAsk, onHighlight, onShowNerve, onIsolate, onClose}: Props) {
  const ref = useRef<HTMLDivElement>(null);

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
      const width = node.offsetWidth || 268;
      const height = node.offsetHeight || 150;
      const flip = point.x + width + 48 > window.innerWidth;
      const x = Math.max(12, Math.min(window.innerWidth - width - 12, flip ? point.x - width - 24 : point.x + 24));
      const y = Math.max(12, Math.min(window.innerHeight - height - 12, point.y - height / 2));
      node.style.display = '';
      node.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [anchor]);

  if (!brief) return null;

  return (
    <div className="info-card" ref={ref} role="dialog" aria-label={`About ${brief.name}`}>
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
