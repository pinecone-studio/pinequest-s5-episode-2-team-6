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
import {
  computeElbowActivation,
  idleElbowActivation,
  type ActivationFrame,
  type ElbowPhase,
} from './activation';
import {
  FLEXION_FEEDBACK_DEG,
  createAngleFilter,
  createRomTracker,
  resetRomTracker,
  updateAngleFilter,
  updateRomTracker,
  type AngleFilter,
  type RomTracker,
} from './joints';
import {
  ELBOW_EXTENSOR_LABEL,
  ELBOW_FLEXOR_LABEL,
  NORMATIVE_ROM,
  type RomSide,
} from './muscle-map';
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
  const filterRef = useRef<AngleFilter>(createAngleFilter());
  const phaseRef = useRef<ElbowPhase>('hold');
  const levelsRef = useRef({agonist: 0.2, antagonist: 0.2});
  const lastSeen = useRef(0);
  const lastUiPush = useRef(0);
  const lastUiKey = useRef('');

  const [side, setSide] = useState<RomSide>('right');
  const [running, setRunning] = useState(false);
  const [previewOn, setPreviewOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<TrackStatus>('idle');
  const [tracker, setTracker] = useState<RomTracker>(() => createRomTracker(90));
  const [activation, setActivation] = useState<ActivationFrame | null>(null);

  sideRef.current = side;

  const pushAtlasFocus = (nextSide: RomSide, live?: ActivationFrame | null) => {
    const frame = live ?? idleElbowActivation(parts, nextSide);
    setActivation(frame);
    onActivation(frame);
  };

  useEffect(() => {
    if (!open) {
      sessionRef.current?.stop();
      sessionRef.current = null;
      setRunning(false);
      setPreviewOn(false);
      setBusy(false);
      setStatus('idle');
      setError('');
      filterRef.current = createAngleFilter();
      phaseRef.current = 'hold';
      levelsRef.current = {agonist: 0.2, antagonist: 0.2};
      lastUiPush.current = 0;
      lastUiKey.current = '';
      setActivation(null);
      onActivation(null);
      onRomFocus(false);
      return;
    }
    // Opening the lab frames the elbow on the atlas immediately.
    onRomFocus(true);
    pushAtlasFocus(side);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when panel opens
  }, [open]);

  useEffect(() => {
    if (!open) return;
    pushAtlasFocus(side);
    // Side change while lab is open — re-frame the chosen arm on the atlas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side, parts, open]);

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
    filterRef.current = createAngleFilter();
    phaseRef.current = 'hold';
    levelsRef.current = {agonist: 0.2, antagonist: 0.2};
    lastUiPush.current = 0;
    lastUiKey.current = '';
    onRomFocus(true);
    pushAtlasFocus(sideRef.current);
    const session = new PoseSession(
      videoRef.current,
      canvasRef.current,
      () => sideRef.current,
      ({elbow, timestampMs}) => {
        if (!elbow) {
          const next = timestampMs - lastSeen.current > 1400 ? 'lost' : 'searching';
          setStatus((prev) => {
            if (prev !== next) {
              filterRef.current = createAngleFilter();
              phaseRef.current = 'hold';
              pushAtlasFocus(sideRef.current);
            }
            return next;
          });
          return;
        }
        lastSeen.current = timestampMs;
        setStatus('tracking');

        const smoothed = updateAngleFilter(
          filterRef.current,
          elbow.angleDeg,
          timestampMs,
        );
        filterRef.current = smoothed.filter;

        const frame = computeElbowActivation(
          parts,
          sideRef.current,
          smoothed.angle,
          smoothed.velocity,
          phaseRef.current,
          levelsRef.current,
        );
        phaseRef.current = frame.phase;
        levelsRef.current = {
          agonist: frame.agonistLevel,
          antagonist: frame.antagonistLevel,
        };

        // Throttle UI/atlas pushes so landmark noise does not thrash React/Three.
        const angleBucket = Math.round(smoothed.angle);
        const levelBucket = `${Math.round(frame.agonistLevel * 8)}_${Math.round(frame.antagonistLevel * 8)}`;
        const uiKey = `${frame.phase}:${angleBucket}:${levelBucket}:${sideRef.current}`;
        const due = timestampMs - lastUiPush.current >= 80;
        if (!due && uiKey === lastUiKey.current) return;
        lastUiPush.current = timestampMs;
        lastUiKey.current = uiKey;

        setTracker((t) => updateRomTracker(t, smoothed.angle));
        setActivation(frame);
        onActivation(frame);
      },
      (message) => {
        setError(message);
        setRunning(false);
        setPreviewOn(false);
        setBusy(false);
        setStatus('idle');
        onRomFocus(false);
        onActivation(null);
      },
      () => {
        setPreviewOn(true);
        setRunning(true);
        setBusy(false);
        setStatus('starting');
        pushAtlasFocus(sideRef.current);
      },
    );
    sessionRef.current = session;
    await session.start();
    if (sessionRef.current === session) {
      setRunning(true);
      setPreviewOn(true);
      setBusy(false);
      setStatus('searching');
      pushAtlasFocus(sideRef.current);
    }
  };

  const stop = () => {
    sessionRef.current?.stop();
    sessionRef.current = null;
    setRunning(false);
    setPreviewOn(false);
    setBusy(false);
    setStatus('idle');
    filterRef.current = createAngleFilter();
    phaseRef.current = 'hold';
    levelsRef.current = {agonist: 0.2, antagonist: 0.2};
    lastUiPush.current = 0;
    lastUiKey.current = '';
    // Keep atlas framed on the elbow while the lab stays open.
    pushAtlasFocus(sideRef.current);
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
  const phase = activation?.phase;
  const flexionLive =
    status === 'tracking' &&
    hasData &&
    (phase === 'flexion' || angle >= FLEXION_FEEDBACK_DEG);
  const extensionLive = status === 'tracking' && phase === 'extension';

  const statusCopy: Record<TrackStatus, string> = {
    idle: 'Ready when you are',
    starting: 'Starting camera…',
    searching: `Show your ${side} arm`,
    tracking: extensionLive
      ? 'Extension — triceps · anconeus'
      : flexionLive
        ? 'Flexion — biceps · brachialis · brachioradialis'
        : 'Tracking elbow',
    lost: `Looking for your ${side} arm…`,
  };

  return (
    <section className="rom-panel glass" aria-label="Range of motion lab">
      <header className="rom-header">
        <div className="rom-title-block">
          <p className="rom-kicker">Live movement</p>
          <h2 className="rom-title">Elbow ROM lab</h2>
          <p className="rom-subtitle">
            Elbow (humeroulnar / humeroradial): flex 0–145° and extend back — muscles
            in use light up on the atlas.
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

      <div
        className={`rom-video-wrap${previewOn ? ' is-live' : ''}${flexionLive ? ' is-flexing' : ''}`}
      >
        <video ref={videoRef} className="rom-video-src" playsInline muted autoPlay />
        <canvas ref={canvasRef} className="rom-canvas" />
        {!previewOn && (
          <div className="rom-video-placeholder">
            <div className="rom-placeholder-icon">
              <Camera size={22} />
            </div>
            <strong>Camera preview</strong>
            <span>Stand so your {side} elbow and wrist are visible</span>
          </div>
        )}
        {previewOn && (
          <div className="rom-live-chip">
            <span className="rom-live-pulse" />
            Live
          </div>
        )}
        {flexionLive && (
          <div className="rom-flex-chip" role="status">
            <Sparkles size={13} />
            Flexion · {angle.toFixed(0)}°
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

      <div
        className={`rom-muscles-card${activation ? ' is-active' : ''}${phase ? ` phase-${phase}` : ''}`}
      >
        <div className="rom-muscles-head">
          <h3>Muscles in use</h3>
          <span>
            {phase === 'flexion'
              ? 'Flexion highlighted'
              : phase === 'extension'
                ? 'Extension highlighted'
                : 'Shown in red on the 3D body'}
          </span>
        </div>

        <div
          className={`rom-muscle-card${phase === 'flexion' ? ' is-driving' : ''}`}
        >
          <div className="rom-muscle-meta">
            <strong>Flexion · 0–145°</strong>
            <span>{ELBOW_FLEXOR_LABEL}</span>
          </div>
          <div className="rom-muscle-bar">
            <i style={{width: `${flexorPct}%`}} />
          </div>
          <em>{activation ? `${flexorPct}%` : '—'}</em>
        </div>

        <div
          className={`rom-muscle-card${phase === 'extension' ? ' is-driving' : ''}`}
        >
          <div className="rom-muscle-meta">
            <strong>Extension · 145–0°</strong>
            <span>{ELBOW_EXTENSOR_LABEL}</span>
          </div>
          <div className="rom-muscle-bar">
            <i className="antagonist" style={{width: `${extensorPct}%`}} />
          </div>
          <em>{activation ? `${extensorPct}%` : '—'}</em>
        </div>

        {!activation && (
          <p className="rom-muscles-idle">
            Start the camera and flex / extend — active muscles light up on the body.
          </p>
        )}
      </div>

      <p className="rom-disclaimer">
        <CheckCircle2 size={13} />
        Teaching demo only — not a clinical ROM or EMG measurement. Normative elbow
        flexion ~{norm.min}–{norm.max}°; hyperextension often ~5–10°.
      </p>
    </section>
  );
}
