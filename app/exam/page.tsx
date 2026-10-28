// The exam screen: a published paper, a countdown, then a scored review.
//
// It is the graded counterpart of /quiz. The quiz is open practice and keeps
// no record of what you got wrong; an exam hands in one attempt, the database
// trigger scores the multiple-choice part, the model grades the case answers
// against the stored rubric, and passing pays out XP once per paper.
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {Award,Check,CircleCheck,Clock,ListChecks,RotateCcw,Trophy} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card,CardContent,CardHeader,CardTitle} from '@/components/ui/card';
import {Textarea} from '@/components/ui/textarea';
import {useAuth} from '../../hooks/use-auth';
import {useSubscription} from '../../hooks/use-subscription';
import {fetchExam,fetchExams,fetchMyAttempts,submitAttempt,claimCheckin,fetchXp,type Exam,type ExamQuestion,type DbState} from '../../lib/exam-store';
import {useLang} from '../locale';
import SiteNav from '../site-nav';
import './exam.css';

const copy = {
  en: {
    title: 'Exams',
    lead: 'A timed paper with real exam questions. Your score is calculated on the server, and passing earns XP.',
    back: 'Back to the atlas',
    loading: 'Loading…',
    empty: 'No published exam yet.',
    start: 'Start exam',
    resume: 'Continue',
    questions: 'questions',
    minutes: 'min',
    points: 'points',
    best: 'Best',
    attempts: 'Attempts',
    notPassed: 'Not passed yet',
    passMark: 'Pass mark',
    timeLeft: 'Time left',
    question: 'Question',
    of: 'of',
    answerText: 'Write your answer',
    answerPlaceholder: 'Explain in a few sentences. The answer is graded against the marking notes.',
    submit: 'Hand in',
    submitting: 'Grading…',
    grading: 'The assistant is reading your case answers.',
    skippedCase: 'Case answers were not graded: the assistant is unavailable. Multiple-choice points still count.',
    resultTitle: 'Result',
    score: 'Score',
    passed: 'Passed',
    failed: 'Not passed',
    mcq: 'Multiple choice',
    case: 'Case',
    xpEarned: 'XP earned',
    alreadyAwarded: 'XP was already awarded for this paper.',
    review: 'Review',
    yourAnswer: 'Your answer',
    correctAnswer: 'Correct answer',
    markingNotes: 'Marking notes',
    openInAtlas: 'Open in the 3D atlas',
    again: 'Try another paper',
    closed: 'This paper is not available.',
    missingSchema: 'The exam tables are not in this database yet. Run supabase/schema.sql in the Supabase SQL editor to create them.',
    signIn: 'Sign in to take an exam.',
    goSignIn: 'Sign in',
    checkin: 'Daily attendance',
    checkinDone: 'Attendance already claimed today.',
    checkinClaimed: 'Attendance claimed.',
    timeUp: 'Time is up. Your answers were handed in.',
    emptyAnswer: 'Case answers left empty are scored 0.',
    confirmSubmit: 'Hand in',
    cancel: 'Keep working',
    confirmLead: 'You cannot change the answers after handing in.',
  },
  mn: {
    title: 'Шалгалт',
    lead: 'Хугацаатай жинхэнэ шалгалт. Оноог сервер тооцож, тэнцсэн бол XP олгоно.',
    back: 'Атлас руу буцах',
    loading: 'Ачаалж байна…',
    empty: 'Одоогоор нээлттэй шалгалт байхгүй.',
    start: 'Шалгалт өгөх',
    resume: 'Үргэлжлүүлэх',
    questions: 'асуулт',
    minutes: 'мин',
    points: 'оног',
    best: 'Шилдэг',
    attempts: 'Оролдлого',
    notPassed: 'Амжаагүй байна',
    passMark: 'Тэнцэх хувь',
    timeLeft: 'Үлдсэн хугацаа',
    question: 'Асуулт',
    of: '-ээс',
    answerText: 'Харилтаа бичнэ үү',
    answerPlaceholder: 'Хэдэн өгүүлбэрээр тайлбарла. Хариуг асуултын шалгуураар үнэлнэ.',
    submit: 'Гардуулах',
    submitting: 'Үнэлж байна…',
    grading: 'Туслах чиний case хариуг уншиж байна.',
    skippedCase: 'Case хариуг үнэлж чадсангүй: туслах ажиллахгүй байна. Олон сонголттой асуултын оноо тооцогдоно.',
    resultTitle: 'Үр дүн',
    score: 'Оноо',
    passed: 'Тэнцсэн',
    failed: 'Тэнцээгүй',
    mcq: 'Олон сонголттой',
    case: 'Кейс',
    xpEarned: 'Авсан XP',
    alreadyAwarded: 'Энэ шалгалтын XP-ийг өмнө авсан байна.',
    review: 'Шалгалтын дүн',
    yourAnswer: 'Чиний хариулт',
    correctAnswer: 'Зөв хариулт',
    markingNotes: 'Шалгуур',
    openInAtlas: '3D атлас дээр харах',
    again: 'Өөр шалгалт сонгох',
    closed: 'Энэ шалгалт нээлттэй биш.',
    missingSchema: 'Шалгалтын хүснэгтүүд энэ өгөгдлийн санд хийгдээгүй байна. Supabase-ын SQL editor дээр supabase/schema.sql-г ажиллуулна уу.',
    signIn: 'Шалгалт өгөхийн тулд нэвтрээрэй.',
    goSignIn: 'Нэвтрэх',
    checkin: 'Өдрийн ирц',
    checkinDone: 'Өнөөдрийн ирц баталгаажсан байна.',
    checkinClaimed: 'Ирц баталгаажлаа.',
    timeUp: 'Хугацаа дууслаа. Хариуг гардууллаа.',
    emptyAnswer: 'Хоосон case хариу 0 оноо авна.',
    confirmSubmit: 'Гардуулах',
    cancel: 'Үргэлжлүүлэх',
    confirmLead: 'Гардуулсны дараа хариугаа өөрчлөх боломжгүй.',
  },
} as const;

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
type Choice = {choice?: number; text?: string};

export default function ExamPage() {
  const {lang} = useLang();
  const t = copy[lang];
  const {ready: authReady, user} = useAuth();
  const {ready: subReady} = useSubscription();
  const ready = authReady && subReady;
  const [params, setParams] = useSearchParams();
  const examParam = params.get('exam');
  const [exams, setExams] = useState<Exam[]>([]);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [exam, setExam] = useState<Exam | null>(null);
  const [best, setBest] = useState<Map<number, number>>(new Map());
  const [state, setState] = useState<DbState>('ok');
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, Choice>>({});
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [handing, setHanding] = useState(false);
  const [notice, setNotice] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<{scorePct: number; passed: boolean; mcq: number; caseScore: number; caseMax: number; xp: number; feedback: string} | null>(null);
  const [checkinNote, setCheckinNote] = useState('');
  const startedAt = useRef<number>(0);
  const submitted = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [examList, attempts] = await Promise.all([fetchExams(), fetchMyAttempts()]);
    setState(examList.state === 'missing' || attempts.state === 'missing' ? 'missing' : 'ok');
    setExams(examList.data);
    const map = new Map<number, number>();
    for (const attempt of attempts.data) map.set(attempt.exam_id, Math.max(map.get(attempt.exam_id) ?? 0, attempt.score_pct));
    setBest(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (ready && user) void load();
    else setLoading(false);
  }, [ready, user, load]);

  // Open a paper from the list; the id lives in the URL so a refresh keeps it.
  useEffect(() => {
    if (!examParam) {
      setExam(null);
      setQuestions([]);
      return;
    }
    let alive = true;
    void (async () => {
      const {data, state: openState} = await fetchExam(Number(examParam));
      if (!alive) return;
      setState(openState);
      setExam(data.exam);
      setQuestions(data.questions);
      setAnswers({});
      setIndex(0);
      setResult(null);
      setNotice('');
      submitted.current = false;
      const limit = (data.exam?.time_limit_min ?? 15) * 60;
      setSecondsLeft(limit);
      startedAt.current = Date.now();
    })();
    return () => {
      alive = false;
    };
  }, [examParam]);

  const running = Boolean(exam) && !result;
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [running]);

  const caseQuestions = useMemo(() => questions.filter(q => q.kind === 'case'), [questions]);
  const totalPoints = useMemo(() => questions.reduce((sum, q) => sum + q.points, 0), [questions]);

  async function handIn() {
    if (!user || !exam || submitted.current) return;
    submitted.current = true;
    setConfirming(false);
    setHanding(true);
    setNotice('');
    let caseScore = 0;
    let feedback = '';
    if (caseQuestions.length) {
      const textAnswers: Record<string, string> = {};
      for (const question of caseQuestions) textAnswers[String(question.id)] = answers[String(question.id)]?.text ?? '';
      try {
        const response = await fetch('/api/exam', {
          method: 'POST',
          headers: {'content-type': 'application/json'},
          body: JSON.stringify({mode: 'grade', lang, questions: caseQuestions.map(q => ({id: q.id, prompt: lang === 'mn' ? q.prompt : q.prompt_en || q.prompt, rubric: q.rubric, points: q.points})), answers: textAnswers}),
        });
        const payload = (await response.json()) as {ok?: boolean; scores?: {id: number; points: number; comment: string}[]; caseScore?: number; summary?: string};
        if (response.ok && payload.ok) {
          caseScore = Number(payload.caseScore) || 0;
          feedback = (payload.scores ?? []).map(score => `${t.case} #${score.id}: ${score.points} / ${caseQuestions.find(q => q.id === score.id)?.points ?? 0} — ${score.comment}`).join('\n');
          if (payload.summary) feedback = `${payload.summary}\n\n${feedback}`;
        } else {
          setNotice(t.skippedCase);
        }
      } catch {
        setNotice(t.skippedCase);
      }
    }
    const durationSec = Math.round((Date.now() - startedAt.current) / 1000);
    const attempt = await submitAttempt({examId: exam.id, userId: user.id, answers, caseScore, aiFeedback: feedback, durationSec});
    setHanding(false);
    if (!attempt.data) {
      submitted.current = false;
      setState(attempt.state);
      setNotice(attempt.state === 'missing' ? t.missingSchema : t.skippedCase);
      return;
    }
    const row = attempt.data;
    setResult({scorePct: row.score_pct, passed: row.passed, mcq: row.mcq_score, caseScore: row.case_score, caseMax: row.case_max, xp: row.xp_awarded, feedback: row.ai_feedback});
    setBest(previous => new Map(previous).set(exam.id, Math.max(previous.get(exam.id) ?? 0, row.score_pct)));
  }

  // The timer running out hands in whatever is answered.
  useEffect(() => {
    if (exam && !result && secondsLeft === 0 && !handing) {
      setNotice(t.timeUp);
      void handIn();
    }
  }, [secondsLeft]);

  if (!ready) return <main className="flex min-h-screen items-center justify-center text-slate-500">{t.loading}</main>;
  if (!user)
    return (
      <main className="mx-auto min-h-screen max-w-2xl bg-white px-4 pt-[calc(var(--site-nav-h)+24px)] pb-8 text-slate-900">
        <SiteNav tone="light" />
        <p className="mb-4">{t.signIn}</p>
        <Link to="/login" className="font-medium underline">{t.goSignIn}</Link>
      </main>
    );

  async function checkIn() {
    const claim = await claimCheckin();
    if (claim.state === 'missing') {
      setState('missing');
      return;
    }
    setCheckinNote(claim.total === null ? t.checkinDone : t.checkinClaimed);
    if (claim.total !== null) {
      const xp = await fetchXp();
      if (xp.state === 'ok') setNotice(`${t.xpEarned}: ${xp.data.total}`);
    }
  }

  const clock = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;

  if (exam && result) {
    return (
      <main className="exam-page mx-auto min-h-screen max-w-3xl bg-white px-4 pt-[calc(var(--site-nav-h)+24px)] pb-10 text-slate-900">
        <SiteNav tone="light" />
        <h1 className="mb-1 text-3xl font-semibold">{t.resultTitle}</h1>
        <p className="mb-6 text-sm text-slate-500">{lang === 'mn' ? exam.title : exam.title_en || exam.title}</p>
        <Card className={`mb-6 ${result.passed ? 'exam-pass' : 'exam-fail'}`}>
          <CardContent className="flex flex-wrap items-center gap-6 p-6">
            <div>
              <p className="text-5xl font-bold">{result.scorePct}%</p>
              <p className="text-sm text-slate-500">{t.score}</p>
            </div>
            <div className="flex-1 space-y-1 text-sm">
              <p><Badge variant={result.passed ? 'default' : 'destructive'}>{result.passed ? t.passed : t.failed}</Badge></p>
              <p className="text-slate-600">{t.mcq}: {result.mcq} / {totalPoints - result.caseMax}</p>
              <p className="text-slate-600">{t.case}: {result.caseScore} / {result.caseMax}</p>
              <p className="text-slate-600">{t.xpEarned}: <b>+{result.xp}</b>{result.xp === 0 && <span className="text-slate-400"> · {t.alreadyAwarded}</span>}</p>
            </div>
          </CardContent>
        </Card>
        {result.feedback && <Card className="mb-6"><CardHeader><CardTitle className="text-lg">{t.markingNotes}</CardTitle></CardHeader><CardContent><p className="whitespace-pre-wrap text-sm text-slate-700">{result.feedback}</p></CardContent></Card>}
        <h2 className="mb-3 text-xl font-semibold">{t.review}</h2>
        <div className="space-y-4">
          {questions.map((question, position) => {
            const given = answers[String(question.id)] ?? {};
            const isMcq = question.kind === 'mcq';
            const right = isMcq && question.answer !== null && given.choice === question.answer;
            return (
              <Card key={question.id}>
                <CardContent className="p-4">
                  <p className="mb-2 flex items-start gap-2 text-sm font-medium">
                    {isMcq ? <Check size={16} className={right ? 'text-emerald-600' : 'text-slate-300'} /> : <ListChecks size={16} className="text-slate-400" />}
                    <span>{position + 1}. {lang === 'mn' ? question.prompt : question.prompt_en || question.prompt}</span>
                  </p>
                  {isMcq && (
                    <ul className="mb-2 space-y-1 text-sm">
                      {question.options.map((option, choiceIndex) => (
                        <li key={option} className={choiceIndex === question.answer ? 'font-medium text-emerald-700' : choiceIndex === given.choice && choiceIndex !== question.answer ? 'text-red-600 line-through' : 'text-slate-500'}>
                          {LETTERS[choiceIndex]}. {option}
                        </li>
                      ))}
                    </ul>
                  )}
                  {!isMcq && <p className="mb-2 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{given.text?.trim() || t.emptyAnswer}</p>}
                  {question.concept && <Link to={`/atlas?focus=${encodeURIComponent(question.concept)}`} className="text-sm font-medium text-blue-700 underline">{t.openInAtlas}</Link>}
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="mt-6 flex gap-3">
          <Button onClick={() => { setParams({}); setResult(null); }}>{t.again}</Button>
          <Button variant="outline" onClick={() => { setParams({}); setResult(null); void load(); }}><RotateCcw size={16} />{t.attempts}</Button>
        </div>
      </main>
    );
  }

  if (exam && questions.length) {
    const question = questions[Math.min(index, questions.length - 1)];
    const key = String(question.id);
    const answered = questions.filter(q => {
      const given = answers[String(q.id)];
      return q.kind === 'mcq' ? given?.choice !== undefined : Boolean(given?.text?.trim());
    }).length;
    return (
      <main className="exam-page exam-running mx-auto min-h-screen max-w-2xl bg-white px-4 pt-[calc(var(--site-nav-h)+16px)] pb-28 text-slate-900">
        <SiteNav tone="light" />
        <header className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">{lang === 'mn' ? exam.title : exam.title_en || exam.title}</p>
            <p className="text-lg font-semibold">{t.question} {index + 1} <span className="text-slate-400">/ {questions.length}</span></p>
          </div>
          <div className={`exam-clock ${secondsLeft < 60 ? 'is-low' : ''}`} role="timer" aria-live="off">
            <Clock size={14} aria-hidden />
            <span>{clock}</span>
          </div>
        </header>
        <div className="exam-progress" aria-hidden><i style={{width: `${((index + 1) / questions.length) * 100}%`}} /></div>
        <Card className="mb-4">
          <CardContent className="p-5">
            <p className="mb-4 text-base font-medium leading-relaxed">{lang === 'mn' ? question.prompt : question.prompt_en || question.prompt}</p>
            {question.kind === 'mcq' ? (
              <div className="space-y-2">
                {question.options.map((option, choiceIndex) => {
                  const picked = answers[key]?.choice === choiceIndex;
                  return (
                    <button key={option} type="button" aria-pressed={picked} className={`exam-option ${picked ? 'is-picked' : ''}`} onClick={() => setAnswers(a => ({...a, [key]: {...a[key], choice: choiceIndex}}))}>
                      <span className="exam-option-key">{LETTERS[choiceIndex]}</span>
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600" htmlFor="case-answer">{t.answerText}</label>
                <Textarea id="case-answer" rows={6} value={answers[key]?.text ?? ''} placeholder={t.answerPlaceholder} onChange={e => setAnswers(a => ({...a, [key]: {...a[key], text: e.target.value}}))} />
                <p className="mt-1 text-xs text-slate-500">{question.points} {t.points}</p>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" disabled={index === 0} onClick={() => setIndex(i => Math.max(0, i - 1))}>{'←'}</Button>
          <p className="text-sm text-slate-500">{answered} / {questions.length}</p>
          {index < questions.length - 1
            ? <Button onClick={() => setIndex(i => Math.min(questions.length - 1, i + 1))}>{'→'}</Button>
            : <Button disabled={handing} onClick={() => setConfirming(true)}>{handing ? t.submitting : t.submit}</Button>}
        </div>
        {notice && <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{notice}</p>}
        {handing && <p className="mt-4 flex items-center gap-2 text-sm text-slate-500"><CircleCheck size={16} />{t.grading}</p>}
        {confirming && (
          <div className="exam-modal" role="dialog" aria-modal="true" aria-label={t.submit}>
            <div className="exam-modal-box">
              <p className="mb-1 font-semibold">{t.submit}</p>
              <p className="mb-4 text-sm text-slate-600">{t.confirmLead}</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setConfirming(false)}>{t.cancel}</Button>
                <Button onClick={() => void handIn()}>{t.confirmSubmit}</Button>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  if (exam && !questions.length && !loading) {
    return (
      <main className="mx-auto min-h-screen max-w-2xl bg-white px-4 pt-[calc(var(--site-nav-h)+24px)] pb-8 text-slate-900">
        <SiteNav tone="light" />
        <p className="mb-4">{t.closed}</p>
        <Button variant="outline" onClick={() => setParams({})}>{t.again}</Button>
      </main>
    );
  }

  return (
    <main className="exam-page mx-auto min-h-screen max-w-3xl bg-white px-4 pt-[calc(var(--site-nav-h)+24px)] pb-10 text-slate-900">
      <SiteNav tone="light" />
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{t.title}</h1>
          <p className="mt-1 text-sm text-slate-600">{t.lead}</p>
        </div>
        <Link to="/atlas" className="shrink-0 text-sm text-slate-500 underline">{t.back}</Link>
      </div>
      {state === 'missing' && <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{t.missingSchema}</p>}
      {notice && <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}
      <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
        <span className="text-sm text-slate-600">{checkinNote || t.checkin}</span>
        <Button size="sm" variant="outline" onClick={() => void checkIn()}><Award size={14} />{t.checkin}</Button>
      </div>
      {loading ? (
        <p className="text-sm text-slate-500">{t.loading}</p>
      ) : exams.length === 0 ? (
        <p className="text-sm text-slate-500">{t.empty}</p>
      ) : (
        <div className="space-y-4">
          {exams.map(row => {
            const score = best.get(row.id);
            const passedNow = score !== undefined && score >= row.pass_pct;
            return (
              <Card key={row.id}>
                <CardContent className="flex flex-wrap items-center gap-4 p-5">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-semibold"><ListChecks size={16} className="text-slate-400" />{lang === 'mn' ? row.title : row.title_en || row.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {row.question_count ?? 0} {t.questions} · {row.total_points ?? 0} {t.points} · {row.time_limit_min} {t.minutes} · {t.passMark} {row.pass_pct}%
                    </p>
                  </div>
                  <div className="text-right">
                    {score === undefined
                      ? <p className="text-sm text-slate-400">{t.notPassed}</p>
                      : <p className={`text-xl font-bold ${passedNow ? 'text-emerald-600' : 'text-red-600'}`}>{score}%</p>}
                  </div>
                  <Button onClick={() => setParams({exam: String(row.id)})}>{score === undefined ? t.start : t.resume}</Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <p className="mt-8 flex items-center gap-2 text-sm text-slate-400"><Trophy size={14} />{t.lead}</p>
      <Link to="/quiz" className="mt-1 inline-flex items-center gap-1 text-sm underline"><ListChecks size={12} />{lang === 'mn' ? 'Бататгал (Quiz)' : 'Practice quiz'}</Link>
    </main>
  );
}
