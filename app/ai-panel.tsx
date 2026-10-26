import {useEffect,useRef,useState} from 'react';
import {Send,Sparkles,X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {type AssistantAction} from './ai-assistant';
import {useLang} from './locale';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  actions?: AssistantAction[];
}

interface Props {
  open: boolean;
  selection: {name: string; system: string} | null;
  ask: (question: string) => {text: string; actions: AssistantAction[]};
  onClose: () => void;
}

let counter = 0;
const nextId = () => `m${(counter += 1)}`;

export default function AiPanel({open, selection, ask, onClose}: Props) {
  const {t} = useLang();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, open]);

  if (!open) return null;

  const send = (text: string) => {
    const question = text.trim();
    if (!question) return;
    setDraft('');
    setMessages(current => [...current, {id: nextId(), role: 'user', text: question}]);
    const reply = ask(question);
    setMessages(current => [...current, {id: nextId(), role: 'assistant', text: reply.text, actions: reply.actions}]);
  };

  return (
    <section className="ai-panel glass" aria-label={t.ai.panel}>
      <header className="ai-header">
        <div className="ai-title-block">
          <p className="ai-kicker">
            <Sparkles size={12} /> {t.ai.kicker}
          </p>
          <h2 className="ai-title">{t.ai.title}</h2>
        </div>
        <Button variant="ghost" className="icon-button ai-close" onClick={onClose} aria-label={t.ai.close}>
          <X size={18} />
        </Button>
      </header>

      {selection && (
        <p className="ai-selection">
          <span className="ai-selection-dot" /> {t.ai.selected}: {selection.name}
        </p>
      )}

      <div className="ai-messages" ref={listRef} role="log" aria-live="polite">
        {messages.length === 0 && (
          <div className="ai-intro">
            <p>{t.ai.intro}</p>
            <div className="ai-prompts">
              {t.ai.prompts.map(prompt => (
                <Button key={prompt} variant="ghost" className="ai-prompt" onClick={() => send(prompt)}>
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}
        {messages.map(message => (
          <div key={message.id} className={`ai-message ai-message-${message.role}`}>
            <p>{message.text}</p>
            {message.actions && message.actions.length > 0 && (
              <div className="ai-actions">
                {message.actions.map((action, index) => (
                  <span key={`${action.kind}-${index}`} className="ai-action-chip">
                    ✓ {action.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <form
        className="ai-composer"
        onSubmit={event => {
          event.preventDefault();
          send(draft);
        }}
      >
        <input
          ref={inputRef}
          value={draft}
          onChange={event => setDraft(event.target.value)}
          placeholder={t.ai.placeholder}
          aria-label={t.ai.ask}
        />
        <Button type="submit" variant="ghost" className="ai-send" aria-label={t.ai.send} disabled={!draft.trim()}>
          <Send size={16} />
        </Button>
      </form>
      <p className="ai-note">{t.ai.note}</p>
    </section>
  );
}
