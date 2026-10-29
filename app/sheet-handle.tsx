import {useRef,type PointerEvent} from 'react';
import {useLang} from './locale';

// How far a finger has to travel before it counts as a swipe rather than a tap.
const SWIPE = 24;

interface Props {
  full: boolean;
  onChange: (full: boolean) => void;
  onClose: () => void;
}

/**
 * The grab bar on top of the details sheet on phones. The sheet opens low so the
 * tapped structure stays in view; a tap or an upward swipe opens it to full height,
 * and a downward swipe lowers it again or, when already low, closes it.
 */
export default function SheetHandle({full, onChange, onClose}: Props) {
  const {t} = useLang();
  const start = useRef<{pointer: number; y: number} | null>(null);

  const down = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = {pointer: e.pointerId, y: e.clientY};
  };
  const up = (e: PointerEvent<HTMLButtonElement>) => {
    const s = start.current;
    if (s?.pointer !== e.pointerId) return;
    start.current = null;
    const travel = e.clientY - s.y;
    if (Math.abs(travel) < SWIPE) onChange(!full);
    else if (travel < 0) onChange(true);
    else if (full) onChange(false);
    else onClose();
  };

  return (
    <button
      type="button"
      className="sheet-handle"
      aria-expanded={full}
      aria-label={full ? t.resize.restore : t.resize.expand}
      title={full ? t.resize.restoreTip : t.resize.expandTip}
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={() => (start.current = null)}
      onKeyDown={e => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        onChange(!full);
      }}
    />
  );
}
