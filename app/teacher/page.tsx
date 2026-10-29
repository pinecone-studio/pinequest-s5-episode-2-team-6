import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {BookOpen,Check,Copy,GraduationCap,History,Link2,Send,Square,Trash2} from 'lucide-react';
import {useAuth} from '../../hooks/use-auth';
import {AssistantError,fetchAssistantHealth,streamAssistant} from '../llm-client';
import {assistantErrorMessage} from '../ai-panel';
import MarkdownText from '../markdown-text';
import SiteNav from '../site-nav';
import {useLang} from '../locale';
import {
  CHAPTERS,TEXTBOOK,routeChapter,
} from './textbook';
import {
  fetchServerHistory,loadLocalProfile,mergeServerHistory,
  recordQuestion,saveLocalProfile,saveServerQuestion,topicStats,
  type TeacherEntry,
} from './profile';
import type {AssistantHealth} from '../llm-types';
import './teacher.css';

// The AI teacher: a full-page chat where a student asks whatever they do not
// understand and the teacher answers anchored to the matching Gray's Anatomy
// for Students chapter, remembers what was already asked and rises its
// teaching depth with the per-chapter level stored in the profile.
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  chapterId?: string;
  error?: string;
  pending?: boolean;
}

const ALL = 'all';
let counter = 0;
const nextId = () => `t${(counter += 1)}`;
const recentQuestionsOf = (recent: TeacherEntry[], chapterId: string | null): string[] =>
  recent.filter(entry => !chapterId || entry.chapterId === chapterId).slice(0, 8).map(entry => entry.question);

export default function TeacherPage() {
  const {t} = useLang();
  const {user} = useAuth();
  const [chapterId, setChapterId] = useState<string>(ALL);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState<AssistantHealth | null>(null);
  const [profile, setProfile] = useState(() => loadLocalProfile());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const stickRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  // Cross-device history: the saved questions add to the local profile once on load.
  useEffect(() => {
    let alive = true;
    fetchServerHistory()
      .then(rows => {
        if (alive && rows) setProfile(current => mergeServerHistory(current, rows));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [user?.id]);

  useEffect(() => {
    saveLocalProfile(profile);
  }, [profile]);

  useEffect(() => {
    const controller = new AbortController();
    fetchAssistantHealth(controller.signal)
      .then(setHealth)
      .catch(() => setHealth(null));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (list && stickRef.current) list.scrollTop = list.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [draft]);

  useEffect(() => {
    if (!copiedId) return;
    const timer = window.setTimeout(() => setCopiedId(null), 1600);
    return () => window.clearTimeout(timer);
  }, [copiedId]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(async (text: string) => {
    const question = text.trim();
    if (!question || busy) return;
    setDraft('');
    setBusy(true);
    stickRef.current = true;
    textareaRef.current?.focus();
    const userMessage: ChatMessage = {id: nextId(), role: 'user', text: question};
    const assistantId = nextId();
    setMessages(current => [...current, userMessage, {id: assistantId, role: 'assistant', text: '', pending: true}]);

    // 'Бүгд' routes the question to a chapter from its wording; a picked
    // chapter anchors the answer no matter how it is phrased.
    const anchorChapter = chapterId === ALL
      ? routeChapter(question)
      : CHAPTERS.find(item => item.id === chapterId) ?? null;

    const history = [...messages, userMessage]
      .filter(message => !message.error && message.text.trim())
      .slice(-12)
      .map(message => ({role: message.role, content: message.text}));

    // Learning: remember the asked question under its chapter, locally and in Supabase.
    if (anchorChapter) {
      setProfile(current => recordQuestion(current, anchorChapter.id, question));
      void saveServerQuestion(anchorChapter.id, question);
    }

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await streamAssistant(
        {
          mode: 'teacher',
          messages: history,
          textbook: {chapterId: anchorChapter?.id},
          student: {
            topics: topicStats(profile).map(stat => ({chapterId: stat.chapterId, questions: stat.questions, level: stat.level})),
            recentQuestions: recentQuestionsOf(profile.recent, anchorChapter?.id ?? null),
          },
        },
        {
          signal: controller.signal,
          onDelta: delta => {
            setMessages(current =>
              current.map(message => (message.id === assistantId ? {...message, text: message.text + delta, pending: true} : message)),
            );
          },
        },
      );
      setMessages(current => current.map(message => (message.id === assistantId ? {...message, pending: false} : message)));
    } catch (error) {
      if (controller.signal.aborted) {
        setMessages(current =>
          current.map(message =>
            message.id === assistantId ? {...message, pending: false, text: message.text || 'Хариулт зогсоогдлоо.'} : message,
          ),
        );
      } else {
        const message = error instanceof AssistantError ? assistantErrorMessage(error.code) : assistantErrorMessage('unknown');
        setMessages(current => current.map(item => (item.id === assistantId ? {...item, pending: false, error: message} : item)));
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }, [busy, chapterId, messages, profile]);

  const stop = () => abortRef.current?.abort();

  const clear = () => {
    abortRef.current?.abort();
    setMessages([]);
    setDraft('');
  };

  const copy = async (message: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopiedId(message.id);
    } catch {
      // Clipboard access can be denied; the answer remains selectable.
    }
  };

  const stats = useMemo(() => topicStats(profile), [profile]);
  const activeChapter = chapterId === ALL ? null : CHAPTERS.find(item => item.id === chapterId) ?? null;
  const starters = activeChapter ? activeChapter.starters : ["Анатомийг Gray's-ийн бүтцээр яаж судлах уу?", 'Хичээлээ эхлүүлээч: биеийн ерөнхий ойлголтоос эхэл'];

  return (
    <div className="teacher-page">
      <SiteNav tone="glass" />
      <main className="teacher-wrap">
        <header className="teacher-hero">
          <p className="teacher-kicker">
            <GraduationCap size={14} /> {t.site.teacher}
          </p>
          <h1 className="teacher-title">AI багш</h1>
          <p className="teacher-sub">
            Мэдэхгүй зүйлээ асуугаарай — багш анатомийг <a href="https://www.scribd.com/document/915618827/Gray-s-Anatomy-for-Students-PDF" target="_blank" rel="noreferrer">{TEXTBOOK.title}</a>{' '}
            сурах бичгийн бүсийн анатомийн бүтцээр бүлэг тус бүрээр тайлбарлаж, аль бүлгийг уншихыг зааж өгнө.
            Таны асуусан асуултууд хадгалагдаж, дараагийн хариултууд түүнд тулгуурлан гүнзгийрэнэ.
          </p>
        </header>

        <div className="teacher-chapters" role="group" aria-label="Сурах бичгийн бүлэг">
          <button type="button" className={`teacher-chip ${chapterId === ALL ? 'is-active' : ''}`} onClick={() => setChapterId(ALL)}>
            Бүгд (авто)
          </button>
          {CHAPTERS.map(chapter => (
            <button
              key={chapter.id}
              type="button"
              className={`teacher-chip ${chapterId === chapter.id ? 'is-active' : ''}`}
              title={chapter.blurb}
              onClick={() => setChapterId(chapter.id)}
            >
              Бүлэг {chapter.chapter} <small>{chapter.mn}</small>
            </button>
          ))}
        </div>

        <section className="teacher-chat" aria-label="AI багшийн чат">
          <div className="teacher-messages" ref={listRef} role="log" aria-live="polite" onScroll={() => {
            const list = listRef.current;
            if (list) stickRef.current = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
          }}>
            {messages.length === 0 && (
              <div className="teacher-intro">
                {activeChapter ? (
                  <p>
                    Бүлэг {activeChapter.chapter} — {activeChapter.mn}. {activeChapter.blurb} Асуултаа бичих эсвэл доорх санал асуултуудаас эхэл.
                  </p>
                ) : (
                  <p>Асуултаа бичээд багш түүнийг тохирох бүлэгт өөрөө хуваарилан хариулна. Бүлэг сонговол хариулт зөвхөн тэр бүлгийн хүрээнд төвлөрнө.</p>
                )}
                {health?.configured === false && (
                  <p className="ai-config-hint">
                    AI багш түр ажиллахгүй байна. Серверт LLM түлхүүр (GEMINI_API_KEY) тохируулахаа мартогүй байцгаая.
                  </p>
                )}
                <div className="teacher-prompts">
                  {starters.map(prompt => (
                    <button key={prompt} type="button" className="teacher-prompt" onClick={() => void send(prompt)} disabled={busy}>
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map(message => (
              <div key={message.id} className={`teacher-message teacher-message-${message.role}${message.error ? ' teacher-message-error' : ''}`}>
                {message.role === 'user' ? (
                  <p>{message.text}</p>
                ) : (
                  <>
                    {message.text ? <MarkdownText text={message.text} /> : message.pending ? <span className="ai-typing"><i /><i /><i /></span> : null}
                    {message.pending && message.text && <span className="ai-cursor" aria-hidden="true" />}
                    {message.error && <p className="teacher-error">{message.error}</p>}
                    {message.text && !message.pending && (
                      <div className="teacher-message-tools">
                        <button type="button" className="teacher-tool-button" onClick={() => void copy(message)} aria-label="Хариултыг хуулах">
                          {copiedId === message.id ? <Check size={12} /> : <Copy size={12} />}
                          {copiedId === message.id ? 'Хуулсан' : 'Хуулах'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
          <form
            className="teacher-form"
            onSubmit={event => {
              event.preventDefault();
              void send(draft);
            }}
          >
            {messages.length > 0 && (
              <button type="button" className="teacher-tool-button teacher-clear" onClick={clear} aria-label="Чатыг цэвэрлэх">
                <Trash2 size={14} /> Цэвэрлэх
              </button>
            )}
            <textarea
              ref={textareaRef}
              className="teacher-input"
              rows={1}
              value={draft}
              placeholder={activeChapter ? `${activeChapter.mn} бүлгийн талаар асуух...` : 'Мэдэхгүй зүйлээ асуугаарай...'}
              onChange={event => setDraft(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void send(draft);
                }
              }}
            />
            {busy ? (
              <button type="button" className="teacher-stop" onClick={stop}>
                <Square size={13} /> Зогсоох
              </button>
            ) : (
              <button type="submit" className="teacher-send" disabled={!draft.trim()}>
                <Send size={14} /> Асуух
              </button>
            )}
          </form>
        </section>

        <aside className="teacher-side">
          <div className="teacher-card">
            <h2 className="teacher-card-title"><Link2 size={13} /> Миний ахиц</h2>
            {stats.length === 0 ? (
              <p className="teacher-progress-empty">Асуулт асуусан тусам бүлэг тус бүрийн ахиц энд дүүрнэ. Нэг бүлгийг 5 асуултаар ахисан, 12-оор гүнзгийрүүлсэн түвшинд шилжинэ.</p>
            ) : (
              <div className="teacher-progress-row">
                {stats.map(stat => {
                  const chapter = CHAPTERS.find(item => item.id === stat.chapterId);
                  return (
                    <div key={stat.chapterId} className="teacher-progress-item">
                      <button type="button" onClick={() => setChapterId(stat.chapterId)} title={chapter?.blurb ?? ''}>
                        <span className="teacher-progress-name">
                          <span>{chapter?.mn ?? stat.chapterId}</span>
                          <span>{stat.questions} асуулт</span>
                        </span>
                        <span className="teacher-progress-bar">
                          <span className={`teacher-progress-fill l${stat.level}`} />
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="teacher-card">
            <h2 className="teacher-card-title"><History size={13} /> Миний асуултууд</h2>
            {profile.recent.length === 0 ? (
              <p className="teacher-history-empty">Асуусан асуултууд энд хадгалагдана. Нэвтэрсэн бол өөр төхөөрөмжөөс ч харах боломжтой.</p>
            ) : (
              <div className="teacher-history">
                {profile.recent.slice(0, 15).map((entry, index) => {
                  const chapter = CHAPTERS.find(item => item.id === entry.chapterId);
                  return (
                    <button
                      key={`${entry.at}-${index}`}
                      type="button"
                      className="teacher-history-item"
                      onClick={() => setDraft(entry.question)}
                      title="Асуултыг дахин бичих"
                    >
                      <span className="teacher-history-tag">
                        <strong>Бүлэг {chapter?.chapter ?? '—'}</strong> {chapter?.mn ?? entry.chapterId}
                      </span>
                      <span>{entry.question}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="teacher-card">
            <h2 className="teacher-card-title"><BookOpen size={13} /> Багшийн арга</h2>
            <p className="teacher-progress-empty">{TEXTBOOK.method}</p>
          </div>
        </aside>
      </main>
    </div>
  );
}
