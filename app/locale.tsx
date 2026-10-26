import {createContext,useContext,useEffect,useMemo,useState,type ReactNode} from 'react';
import {ATLAS,type AtlasCopy} from './atlas-copy';
import {LANGS,loadLang,saveLang,type Lang} from './landing/copy';

interface LangValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: AtlasCopy;
  langs: typeof LANGS;
}

const LangContext = createContext<LangValue | null>(null);

export function LangProvider({children}: {children: ReactNode}) {
  const [lang, setLang] = useState<Lang>(loadLang);
  useEffect(() => {
    saveLang(lang);
    document.documentElement.lang = lang;
  }, [lang]);
  const value = useMemo<LangValue>(() => ({lang, setLang, t: ATLAS[lang], langs: LANGS}), [lang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const value = useContext(LangContext);
  if (!value) throw new Error('useLang must be used inside LangProvider.');
  return value;
}

/** MN / EN control. The choice is saved and shared by the landing page and the atlas. */
export function LangSwitch() {
  const {lang, setLang, langs, t} = useLang();
  return (
    <div className="lang-switch" role="group" aria-label={t.language}>
      {langs.map(item => (
        <button
          key={item.id}
          type="button"
          lang={item.id}
          aria-label={item.name}
          aria-pressed={item.id === lang}
          className={item.id === lang ? 'is-active' : ''}
          onClick={() => setLang(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
