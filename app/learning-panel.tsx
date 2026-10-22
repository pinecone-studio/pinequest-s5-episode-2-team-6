import {useEffect,useMemo,useState} from 'react';
import {CheckCircle2,ChevronLeft,ChevronRight,GraduationCap,ListChecks,X,XCircle} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {findConcepts} from './ai-assistant';
import {QUIZ,TOURS,type Tour} from './learning-data';
import type {Atlas,View} from './anatomy';

interface Props {
  mode: 'tour' | 'quiz' | null;
  atlas: Atlas | null;
  onClose: () => void;
  onPick: (conceptName: string) => void;
  onView: (view: View) => void;
}

export default function LearningPanel({mode, atlas, onClose, onPick, onView}: Props) {
  const [tourId, setTourId] = useState(TOURS[0].id);
  const [step, setStep] = useState(0);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const tour: Tour = useMemo(() => TOURS.find(item => item.id === tourId) ?? TOURS[0], [tourId]);
  const question = QUIZ[index];

  useEffect(() => {
    setStep(0);
  }, [tourId]);

  useEffect(() => {
    if (mode !== 'tour') return;
    const current = tour.steps[Math.min(step, tour.steps.length - 1)];
    if (!current || !atlas) return;
    const matches = findConcepts(atlas, current.concept, 1);
    if (matches[0]) onPick(matches[0].name);
    if (current.view) onView(current.view);
  }, [mode, tour, step, atlas, onPick, onView]);

  if (!mode) return null;

  if (mode === 'quiz') {
    const finished = index >= QUIZ.length;
    const correct = score;
    return (
      <section className="learning-panel glass" aria-label="Quiz">
        <header className="learning-head">
          <div>
            <p className="learning-kicker">
              <ListChecks size={12} /> Practice
            </p>
            <h2 className="learning-title">Quiz me</h2>
          </div>
          <Button variant="ghost" className="icon-button" onClick={onClose} aria-label="Close quiz">
            <X size={18} />
          </Button>
        </header>

        {finished ? (
          <div className="quiz-result">
            <strong>
              {correct} / {QUIZ.length}
            </strong>
            <p>
              {correct === QUIZ.length
                ? 'A clean sweep. You know this atlas well.'
                : correct >= QUIZ.length / 2
                  ? 'Solid work. Review the structures you missed and go again.'
                  : 'Keep exploring the model, then try the tour to lock it in.'}
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
                Restart quiz
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="quiz-meta">
              <span>Question {index + 1} of {QUIZ.length}</span>
              <span>{correct} correct</span>
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
                    {index + 1 >= QUIZ.length ? 'See result' : 'Next question'}
                    <ChevronRight size={15} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
        <p className="learning-note">
          {answers.length} answered so far. The atlas highlights the structure each answer points to.
        </p>
      </section>
    );
  }

  const current = tour.steps[Math.min(step, tour.steps.length - 1)];
  return (
    <section className="learning-panel glass" aria-label="Guided tour">
      <header className="learning-head">
        <div>
          <p className="learning-kicker">
            <GraduationCap size={12} /> Learning mode
          </p>
          <h2 className="learning-title">Guided tours</h2>
        </div>
        <Button variant="ghost" className="icon-button" onClick={onClose} aria-label="Close tours">
          <X size={18} />
        </Button>
      </header>

      <div className="tour-picker" role="tablist" aria-label="Tours">
        {TOURS.map(item => (
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
          Step {step + 1} of {tour.steps.length}
        </span>
        <h3>{current.title}</h3>
        <p>{current.text}</p>
        <Button variant="ghost" className="tour-show" onClick={() => onPick(current.concept)}>
          Show it in the model
        </Button>
      </div>

      <div className="learning-actions">
        <Button variant="ghost" className="learning-secondary" disabled={step === 0} onClick={() => setStep(value => Math.max(0, value - 1))}>
          <ChevronLeft size={15} /> Back
        </Button>
        <Button
          variant="ghost"
          className="learning-primary"
          disabled={step >= tour.steps.length - 1}
          onClick={() => setStep(value => Math.min(tour.steps.length - 1, value + 1))}
        >
          Next <ChevronRight size={15} />
        </Button>
      </div>
    </section>
  );
}
