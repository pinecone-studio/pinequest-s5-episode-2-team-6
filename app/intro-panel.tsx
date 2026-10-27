import {useEffect} from 'react';
import {ChevronLeft,ChevronRight,Compass,GraduationCap,Hand,MousePointerClick,Search,Sparkles,X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useLang} from './locale';

// First visit walkthrough: four short steps (turn, tap, search, ask), then an offer to start a guided tour.
// It sits in the tour panel's slot so the hand-off to the tour happens in place. Closing it is remembered
// on this device; the footer's "How to use" button brings it back.
const KEY = 'anatomn-intro-seen';
export const INTRO_STEPS = 4;
const ICONS = [Hand, MousePointerClick, Search, Sparkles];

export function introSeen() {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    // Storage can be blocked; the introduction then shows once per visit.
    return false;
  }
}

export function markIntroSeen() {
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    /* It shows again on the next visit. */
  }
}

interface Props {
  // 0 to INTRO_STEPS - 1 are the steps; INTRO_STEPS is the guided tour offer.
  step: number;
  // Another panel holds the same spot on a phone, so the introduction waits until it closes.
  tucked: boolean;
  onStep: (step: number) => void;
  onClose: () => void;
  onTour: () => void;
}

export default function IntroPanel({step, tucked, onStep, onClose, onTour}: Props) {
  const {t} = useLang();
  const ready = step >= INTRO_STEPS;
  const current = t.intro.steps[Math.min(step, INTRO_STEPS - 1)];
  const Icon = ready ? GraduationCap : ICONS[step];
  const close = () => {
    markIntroSeen();
    onClose();
  };

  useEffect(() => {
    if (tucked) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, [tucked, onClose]);

  return (
    <>
      {/* The first two steps are about the body itself, so a marker sits on the figure. */}
      {step < 2 && (
        <div className={`intro-spot ${step === 0 ? 'is-drag' : 'is-tap'} ${tucked ? 'is-tucked' : ''}`} aria-hidden>
          <Icon size={24} />
        </div>
      )}
      <section className={`learning-panel intro-panel glass ${tucked ? 'is-tucked' : ''}`} aria-label={t.intro.panel}>
        <header className="learning-head">
          <div>
            <p className="learning-kicker">
              <Compass size={12} /> {t.intro.kicker}
            </p>
            <h2 className="learning-title">{t.intro.welcome}</h2>
          </div>
          <Button variant="ghost" className="icon-button" onClick={close} aria-label={t.intro.close}>
            <X size={18} />
          </Button>
        </header>

        <div className="tour-step" aria-live="polite">
          <div className="intro-progress">
            <span className="tour-counter">{ready ? t.intro.readyKicker : t.learn.step(step + 1, INTRO_STEPS)}</span>
            <span className="intro-dots" aria-hidden>
              {Array.from({length: INTRO_STEPS}, (_, i) => <i key={i} className={i <= step ? 'on' : ''} />)}
            </span>
          </div>
          <h3 className="intro-step-title">
            <Icon size={17} /> {ready ? t.intro.readyTitle : current.title}
          </h3>
          <p>{ready ? t.intro.readyText : current.text}</p>
        </div>

        <div className="learning-actions">
          {ready ? (
            <>
              <Button variant="ghost" className="learning-secondary" onClick={close}>
                {t.intro.explore}
              </Button>
              <Button
                variant="ghost"
                className="learning-primary"
                onClick={() => {
                  markIntroSeen();
                  onTour();
                }}
              >
                <GraduationCap size={15} /> {t.intro.tour}
              </Button>
            </>
          ) : (
            <>
              {step === 0 ? (
                <Button variant="ghost" className="learning-secondary" onClick={close}>
                  {t.intro.skip}
                </Button>
              ) : (
                <Button variant="ghost" className="learning-secondary" onClick={() => onStep(step - 1)}>
                  <ChevronLeft size={15} /> {t.learn.back}
                </Button>
              )}
              <Button variant="ghost" className="learning-primary" onClick={() => onStep(step + 1)}>
                {t.learn.nextStep} <ChevronRight size={15} />
              </Button>
            </>
          )}
        </div>
      </section>
    </>
  );
}
