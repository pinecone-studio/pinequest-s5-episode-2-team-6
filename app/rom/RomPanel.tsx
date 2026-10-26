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
import {cameraError} from '../atlas-copy';
import {useLang} from '../locale';
import {
  computeJointActivation,
  idleJointActivation,
  type ActivationFrame,
  type RomPhase,
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
  JOINT_ROM,
  ROM_JOINTS,
  SHOULDER_MOTIONS,
  shoulderMotionInfo,
  type RomJoint,
  type RomMotion,
  type RomSide,
  type ShoulderMotion,
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
  const {lang, t} = useLang();
  const copy = t.romLab;
  const langRef = useRef(lang);
  langRef.current = lang;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<PoseSession | null>(null);
  const sideRef = useRef<RomSide>('right');
  const jointRef = useRef<RomJoint>('elbow');
  const shoulderMotionRef = useRef<ShoulderMotion>('auto');
  const filterRef = useRef<AngleFilter>(createAngleFilter());
  const phaseRef = useRef<RomPhase>('hold');
  const levelsRef = useRef({agonist: 0.2, antagonist: 0.2});
  const lastSeen = useRef(0);
  const lastUiPush = useRef(0);
  const lastUiKey = useRef('');

  const [joint, setJoint] = useState<RomJoint>('elbow');
  const [shoulderMotion, setShoulderMotion] = useState<ShoulderMotion>('auto');
  const [side, setSide] = useState<RomSide>('right');
  const [running, setRunning] = useState(false);
  const [previewOn, setPreviewOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<TrackStatus>('idle');
  const [tracker, setTracker] = useState<RomTracker>(() =>
    createRomTracker(JOINT_ROM.elbow.trackerSeed),
  );
  const [activation, setActivation] = useState<ActivationFrame | null>(null);

  sideRef.current = side;
  jointRef.current = joint;
  shoulderMotionRef.current = shoulderMotion;
  const info = JOINT_ROM[joint];

  const resolveMotion = (
    nextJoint: RomJoint,
    preferred: ShoulderMotion,
    fromSample?: RomMotion,
  ): RomMotion => {
    if (nextJoint !== 'shoulder') return 'flexion';
    if (preferred === 'auto') return fromSample ?? 'abduction';
    return preferred;
  };

  const pushAtlasFocus = (
    nextJoint: RomJoint,
    nextSide: RomSide,
    live?: ActivationFrame | null,
    motionHint?: RomMotion,
  ) => {
    const motion = resolveMotion(
      nextJoint,
      shoulderMotionRef.current,
      motionHint ?? live?.motion,
    );
    const frame = live ?? idleJointActivation(parts, nextJoint, nextSide, motion);
    setActivation(frame);
    onActivation(frame);
  };

  const resetTrackingState = (nextJoint: RomJoint = jointRef.current) => {
    filterRef.current = createAngleFilter();
    phaseRef.current = 'hold';
    levelsRef.current = {agonist: 0.2, antagonist: 0.2};
    lastUiPush.current = 0;
    lastUiKey.current = '';
    setTracker(createRomTracker(JOINT_ROM[nextJoint].trackerSeed));
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
      resetTrackingState();
      setActivation(null);
      onActivation(null);
      onRomFocus(false);
      return;
    }
    onRomFocus(true);
    pushAtlasFocus(joint, side);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when panel opens
  }, [open]);

  useEffect(() => {
    if (!open) return;
    resetTrackingState(joint);
    pushAtlasFocus(joint, side);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side, joint, shoulderMotion, parts, open]);

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
    resetTrackingState(jointRef.current);
    onRomFocus(true);
    pushAtlasFocus(jointRef.current, sideRef.current);
    const session = new PoseSession(
      videoRef.current,
      canvasRef.current,
      () => sideRef.current,
      () => jointRef.current,
      () => shoulderMotionRef.current,
      ({sample, timestampMs}) => {
        if (!sample || sample.joint !== jointRef.current) {
          const next = timestampMs - lastSeen.current > 1400 ? 'lost' : 'searching';
          setStatus((prev) => {
            if (prev !== next) {
              filterRef.current = createAngleFilter();
              phaseRef.current = 'hold';
              pushAtlasFocus(jointRef.current, sideRef.current);
            }
            return next;
          });
          return;
        }
        lastSeen.current = timestampMs;
        setStatus('tracking');

        const smoothed = updateAngleFilter(
          filterRef.current,
          sample.angleDeg,
          timestampMs,
        );
        filterRef.current = smoothed.filter;

        const motion = resolveMotion(
          jointRef.current,
          shoulderMotionRef.current,
          sample.motion,
        );
        const frame = computeJointActivation(
          parts,
          jointRef.current,
          sideRef.current,
          smoothed.angle,
          smoothed.velocity,
          phaseRef.current,
          levelsRef.current,
          motion,
        );
        phaseRef.current = frame.phase;
        levelsRef.current = {
          agonist: frame.agonistLevel,
          antagonist: frame.antagonistLevel,
        };

        const angleBucket = Math.round(smoothed.angle);
        const levelBucket = `${Math.round(frame.agonistLevel * 8)}_${Math.round(frame.antagonistLevel * 8)}`;
        const uiKey = `${jointRef.current}:${motion}:${frame.phase}:${angleBucket}:${levelBucket}:${sideRef.current}`;
        const due = timestampMs - lastUiPush.current >= 80;
        if (!due && uiKey === lastUiKey.current) return;
        lastUiPush.current = timestampMs;
        lastUiKey.current = uiKey;

        setTracker((t) => updateRomTracker(t, smoothed.angle));
        setActivation(frame);
        onActivation(frame);
      },
      (message) => {
        setError(cameraError(message, langRef.current));
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
        pushAtlasFocus(jointRef.current, sideRef.current);
      },
    );
    sessionRef.current = session;
    await session.start();
    if (sessionRef.current === session) {
      setRunning(true);
      setPreviewOn(true);
      setBusy(false);
      setStatus('searching');
      pushAtlasFocus(jointRef.current, sideRef.current);
    }
  };

  const stop = () => {
    sessionRef.current?.stop();
    sessionRef.current = null;
    setRunning(false);
    setPreviewOn(false);
    setBusy(false);
    setStatus('idle');
    resetTrackingState();
    pushAtlasFocus(jointRef.current, sideRef.current);
  };

  if (!open) return null;

  const activeMotion: RomMotion =
    activation?.motion ??
    resolveMotion(joint, shoulderMotion, 'abduction');
  const motionMeta =
    joint === 'shoulder'
      ? shoulderMotionInfo(activeMotion)
      : {
          risingName: 'Flexion',
          loweringName: 'Extension',
          agonistLabel: info.flexorLabel,
          antagonistLabel: info.extensorLabel,
          maxRom: info.normative.max,
          oppositeMax: 0,
          tip: 'Flex and extend the elbow in view of the camera.',
        };
  const maxRom = motionMeta.maxRom;
  const hasData = tracker.samples > 0;
  const romSpan = hasData ? tracker.max - tracker.min : 0;
  const angle = hasData ? tracker.current : 0;
  const gaugePct = Math.min(100, Math.max(0, (angle / maxRom) * 100));
  const minPct = hasData ? Math.min(100, Math.max(0, (tracker.min / maxRom) * 100)) : 0;
  const maxPct = hasData ? Math.min(100, Math.max(0, (tracker.max / maxRom) * 100)) : 0;
  const flexorPct = Math.round((activation?.agonistLevel ?? 0) * 100);
  const extensorPct = Math.round((activation?.antagonistLevel ?? 0) * 100);
  const phase = activation?.phase;
  const risingLive =
    status === 'tracking' &&
    hasData &&
    (phase === 'flexion' || angle >= FLEXION_FEEDBACK_DEG[joint]);
  const loweringLive = status === 'tracking' && phase === 'extension';

  const motionName = (name: string) => {
    const key = name.toLowerCase();
    if (key === 'flexion') return copy.flexion;
    if (key === 'extension') return copy.extension;
    if (key === 'abduction') return copy.abduction;
    if (key === 'adduction') return copy.adduction;
    return name;
  };
  const sideName = side === 'left' ? copy.left : copy.right;
  const riseName = motionName(motionMeta.risingName);
  const lowerName = motionName(motionMeta.loweringName);
  const tip = copy.tips[motionMeta.tip] ?? motionMeta.tip;
  const statusCopy: Record<TrackStatus, string> = {
    idle: copy.ready,
    starting: copy.starting,
    searching: joint === 'shoulder' ? tip : copy.showArm(sideName),
    tracking: loweringLive
      ? copy.phase(lowerName, motionMeta.antagonistLabel.split(' · ').slice(0, 2).join(' · '))
      : risingLive
        ? copy.phase(riseName, motionMeta.agonistLabel.split(' · ').slice(0, 2).join(' · '))
        : copy.tracking(joint === 'elbow' ? copy.elbow : copy.shoulder, joint === 'shoulder' ? motionName(activeMotion) : ''),
    lost: joint === 'shoulder' ? copy.lookingShoulder(sideName) : copy.lookingArm(sideName),
  };

  return (
    <section className="rom-panel glass" aria-label={copy.panel}>
      <header className="rom-header">
        <div className="rom-title-block">
          <p className="rom-kicker">{copy.kicker}</p>
          <h2 className="rom-title">{joint === 'elbow' ? copy.elbowTitle : copy.shoulderTitle}</h2>
          <p className="rom-subtitle">
            {copy.subtitle(joint, riseName, lowerName, maxRom, motionMeta.oppositeMax)}
          </p>
        </div>
        <Button
          variant="ghost"
          className="icon-button rom-close"
          onClick={() => {
            stop();
            onClose();
          }}
          aria-label={copy.close}
        >
          <X size={18} />
        </Button>
      </header>

      <div className={`rom-status rom-status-${status}`} role="status">
        <span className="rom-status-dot" />
        {statusCopy[status]}
      </div>

      <div className="rom-side-toggle" role="group" aria-label={copy.joint}>
        {ROM_JOINTS.map((id) => (
          <Button
            key={id}
            variant="ghost"
            aria-pressed={joint === id}
            className={joint === id ? 'active' : ''}
            onClick={() => setJoint(id)}
          >
            {id === 'elbow' ? copy.elbow : copy.shoulder}
          </Button>
        ))}
      </div>

      {joint === 'shoulder' && (
        <div className="rom-side-toggle" role="group" aria-label={copy.shoulderMotion}>
          {SHOULDER_MOTIONS.map((mode) => (
            <Button
              key={mode}
              variant="ghost"
              aria-pressed={shoulderMotion === mode}
              className={shoulderMotion === mode ? 'active' : ''}
              onClick={() => setShoulderMotion(mode)}
            >
              {mode === 'auto' ? copy.auto : mode === 'flexion' ? copy.flexion : copy.abduction}
            </Button>
          ))}
        </div>
      )}

      {!running && (
        <ol className="rom-steps">
          <li>
            <em>1</em>
            <span>{copy.pick(joint === 'shoulder')}</span>
          </li>
          <li>
            <em>2</em>
            <span>{copy.startStep}</span>
          </li>
          <li>
            <em>3</em>
            <span>{tip}</span>
          </li>
        </ol>
      )}

      <div className="rom-side-toggle" role="group" aria-label={copy.side}>
        <Button
          variant="ghost"
          aria-pressed={side === 'left'}
          className={side === 'left' ? 'active' : ''}
          onClick={() => setSide('left')}
        >
          {copy.left}
        </Button>
        <Button
          variant="ghost"
          aria-pressed={side === 'right'}
          className={side === 'right' ? 'active' : ''}
          onClick={() => setSide('right')}
        >
          {copy.right}
        </Button>
      </div>

      <div
        className={`rom-video-wrap${previewOn ? ' is-live' : ''}${risingLive ? ' is-flexing' : ''}`}
      >
        <video ref={videoRef} className="rom-video-src" playsInline muted autoPlay />
        <canvas ref={canvasRef} className="rom-canvas" />
        {!previewOn && (
          <div className="rom-video-placeholder">
            <div className="rom-placeholder-icon">
              <Camera size={22} />
            </div>
            <strong>{copy.preview}</strong>
            <span>
              {joint === 'shoulder' ? copy.frameShoulder(sideName) : copy.frameElbow(sideName)}
            </span>
          </div>
        )}
        {previewOn && (
          <div className="rom-live-chip">
            <span className="rom-live-pulse" />
            {copy.live}
          </div>
        )}
        {risingLive && (
          <div className="rom-flex-chip" role="status">
            <Sparkles size={13} />
            {riseName} · {angle.toFixed(0)}°
          </div>
        )}
      </div>

      <div className="rom-actions">
        {!running ? (
          <Button className="rom-primary" onClick={start} disabled={busy}>
            <Camera size={18} />
            {busy ? copy.startingBtn : copy.start}
          </Button>
        ) : (
          <Button className="rom-primary rom-primary-stop" onClick={stop}>
            <CameraOff size={18} />
            {copy.stop}
          </Button>
        )}
        <Button
          variant="ghost"
          className="rom-secondary"
          disabled={!hasData}
          onClick={() => setTracker(resetRomTracker(tracker.current))}
        >
          <RotateCcw size={16} />
          {copy.resetRange}
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
            <span className="rom-gauge-label">
              {joint === 'shoulder' ? copy.gaugeShoulder(riseName) : copy.gaugeElbow}
            </span>
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
          <span>{joint === 'shoulder' ? copy.atSide : copy.extended}</span>
          <span>
            {riseName} {maxRom}°
          </span>
        </div>

        <div className="rom-metric-row">
          <div>
            <span>{copy.yourRange}</span>
            <strong>{hasData ? `${romSpan.toFixed(0)}°` : '—'}</strong>
          </div>
          <div>
            <span>{copy.lowest}</span>
            <strong>{hasData ? `${tracker.min.toFixed(0)}°` : '—'}</strong>
          </div>
          <div>
            <span>{copy.highest}</span>
            <strong>{hasData ? `${tracker.max.toFixed(0)}°` : '—'}</strong>
          </div>
        </div>
      </div>

      <div
        className={`rom-muscles-card${activation ? ' is-active' : ''}${phase ? ` phase-${phase}` : ''}`}
      >
        <div className="rom-muscles-head">
          <h3>{copy.muscles}</h3>
          <span>
            {phase === 'flexion'
              ? copy.contracting(riseName)
              : phase === 'extension'
                ? copy.contracting(lowerName)
                : copy.swell}
          </span>
        </div>

        <div
          className={`rom-muscle-card${phase === 'flexion' ? ' is-driving' : ''}`}
        >
          <div className="rom-muscle-meta">
            <strong>
              {riseName} · 0–{maxRom}°
            </strong>
            <span>{motionMeta.agonistLabel}</span>
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
            <strong>
              {lowerName}
              {joint === 'shoulder' ? ` · 0–${motionMeta.oppositeMax}°` : ` · ${copy.toZero}`}
            </strong>
            <span>{motionMeta.antagonistLabel}</span>
          </div>
          <div className="rom-muscle-bar">
            <i className="antagonist" style={{width: `${extensorPct}%`}} />
          </div>
          <em>{activation ? `${extensorPct}%` : '—'}</em>
        </div>

        {!activation && (
          <p className="rom-muscles-idle">
            {copy.idle}
          </p>
        )}
      </div>

      <p className="rom-disclaimer">
        <CheckCircle2 size={13} />
        {copy.disclaimer}{' '}
        {copy.norm[joint]}
        {joint === 'shoulder' ? copy.latNote : ''}
      </p>
    </section>
  );
}
