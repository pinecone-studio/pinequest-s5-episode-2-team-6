import {useEffect, useRef, useState} from 'react';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  CircleAlert,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {computeElbowActivation, type ActivationFrame} from './activation';
import {
  createRomTracker,
  resetRomTracker,
  updateRomTracker,
  type RomTracker,
} from './joints';
import {NORMATIVE_ROM, type RomSide} from './muscle-map';
import {PoseSession} from './pose-session';

interface Props {
  parts: {id: string; name: string}[];
  open: boolean;
  onClose: () => void;
  onActivation: (frame: ActivationFrame | null) => void;
  onRomFocus: (active: boolean) => void;
}

type TrackStatus = 'idle' | 'starting' | 'searching' | 'tracking' | 'lost';

export default function RomPanel({
  parts,
  open,
  onClose,
  onActivation,
  onRomFocus,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<PoseSession | null>(null);
  const sideRef = useRef<RomSide>('right');
  const prevAngle = useRef<number | null>(null);
  const prevTime = useRef<number | null>(null);
  const lastSeen = useRef(0);

  const [side, setSide] = useState<RomSide>('right');
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<TrackStatus>('idle');
  const [tracker, setTracker] = useState<RomTracker>(() => createRomTracker(90));
  const [activation, setActivation] = useState<ActivationFrame | null>(null);

  sideRef.current = side;

  useEffect(() => {
    if (!open) {
      sessionRef.current?.stop();
      sessionRef.current = null;
      setRunning(false);
      setBusy(false);
      setStatus('idle');
      setError('');
      prevAngle.current = null;
      prevTime.current = null;
      onActivation(null);
      onRomFocus(false);
    }
  }, [open, onActivation, onRomFocus]);

  useEffect(
    () => () => {
      sessionRef.current?.stop();
      sessionRef.current = null;
    },
    [],
  );

  const start = async () => {
    if (!videoRef.current || !canvasRef.current || busy) return;
    setBusy(true);
    setError('');
    setStatus('starting');
    setTracker(createRomTracker(90));
    prevAngle.current = null;
    prevTime.current = null;
    onRomFocus(true);
    const session = new PoseSession(
      videoRef.current,
      canvasRef.current,
      () => sideRef.current,
      ({elbow, timestampMs}) => {
        if (!elbow) {
          setStatus(timestampMs - lastSeen.current > 700 ? 'lost' : 'searching');
          return;
        }
        lastSeen.current = timestampMs;
        setStatus('tracking');
        setTracker((t) => updateRomTracker(t, elbow.angleDeg));
        const dt =
          prevTime.current == null
            ? 0.016
            : Math.max(0.008, (timestampMs - prevTime.current) / 1000);
        const frame = computeElbowActivation(
          parts,
          sideRef.current,
          elbow.angleDeg,
          prevAngle.current,
          dt,
        );
        prevAngle.current = elbow.angleDeg;
        prevTime.current = timestampMs;
        setActivation(frame);
        onActivation(frame);
      },
      (message) => {
        setError(message);
        setRunning(false);
        setBusy(false);
        setStatus('idle');
        onRomFocus(false);
        onActivation(null);
      },
    );
    sessionRef.current = session;
    await session.start();
    if (sessionRef.current === session) {
      setRunning(true);
      setBusy(false);
      setStatus('searching');
    }
  };

  const stop = () => {
    sessionRef.current?.stop();
    sessionRef.current = null;
    setRunning(false);
    setBusy(false);
    setStatus('idle');
    prevAngle.current = null;
    prevTime.current = null;
    setActivation(null);
    onActivation(null);
    onRomFocus(false);
  };

  if (!open) return null;

  const norm = NORMATIVE_ROM.elbow;
  const hasData = tracker.samples > 0;
  const romSpan = hasData ? tracker.max - tracker.min : 0;
  const angle = hasData ? tracker.current : 0;
  const gaugePct = Math.min(100, Math.max(0, (angle / norm.max) * 100));
  const minPct = hasData ? Math.min(100, Math.max(0, (tracker.min / norm.max) * 100)) : 0;
  const maxPct = hasData ? Math.min(100, Math.max(0, (tracker.max / norm.max) * 100)) : 0;
  const flexorPct = Math.round((activation?.agonistLevel ?? 0) * 100);
  const extensorPct = Math.round((activation?.antagonistLevel ?? 0) * 100);

  const statusCopy: Record<TrackStatus, string> = {
    idle: 'Тэгээд бэлэн',
    starting: 'Камер нээж байна…',
    searching: `${side === 'left' ? 'Зүүн' : 'Баруун'} гараа харуулна уу`,
    tracking: 'Өршүүдийг хянаж байна',
    lost: `${side === 'left' ? 'Зүүн' : 'Баруун'} гарыг хайж байна…`,
  };

  return (
    <section className="rom-panel glass" aria-label="Хөдөлгөөний хүрээний лаборатори">
      <header className="rom-header">
        <div className="rom-title-block">
          <p className="rom-kicker">Амьд хөдөлгөөн</p>
          <h2 className="rom-title">Өршүүдний ROM лаборатори</h2>
          <p className="rom-subtitle">
            Гараа нуцаавал өнцөг болон аль булчин эргэлж байгааг загвараар харна уу.
          </p>
        </div>
        <Button
          variant="ghost"
          className="icon-button rom-close"
          onClick={() => {
            stop();
            onClose();
          }}
          aria-label="ROM лаборатори хаах"
        >
          <X size={18} />
        </Button>
      </header>

      <div className={`rom-status rom-status-${status}`} role="status">
        <span className="rom-status-dot" />
        {statusCopy[status]}
      </div>

      {!running && (
        <ol className="rom-steps">
          <li>
            <em>1</em>
            <span>Зүүн эсвэл баруун гараа сонгоно уу</span>
          </li>
          <li>
            <em>2</em>
            <span>Камерыг нээнэ уу</span>
          </li>
          <li>
            <em>3</em>
            <span>Нуцааж, суллуулж 3D биеээ харна уу</span>
          </li>
        </ol>
      )}

      <div className="rom-side-toggle" role="group" aria-label="Гарын тал">
        <Button
          variant="ghost"
          aria-pressed={side === 'left'}
          className={side === 'left' ? 'active' : ''}
          onClick={() => setSide('left')}
        >
          Зүүн гар
        </Button>
        <Button
          variant="ghost"
          aria-pressed={side === 'right'}
          className={side === 'right' ? 'active' : ''}
          onClick={() => setSide('right')}
        >
          Баруун гар
        </Button>
      </div>

      <div className={`rom-video-wrap${running ? ' is-live' : ''}`}>
        <video ref={videoRef} className="rom-video-hidden" playsInline muted />
        <canvas ref={canvasRef} className="rom-canvas" />
        {!running && (
          <div className="rom-video-placeholder">
            <div className="rom-placeholder-icon">
              <Camera size={22} />
            </div>
            <strong>Камерын харалцлага</strong>
            <span>
              {side === 'left' ? 'Зүүн' : 'Баруун'} өршүүд болон бударгай харагдах
              байрлалд зогсоно уу
            </span>
          </div>
        )}
        {running && (
          <div className="rom-live-chip">
            <span className="rom-live-pulse" />
            Шууд
          </div>
        )}
      </div>

      <div className="rom-actions">
        {!running ? (
          <Button className="rom-primary" onClick={start} disabled={busy}>
            <Camera size={18} />
            {busy ? 'Нээж байна…' : 'Камер нээх'}
          </Button>
        ) : (
          <Button className="rom-primary rom-primary-stop" onClick={stop}>
            <CameraOff size={18} />
            Зогсоох
          </Button>
        )}
        <Button
          variant="ghost"
          className="rom-secondary"
          disabled={!hasData}
          onClick={() => setTracker(resetRomTracker(tracker.current))}
        >
          <RotateCcw size={16} />
          Хүрээ сэргээх
        </Button>
      </div>

      {error && (
        <p className="rom-error" role="alert">
          <CircleAlert size={15} />
          {error}
        </p>
      )}

      <div className="rom-gauge-card">
        <div className="rom-gauge-top">
          <div>
            <span className="rom-gauge-label">Өршүүдний гуйлт</span>
            <div className="rom-gauge-value">
              {hasData ? (
                <>
                  {angle.toFixed(0)}
                  <small>°</small>
                </>
              ) : (
                <span className="rom-gauge-empty">—</span>
              )}
            </div>
          </div>
          <div className="rom-gauge-ring" aria-hidden="true">
            <svg viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="30" className="rom-ring-track" />
              <circle
                cx="36"
                cy="36"
                r="30"
                className="rom-ring-value"
                style={{
                  strokeDasharray: `${(gaugePct / 100) * 188.5} 188.5`,
                }}
              />
            </svg>
            <span className="rom-gauge-icon">
              <Sparkles size={16} />
            </span>
          </div>
        </div>

        <div className="rom-range-track" aria-hidden="true">
          <div className="rom-range-fill" style={{width: `${gaugePct}%`}} />
          {hasData && (
            <div
              className="rom-range-window"
              style={{left: `${minPct}%`, width: `${Math.max(2, maxPct - minPct)}%`}}
            />
          )}
        </div>
        <div className="rom-range-labels">
          <span>Бүтэлтэй 0°</span>
          <span>Нуцсан {norm.max}°</span>
        </div>

        <div className="rom-metric-row">
          <div>
            <span>Таны хүрээ</span>
            <strong>{hasData ? `${romSpan.toFixed(0)}°` : '—'}</strong>
          </div>
          <div>
            <span>Хамгийн бага</span>
            <strong>{hasData ? `${tracker.min.toFixed(0)}°` : '—'}</strong>
          </div>
          <div>
            <span>Хамгийн их</span>
            <strong>{hasData ? `${tracker.max.toFixed(0)}°` : '—'}</strong>
          </div>
        </div>
      </div>

      <div className={`rom-muscles-card${activation ? ' is-active' : ''}`}>
        <div className="rom-muscles-head">
          <h3>Булчны үйл ажиллагаа</h3>
          <span>3D биед улаангаар харагдана</span>
        </div>

        <div className="rom-muscle-card">
          <div className="rom-muscle-meta">
            <strong>Нуцааж байна</strong>
            <span>Biceps · brachialis · brachioradialis</span>
          </div>
          <div className="rom-muscle-bar">
            <i style={{width: `${flexorPct}%`}} />
          </div>
          <em>{activation ? `${flexorPct}%` : '—'}</em>
        </div>

        <div className="rom-muscle-card">
          <div className="rom-muscle-meta">
            <strong>Буцаан суллуулж байна</strong>
            <span>Triceps</span>
          </div>
          <div className="rom-muscle-bar">
            <i className="antagonist" style={{width: `${extensorPct}%`}} />
          </div>
          <em>{activation ? `${extensorPct}%` : '—'}</em>
        </div>

        {!activation && (
          <p className="rom-muscles-idle">
            Камерыг нээж, гараа хөдөлгөөж эдгээр бүлгийг гэрэлтүүлнэ үү.
          </p>
        )}
      </div>

      <p className="rom-disclaimer">
        <CheckCircle2 size={13} />
        Зөвхөн сурах зориулалттай жижиг харагдац — эмнэлгийн ROM эсвэл EMG хэмжилт
        биш. Өршүүдний гуйлтын ердийн хүрээ ~{norm.min}–{norm.max}°.
      </p>
    </section>
  );
}
