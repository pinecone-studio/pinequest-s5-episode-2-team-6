import {useEffect,useRef,useState,type KeyboardEvent,type PointerEvent} from 'react';
import {Maximize2,Minimize2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useLang} from './locale';

// What the user can change: the sheet's height and width, and its gap from the screen's right edge.
type Size = 'height' | 'width' | 'right';
// The grips, one per edge the user can drag.
type Edge = 'bottom' | 'left' | 'right';

const KEYS: Record<Size, string> = {
  height: 'anatomy-studio-detail-height',
  width: 'anatomy-studio-detail-width',
  right: 'anatomy-studio-detail-right',
};
// The smallest the sheet can be made.
const MIN = {height: 240, width: 280};
// The room the sheet leaves above the footer, at the screen's left edge and at its right edge.
const GAP = 56;
const EDGE = 24;
const MARGIN = 12;
// How wide the expand button makes the sheet.
const WIDE = 480;
// Pointer travel each key stands for, along the edge's own axis (down or right is positive).
const KEY_TRAVEL: Record<Edge, Record<string, number>> = {
  bottom: {ArrowUp: -24, ArrowDown: 24, Home: -Infinity, End: Infinity},
  left: {ArrowLeft: -24, ArrowRight: 24, Home: Infinity, End: -Infinity},
  right: {ArrowLeft: -24, ArrowRight: 24, Home: -Infinity, End: Infinity},
};

function loadSize(size: Size): number | null {
  try {
    const saved = Number(localStorage.getItem(KEYS[size]));
    if (saved > 0) return saved;
  } catch {
    /* Storage can be blocked; the sheet keeps its default size instead. */
  }
  return null;
}

function saveSize(size: Size, value: number | null) {
  try {
    if (value === null) localStorage.removeItem(KEYS[size]);
    else localStorage.setItem(KEYS[size], String(value));
  } catch {
    /* The size still applies for this visit. */
  }
}

/** The sheet's gap from the screen's right edge, read from its style so its opening slide doesn't skew it. */
function rightGap(sheet: HTMLElement): number {
  return Math.round(parseFloat(getComputedStyle(sheet).right));
}

/** The largest the sheet can be in one direction while staying on screen. */
function largest(sheet: HTMLElement, size: 'height' | 'width'): number {
  const room = size === 'height' ? window.innerHeight - sheet.getBoundingClientRect().top - GAP : window.innerWidth - rightGap(sheet) - EDGE;
  return Math.max(MIN[size], Math.round(room));
}

/** Sets one size of the sheet, kept within the screen, or returns it to the default when null. */
function applySize(sheet: HTMLElement, size: Size, value: number | null): number | null {
  if (value === null) {
    sheet.style.removeProperty(`--detail-${size}`);
    sheet.removeAttribute(`data-${size}`);
    return null;
  }
  const next = Math.round(size === 'right' ? Math.max(MARGIN, value) : Math.min(largest(sheet, size), Math.max(MIN[size], value)));
  sheet.style.setProperty(`--detail-${size}`, `${next}px`);
  sheet.setAttribute(`data-${size}`, '');
  return next;
}

/** Where the sheet stands when a drag or key press starts. */
function measure(sheet: HTMLElement) {
  return {
    height: sheet.offsetHeight,
    width: sheet.offsetWidth,
    right: rightGap(sheet),
  };
}

/**
 * An expand button beside the close button, and grips along the detail sheet's
 * bottom, left and right edges. The sheet fits its content until resized; the
 * button, or double-clicking a grip, puts it back.
 */
export default function SheetResizer() {
  const {t} = useLang();
  const grips = {bottom: useRef<HTMLDivElement>(null), left: useRef<HTMLDivElement>(null), right: useRef<HTMLDivElement>(null)};
  const drag = useRef<{edge: Edge; pointer: number; x: number; y: number; start: ReturnType<typeof measure>; moved: boolean} | null>(null);
  const [sized, setSized] = useState({height: false, width: false, right: false});
  const expanded = sized.height || sized.width || sized.right;

  // Sets one size and updates the grips; while dragging, sizes are saved only on release.
  const resize = (size: Size, value: number | null, save = true) => {
    const sheet = grips.bottom.current?.closest<HTMLElement>('.detail-sheet');
    if (!sheet) return;
    const next = applySize(sheet, size, value);
    setSized(s => (s[size] === (next !== null) ? s : {...s, [size]: next !== null}));
    if (save) saveSize(size, next);
    for (const edge of ['bottom', 'left', 'right'] as const) {
      const axis = edge === 'bottom' ? 'height' : 'width';
      grips[edge].current?.setAttribute('aria-valuemax', String(largest(sheet, axis)));
      grips[edge].current?.setAttribute('aria-valuenow', String(axis === 'height' ? sheet.offsetHeight : sheet.offsetWidth));
    }
  };

  // Moves one edge by the pointer's travel from where the sheet stood at the start.
  const stretch = (edge: Edge, start: ReturnType<typeof measure>, travel: number, save = true) => {
    if (edge === 'bottom') return resize('height', start.height + travel, save);
    if (edge === 'left') return resize('width', start.width - travel, save);
    // The right edge moves while the left edge stays put, so the gap and width change together.
    const moved = Math.min(start.right - MARGIN, Math.max(MIN.width - start.width, travel));
    resize('right', start.right - moved, save);
    resize('width', start.width + moved, save);
  };

  useEffect(() => {
    for (const size of ['right', 'height', 'width'] as const) resize(size, loadSize(size), false);
  }, []);

  const startDrag = (e: PointerEvent<HTMLDivElement>, edge: Edge) => {
    const sheet = e.currentTarget.closest<HTMLElement>('.detail-sheet');
    if (e.button !== 0 || !sheet) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {edge, pointer: e.pointerId, x: e.clientX, y: e.clientY, start: measure(sheet), moved: false};
    sheet.dataset.resizing = edge;
  };
  const travel = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current!;
    return d.edge === 'bottom' ? e.clientY - d.y : e.clientX - d.x;
  };
  const moveDrag = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    if (!d.moved && Math.abs(travel(e)) < 3) return;
    d.moved = true;
    stretch(d.edge, d.start, travel(e), false);
  };
  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (d?.pointer !== e.pointerId) return;
    if (d.moved) stretch(d.edge, d.start, travel(e));
    drag.current = null;
    e.currentTarget.closest<HTMLElement>('.detail-sheet')?.removeAttribute('data-resizing');
  };
  const nudge = (e: KeyboardEvent<HTMLDivElement>, edge: Edge) => {
    const sheet = e.currentTarget.closest<HTMLElement>('.detail-sheet');
    const step = KEY_TRAVEL[edge][e.key];
    if (!sheet || step === undefined) return;
    e.preventDefault();
    stretch(edge, measure(sheet), step);
  };
  const reset = (edge: Edge) => {
    if (edge === 'bottom') return resize('height', null);
    resize('right', null);
    resize('width', null);
  };
  const toggle = () => {
    if (expanded) {
      for (const size of ['right', 'height', 'width'] as const) resize(size, null);
      return;
    }
    resize('height', Infinity);
    resize('width', WIDE);
  };

  const grip = (edge: Edge) => (
    <div
      ref={grips[edge]}
      className={`sheet-grip sheet-grip-${edge}`}
      role="separator"
      aria-orientation={edge === 'bottom' ? 'horizontal' : 'vertical'}
      aria-label={t.resize[edge]}
      aria-valuemin={edge === 'bottom' ? MIN.height : MIN.width}
      tabIndex={0}
      title={t.resize.grip}
      onPointerDown={e => startDrag(e, edge)}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={() => reset(edge)}
      onKeyDown={e => nudge(e, edge)}
    />
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        className="sheet-expand"
        aria-label={expanded ? t.resize.restore : t.resize.expand}
        title={expanded ? t.resize.restoreTip : t.resize.expandTip}
        onClick={toggle}
      >
        {expanded ? <Minimize2 /> : <Maximize2 />}
      </Button>
      {grip('bottom')}
      {grip('left')}
      {grip('right')}
    </>
  );
}
