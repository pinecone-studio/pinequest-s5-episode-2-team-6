import {useEffect,useRef,useState} from 'react';
import {Check,Copy,Send,Sparkles,Square,Trash2,X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {ASSISTANT_PROMPTS,askAtlas,type AssistantAction} from './ai-assistant';
import {buildAssistantReferences} from './assistant-context';
import {AssistantError,fetchAssistantHealth,streamAssistant} from './llm-client';
import MarkdownText from './markdown-text';
import {localName} from './mongolian-names';
import type {Atlas} from './anatomy';
import type {AssistantHealth,AssistantSelection,ChatTurn} from './llm-types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  actions?: AssistantAction[];
  error?: string;
  pending?: boolean;
}

interface Props {
  open: boolean;
  atlas: Atlas | null;
  selection: AssistantSelection | null;
  onAction: (action: AssistantAction) => void;
  onClose: () => void;
}

let counter = 0;
const nextId = () => `m${(counter += 1)}`;

function assistantErrorMessage(code: string): string {
  if (code === 'not_configured') {
    return 'LLM холболт тохируулагдаагүй байна. .env.local файлд GEMINI_API_KEY, OPENAI_API_KEY эсвэл OPENROUTER_API_KEY нэмээд серверээ дахин эхлүүлнэ үү.';
  }
  if (code === 'provider_auth') return 'LLM API түлхүүр буруу эсвэл хүчингүй байна. Серверийн тохиргоог шалгана уу.';
  if (code === 'provider_quota') return 'LLM provider-ийн кредит эсвэл квот дууссан байна. OpenAI billing хэсэгт кредит нэмээд дахин оролдоно уу.';
  if (code === 'provider_model') return 'Тохируулсан LLM загвар олдсонгүй. GEMINI_MODEL эсвэл бусад *_MODEL тохиргоог шалгана уу.';
  if (code === 'rate_limited') return 'Хүсэлт хэт олон байна. Нэг минутын дараа дахин оролдоно уу.';
  if (code === 'provider_busy') return 'LLM загвар түр ачаалалтай байна. Хэдэн секундын дараа дахин оролдоно уу.';
  if (code === 'unavailable') return 'LLM API олдсонгүй. api/chat серверэн дээр ажиллаж байгаа эсэхийг шалгана уу.';
  if (code === 'network') return 'Сүлжээний алдаа гарлаа. Интернэт холболтоо шалгаад дахин оролдоно уу.';
  if (code === 'stream_error') return 'Хариулт бүрэн ирээгүй. Дахин оролдоно уу.';
  if (code === 'empty') return 'LLM хоосон хариулт өглөө. Асуултаа өөрөөр тавиад үзээрэй.';
  return 'Алдаа гарлаа. Дахин оролдоно уу.';
}

function TypingDots() {
  return (
    <span className="ai-typing" aria-label="Хариулт бэлдэж байна">
      <i />
      <i />
      <i />
    </span>
  );
}

export default function AiPanel({open, atlas, selection, onAction, onClose}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState<AssistantHealth | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const stickRef = useRef(true);

  useEffect(() => {
    if (open) textareaRef.current?.focus();
    else abortRef.current?.abort();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    fetchAssistantHealth(controller.signal)
      .then(setHealth)
      .catch(() => setHealth(null));
    return () => controller.abort();
  }, [open]);

  useEffect(() => {
    const list = listRef.current;
    if (list && stickRef.current) list.scrollTop = list.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 112)}px`;
  }, [draft, open]);

  useEffect(() => {
    if (!copiedId) return;
    const timer = window.setTimeout(() => setCopiedId(null), 1600);
    return () => window.clearTimeout(timer);
  }, [copiedId]);

  useEffect(() => () => abortRef.current?.abort(), []);

  if (!open) return null;

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || busy) return;
    setDraft('');
    const user: ChatMessage = {id: nextId(), role: 'user', text: question};
    const assistantId = nextId();
    const history: ChatTurn[] = [...messages, user]
      .filter(message => !message.error && message.text.trim())
      .slice(-12)
      .map(message => ({role: message.role, content: message.text}));
    setMessages(current => [...current, user, {id: assistantId, role: 'assistant', text: '', pending: true}]);
    setBusy(true);
    stickRef.current = true;

    let actions: AssistantAction[] = [];
    if (atlas) {
      try {
        actions = askAtlas(question, {atlas, selection}).actions;
        for (const action of actions) onAction(action);
      } catch (error) {
        console.error('[assistant] could not plan model actions', error);
      }
    }

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await streamAssistant(
        {
          messages: history,
          selection,
          references: atlas ? buildAssistantReferences(atlas, question) : [],
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
      setMessages(current => current.map(message => (message.id === assistantId ? {...message, pending: false, actions} : message)));
    } catch (error) {
      if (controller.signal.aborted) {
        setMessages(current =>
          current.map(message =>
            message.id === assistantId ? {...message, pending: false, text: message.text || 'Хариулт зогсоогдлоо.', actions} : message,
          ),
        );
      } else {
        const message = error instanceof AssistantError ? assistantErrorMessage(error.code) : assistantErrorMessage('unknown');
        setMessages(current => current.map(item => (item.id === assistantId ? {...item, pending: false, error: message, actions} : item)));
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

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

  return (
    <section className="ai-panel glass" aria-label="AI туслах">
      <header className="ai-header">
        <div className="ai-title-block">
          <p className="ai-kicker">
            <Sparkles size={12} /> LLM ASSISTANT
            {health?.configured && health.model && (
              <span className="ai-model-badge" title={`${health.provider ?? 'LLM'} · ${health.model}`}>
                {health.model}
              </span>
            )}
          </p>
          <h2 className="ai-title">AI туслах</h2>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" className="icon-button ai-clear" onClick={clear} aria-label="Чатыг цэвэрлэх" title="Чатыг цэвэрлэх">
            <Trash2 size={16} />
          </Button>
        )}
        <Button variant="ghost" className="icon-button ai-close" onClick={onClose} aria-label="Туслахыг хаах">
          <X size={18} />
        </Button>
      </header>

      {selection && (
        <p className="ai-selection">
          <span className="ai-selection-dot" /> Сонгосон: {localName(selection.name, 'mn')}
        </p>
      )}

      <div className="ai-messages" ref={listRef} role="log" aria-live="polite" onScroll={() => {
        const list = listRef.current;
        if (list) stickRef.current = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
      }}>
        {messages.length === 0 && (
          <div className="ai-intro">
            <p>
              Юу ч асууж болно — анатоми, эрүүл мэнд, шинжлэх ухаан, сургалт, технологи, өдөр тутмын амьдрал.
              Хариултыг дэлгэрэнгүй, монгол хэлээр, шаардлагатай латин нэршлийг хэвээр нь өгнө.
            </p>
            {health?.configured === false && (
              <p className="ai-config-hint">
                LLM холболт тохируулагдаагүй байна. Серверт <code>GEMINI_API_KEY</code>, <code>OPENAI_API_KEY</code> эсвэл <code>OPENROUTER_API_KEY</code> нэмнэ үү.
              </p>
            )}
            <div className="ai-prompts">
              {ASSISTANT_PROMPTS.map(prompt => (
                <Button key={prompt} variant="ghost" className="ai-prompt" onClick={() => void send(prompt)} disabled={busy}>
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}
        {messages.map(message => (
          <div key={message.id} className={`ai-message ai-message-${message.role}${message.error ? ' ai-message-error' : ''}`}>
            {message.role === 'user' ? (
              <p>{message.text}</p>
            ) : (
              <>
                {message.text ? <MarkdownText text={message.text} /> : message.pending ? <TypingDots /> : null}
                {message.pending && message.text && <span className="ai-cursor" aria-hidden="true" />}
                {message.error && (
                  <div className="ai-error">
                    <strong>Алдаа</strong>
                    <p>{message.error}</p>
                  </div>
                )}
                {message.actions && message.actions.length > 0 && (
                  <div className="ai-actions">
                    {message.actions.map((action, index) => (
                      <span key={`${action.kind}-${index}`} className="ai-action-chip">
                        ✓ {action.label}
                      </span>
                    ))}
                  </div>
                )}
                {message.text && !message.pending && (
                  <div className="ai-message-tools">
                    <button type="button" className="ai-tool-button" onClick={() => void copy(message)} aria-label="Хариултыг хуулах">
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
        className="ai-composer"
        onSubmit={event => {
          event.preventDefault();
          void send(draft);
        }}
      >
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={event => setDraft(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey && !busy) {
              event.preventDefault();
              void send(draft);
            }
          }}
          placeholder="Асуух зүйлээ энд бичнэ үү"
          aria-label="AI туслахаас асуух"
          rows={1}
        />
        {busy ? (
          <Button type="button" variant="ghost" className="ai-send ai-stop" onClick={stop} aria-label="Хариултыг зогсоох">
            <Square size={14} />
          </Button>
        ) : (
          <Button type="submit" variant="ghost" className="ai-send" aria-label="Асуулт илгээх" disabled={!draft.trim()}>
            <Send size={16} />
          </Button>
        )}
      </form>
      <p className="ai-note">Хариултыг LLM үүсгэдэг. Эмнэлгийн онош, эмчилгээний зөвлөгөө биш.</p>
    </section>
  );
}
