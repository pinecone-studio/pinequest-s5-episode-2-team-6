import {useEffect,useMemo,useRef,useState} from 'react';
import {CheckCircle2,ChevronLeft,ChevronRight,GraduationCap,ListChecks,X,XCircle} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {findConcepts} from './ai-assistant';
import {quizFor,toursFor,TOURS,type Tour} from './learning-data';
import type {Atlas,View} from './anatomy';
import {useLang} from './locale';
import {saveQuizResult} from '../lib/quiz-store';

interface Props {
  mode: 'tour' | 'quiz' | null;
  atlas: Atlas | null;
  onClose: () => void;
  onPick: (conceptName: string) => void;
  onView: (view: View) => void;
}

export default function LearningPanel({mode, atlas, onClose, onPick, onView}: Props) {
  const {lang, t} = useLang();
  const tours = useMemo(() => toursFor(lang), [lang]);
  const quiz = useMemo(() => quizFor(lang), [lang]);
  const [tourId, setTourId] = useState(TOURS[0].id);
  const [step, setStep] = useState(0);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const tour: Tour = useMemo(() => tours.find(item => item.id === tourId) ?? tours[0], [tourId, tours]);
  const question = quiz[index];
  const saved = useRef(false);
  const finished = mode === 'quiz' && index >= quiz.length;

  // Signed-in users get one saved result per completed run; guests just see the score.
  useEffect(() => {
    if (!finished) {
      saved.current = false;
      return;
    }
    if (saved.current) return;
    saved.current = true;
    const details = Object.fromEntries(answers.map((answer, i) => [String(i), answer ?? -1]));
    void saveQuizResult(score, quiz.length, details);
  }, [finished, score, answers, quiz.length]);

  useEffect(() => {
    setStep(0);
  }, [tourId]);

  // The atlas passes fresh callbacks on every render. Reading them from refs keeps this effect to step
  // changes; with the callbacks as dependencies each pick re-rendered the atlas and picked again.
  const pick = useRef(onPick), view = useRef(onView);
  pick.current = onPick;
  view.current = onView;
  useEffect(() => {
    if (mode !== 'tour') return;
    const current = tour.steps[Math.min(step, tour.steps.length - 1)];
    if (!current || !atlas) return;
    const matches = findConcepts(atlas, current.concept, 1);
    if (matches[0]) pick.current(matches[0].name);
    if (current.view) view.current(current.view);
  }, [mode, tour, step, atlas]);

  if (!mode) return null;

  if (mode === 'quiz') {
    const correct = score;
    return (
      <section className="learning-panel glass" aria-label={t.learn.quizPanel}>
        <header className="learning-head">
          <div>
            <p className="learning-kicker">
              <ListChecks size={12} /> {t.learn.practice}
            </p>
            <h2 className="learning-title">{t.learn.quizTitle}</h2>
          </div>
          <Button variant="ghost" className="icon-button" onClick={onClose} aria-label={t.learn.closeQuiz}>
            <X size={18} />
          </Button>
        </header>

        {finished ? (
          <div className="quiz-result">
            <strong>
              {correct} / {quiz.length}
            </strong>
            <p>
              {correct === quiz.length
                ? t.learn.perfect
                : correct >= quiz.length / 2
                  ? t.learn.half
                  : t.learn.low}
            </p>
            <div className="learning-actions">
              <Button
                variant="ghost"
                className="learning-primary"
                onClick={() => {
                  setIndex(0);
                  setAnswers([]);
                  setPicked(null);
                  setScore(0);
                }}
              >
                {t.learn.restart}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="quiz-meta">
              <span>{t.learn.question(index + 1, quiz.length)}</span>
              <span>{t.learn.correct(correct)}</span>
            </div>
            <p className="quiz-prompt">{question.prompt}</p>
            <div className="quiz-options">
              {question.options.map((option, optionIndex) => {
                const answered = picked !== null;
                const isCorrect = optionIndex === question.answer;
                const isPicked = optionIndex === picked;
                const state = !answered ? '' : isCorrect ? 'is-correct' : isPicked ? 'is-wrong' : '';
                return (
                  <Button key={option} variant="ghost" className={`quiz-option ${state}`} disabled={answered} onClick={() => {
                    setPicked(optionIndex);
                    setAnswers(current => [...current, optionIndex]);
                    if (optionIndex === question.answer) setScore(current => current + 1);
                    if (atlas) {
                      const matches = findConcepts(atlas, question.concept, 1);
                      if (matches[0]) onPick(matches[0].name);
                    }
                  }}>
                    <span>{option}</span>
                    {answered && isCorrect && <CheckCircle2 size={16} />}
                    {answered && isPicked && !isCorrect && <XCircle size={16} />}
                  </Button>
                );
              })}
            </div>
            {picked !== null && (
              <div className="quiz-feedback">
                <p>{question.explain}</p>
                <div className="learning-actions">
                  <Button variant="ghost" className="learning-primary" onClick={() => {
                    setPicked(null);
                    setIndex(current => current + 1);
                  }}>
                    {index + 1 >= quiz.length ? t.learn.seeResult : t.learn.next}
                    <ChevronRight size={15} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
        <p className="learning-note">
          {t.learn.answered(answers.length)}
        </p>
      </section>
    );
  }

  const current = tour.steps[Math.min(step, tour.steps.length - 1)];
  return (
    <section className="learning-panel glass" aria-label={t.learn.tourPanel}>
      <header className="learning-head">
        <div>
          <p className="learning-kicker">
            <GraduationCap size={12} /> {t.learn.mode}
          </p>
          <h2 className="learning-title">{t.learn.tours}</h2>
        </div>
        <Button variant="ghost" className="icon-button" onClick={onClose} aria-label={t.learn.closeTours}>
          <X size={18} />
        </Button>
      </header>

      <div className="tour-picker" role="tablist" aria-label={t.learn.toursLabel}>
        {tours.map(item => (
          <Button
            key={item.id}
            variant="ghost"
            role="tab"
            aria-selected={item.id === tourId}
            className={`tour-chip ${item.id === tourId ? 'active' : ''}`}
            onClick={() => setTourId(item.id)}
          >
            {item.title}
          </Button>
        ))}
      </div>

      <p className="tour-summary">{tour.summary}</p>
      <div className="tour-step">
        <span className="tour-counter">
          {t.learn.step(step + 1, tour.steps.length)}
        </span>
        <h3>{current.title}</h3>
        {current.latin && <p className="structure-latin" lang="la">{current.latin}</p>}
        <p>{current.text}</p>
        <Button variant="ghost" className="tour-show" onClick={() => onPick(current.concept)}>
          {t.learn.show}
        </Button>
      </div>

      <div className="learning-actions">
        <Button variant="ghost" className="learning-secondary" disabled={step === 0} onClick={() => setStep(value => Math.max(0, value - 1))}>
          <ChevronLeft size={15} /> {t.learn.back}
        </Button>
        <Button
          variant="ghost"
          className="learning-primary"
          disabled={step >= tour.steps.length - 1}
          onClick={() => setStep(value => Math.min(tour.steps.length - 1, value + 1))}
        >
          {t.learn.nextStep} <ChevronRight size={15} />
        </Button>
      </div>
    </section>
  );
}
