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
    idle: 'Ready when you are',
    starting: 'Starting camera…',
    searching: `Show your ${side} arm`,
    tracking: 'Tracking elbow',
    lost: `Looking for your ${side} arm…`,
  };

  return (
    <section className="rom-panel glass" aria-label="Range of motion lab">
      <header className="rom-header">
        <div className="rom-title-block">
          <p className="rom-kicker">Live movement</p>
          <h2 className="rom-title">Elbow ROM lab</h2>
          <p className="rom-subtitle">
            Bend your arm — see the angle and which muscles light up on the atlas.
          </p>
        </div>
        <Button
          variant="ghost"
          className="icon-button rom-close"
          onClick={() => {
            stop();
            onClose();
          }}
          aria-label="Close ROM lab"
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
            <span>Pick left or right arm</span>
          </li>
          <li>
            <em>2</em>
            <span>Start the camera</span>
          </li>
          <li>
            <em>3</em>
            <span>Flex and extend — watch the 3D body</span>
          </li>
        </ol>
      )}

      <div className="rom-side-toggle" role="group" aria-label="Arm side">
        <Button
          variant="ghost"
          aria-pressed={side === 'left'}
          className={side === 'left' ? 'active' : ''}
          onClick={() => setSide('left')}
        >
          Left arm
        </Button>
        <Button
          variant="ghost"
          aria-pressed={side === 'right'}
          className={side === 'right' ? 'active' : ''}
          onClick={() => setSide('right')}
        >
          Right arm
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
            <strong>Camera preview</strong>
            <span>Stand so your {side} elbow and wrist are visible</span>
          </div>
        )}
        {running && (
          <div className="rom-live-chip">
            <span className="rom-live-pulse" />
            Live
          </div>
        )}
      </div>

      <div className="rom-actions">
        {!running ? (
          <Button className="rom-primary" onClick={start} disabled={busy}>
            <Camera size={18} />
            {busy ? 'Starting…' : 'Start camera'}
          </Button>
        ) : (
          <Button className="rom-primary rom-primary-stop" onClick={stop}>
            <CameraOff size={18} />
            Stop
          </Button>
        )}
        <Button
          variant="ghost"
          className="rom-secondary"
          disabled={!hasData}
          onClick={() => setTracker(resetRomTracker(tracker.current))}
        >
          <RotateCcw size={16} />
          Reset range
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
            <span className="rom-gauge-label">Elbow flexion</span>
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
          <span>Extended 0°</span>
          <span>Flexed {norm.max}°</span>
        </div>

        <div className="rom-metric-row">
          <div>
            <span>Your range</span>
            <strong>{hasData ? `${romSpan.toFixed(0)}°` : '—'}</strong>
          </div>
          <div>
            <span>Lowest</span>
            <strong>{hasData ? `${tracker.min.toFixed(0)}°` : '—'}</strong>
          </div>
          <div>
            <span>Highest</span>
            <strong>{hasData ? `${tracker.max.toFixed(0)}°` : '—'}</strong>
          </div>
        </div>
      </div>

      <div className={`rom-muscles-card${activation ? ' is-active' : ''}`}>
        <div className="rom-muscles-head">
          <h3>Muscle activity</h3>
          <span>Shown in red on the 3D body</span>
        </div>

        <div className="rom-muscle-card">
          <div className="rom-muscle-meta">
            <strong>Bending</strong>
            <span>Biceps · brachialis · brachioradialis</span>
          </div>
          <div className="rom-muscle-bar">
            <i style={{width: `${flexorPct}%`}} />
          </div>
          <em>{activation ? `${flexorPct}%` : '—'}</em>
        </div>

        <div className="rom-muscle-card">
          <div className="rom-muscle-meta">
            <strong>Straightening</strong>
            <span>Triceps</span>
          </div>
          <div className="rom-muscle-bar">
            <i className="antagonist" style={{width: `${extensorPct}%`}} />
          </div>
          <em>{activation ? `${extensorPct}%` : '—'}</em>
        </div>

        {!activation && (
          <p className="rom-muscles-idle">
            Start the camera and move your arm to light up these groups.
          </p>
        )}
      </div>

      <p className="rom-disclaimer">
        <CheckCircle2 size={13} />
        Teaching demo only — not a clinical ROM or EMG measurement. Typical elbow
        flexion reference ~{norm.min}–{norm.max}°.
      </p>
    </section>
  );
}
