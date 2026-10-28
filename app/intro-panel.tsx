import {useEffect,useState,type ComponentType} from 'react';
import {Activity,Box,Check,ChevronLeft,ChevronRight,Compass,Hand,House,Info,ListChecks,Menu,MousePointerClick,PersonStanding,Pointer,Search,SlidersHorizontal,Smartphone,Sparkles,X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useLang} from './locale';

// First visit walkthrough. A desktop gets four short steps (turn, tap, search, ask); a phone gets its own
// guide, because there the controls are icons without labels: gestures, the bottom tools, what each icon at
// the top opens, the menu, and adding the site to the home screen. Closing it is remembered on this device;
// the footer's "How to use" button brings it back.
const KEY = 'anatomn-intro-seen';

// The control a step is about; the atlas rings it while the step is shown.
export type IntroTarget = 'search' | 'ask' | 'dock' | 'top' | 'nav';
type Icon = ComponentType<{size?: number}>;
interface StepShape {
  icon: Icon;
  // The first steps are about the body itself, so a marker sits on the figure.
  spot?: 'drag' | 'tap';
  target?: IntroTarget;
  // Icons shown beside the step's legend labels, in the same order as the copy.
  legend?: Icon[];
}
const DESKTOP: StepShape[] = [
  {icon: Hand, spot: 'drag'},
  {icon: MousePointerClick, spot: 'tap'},
  {icon: Search, target: 'search'},
  {icon: Sparkles, target: 'ask'},
];
const PHONE: StepShape[] = [
  {icon: Hand, spot: 'drag'},
  {icon: Pointer, spot: 'tap'},
  {icon: SlidersHorizontal, target: 'dock'},
  {icon: Sparkles, target: 'top', legend: [Sparkles, PersonStanding, Search, Info]},
  {icon: Menu, target: 'nav', legend: [House, Box, Activity, ListChecks]},
  {icon: Smartphone},
];
export const introSteps = (phone: boolean) => (phone ? PHONE : DESKTOP);

// The atlas switches to its phone layout (icon-only buttons, the bottom sheet) at these sizes.
const PHONE_LAYOUT = '(max-width:767px),(max-height:600px) and (orientation:landscape)';
export function usePhoneLayout() {
  const [phone, setPhone] = useState(() => matchMedia(PHONE_LAYOUT).matches);
  useEffect(() => {
    const query = matchMedia(PHONE_LAYOUT);
    const change = () => setPhone(query.matches);
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);
  return phone;
}

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
  // Index into the steps for this layout.
  step: number;
  phone: boolean;
  // Another panel holds the same spot on a phone, so the introduction waits until it closes.
  tucked: boolean;
  onStep: (step: number) => void;
  onClose: () => void;
}

export default function IntroPanel({step, phone, tucked, onStep, onClose}: Props) {
  const {t} = useLang();
  const steps = introSteps(phone);
  const copy = phone ? t.intro.phoneSteps : t.intro.steps;
  // Turning a phone can switch layouts mid-walkthrough; the shorter list then holds the last step.
  const index = Math.min(step, steps.length - 1);
  const last = index === steps.length - 1;
  const shape = steps[index];
  const current: {title: string; text: string; legend?: string[]} = copy[index];
  const Icon = shape.icon;
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
      {shape.spot && (
        <div className={`intro-spot is-${shape.spot} ${tucked ? 'is-tucked' : ''}`} aria-hidden>
          <Icon size={24} />
        </div>
      )}
      <section className={`learning-panel intro-panel glass ${tucked ? 'is-tucked' : ''}`} data-target={shape.target} aria-label={t.intro.panel}>
        <header className="learning-head">
          <div>
            <p className="learning-kicker">
              <Compass size={12} /> {phone ? t.intro.phoneKicker : t.intro.kicker}
            </p>
            <h2 className="learning-title">{t.intro.welcome}</h2>
          </div>
          <Button variant="ghost" className="icon-button" onClick={close} aria-label={t.intro.close}>
            <X size={18} />
          </Button>
        </header>

        <div className="tour-step" aria-live="polite">
          <div className="intro-progress">
            <span className="tour-counter">{t.intro.step(index + 1, steps.length)}</span>
            <span className="intro-dots" aria-hidden>
              {steps.map((_, i) => <i key={i} className={i <= index ? 'on' : ''} />)}
            </span>
          </div>
          <h3 className="intro-step-title">
            <Icon size={17} /> {current.title}
          </h3>
          <p>{current.text}</p>
          {shape.legend && current.legend && (
            <ul className="intro-legend">
              {shape.legend.map((LegendIcon, i) => (
                <li key={i}>
                  <span aria-hidden>
                    <LegendIcon size={15} />
                  </span>
                  {current.legend?.[i]}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="learning-actions">
          {index === 0 ? (
            <Button variant="ghost" className="learning-secondary" onClick={close}>
              {t.intro.skip}
            </Button>
          ) : (
            <Button variant="ghost" className="learning-secondary" onClick={() => onStep(index - 1)}>
              <ChevronLeft size={15} /> {t.intro.back}
            </Button>
          )}
          {last ? (
            <Button variant="ghost" className="learning-primary" onClick={close}>
              <Check size={15} /> {t.intro.done}
            </Button>
          ) : (
            <Button variant="ghost" className="learning-primary" onClick={() => onStep(index + 1)}>
              {t.intro.next} <ChevronRight size={15} />
            </Button>
          )}
        </div>
      </section>
    </>
  );
}
