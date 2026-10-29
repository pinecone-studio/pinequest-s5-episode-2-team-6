import {Fragment} from 'react';
import {Link,NavLink} from 'react-router-dom';
import {Activity,Bone,Box,GraduationCap,ListChecks,LogIn,ScrollText,UserRound} from 'lucide-react';
import {useAuth} from '../hooks/use-auth';
import {useLang} from './locale';
import './site-nav.css';

// One navigation bar for every page: the brand (which is also the way home), the screens, the language and the
// profile (sign-in until someone is signed in). It is fixed to the top; each page keeps --site-nav-h clear for it.
// It wears the AI teacher's navy on every page. The screens come in two groups: what to explore (the atlas and the
// two labs) and how to study (the AI teacher, quizzes, exams). Wide screens show the names, phones the icons.
// `highlight` rings the bar while the atlas's phone guide is explaining it.
export default function SiteNav({highlight, onNavigate}: {highlight?: boolean; onNavigate?: () => void}) {
  const {lang, setLang, langs, t} = useLang();
  const {user} = useAuth();
  const account = user ? {to: '/profile', label: t.site.account, Icon: UserRound} : {to: '/login', label: t.site.signIn, Icon: LogIn};
  const groups = [
    [
      {to: '/atlas', label: t.site.atlas, Icon: Box},
      {to: '/plaque', label: t.site.plaque, Icon: Activity},
      {to: '/fracture', label: t.site.fracture, Icon: Bone},
    ],
    [
      {to: '/teacher', label: t.site.teacher, Icon: GraduationCap},
      {to: '/quiz', label: t.site.quiz, Icon: ListChecks},
      {to: '/exam', label: t.site.exam, Icon: ScrollText},
    ],
  ];
  return (
    <header className={`site-nav ${highlight ? 'intro-target' : ''}`}>
      <Link to="/" className="site-brand" aria-label={`Anatomn, ${t.site.home}`} title={t.site.home} onClick={onNavigate}>
        <span className="site-mark" aria-hidden />
        <span className="site-brand-name">Anatomn</span>
      </Link>
      <nav className="site-links" aria-label={t.site.label}>
        {groups.map((group, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="site-divider" aria-hidden />}
            {group.map(({to, label, Icon}) => (
              <NavLink key={to} to={to} end aria-label={label} title={label} className={({isActive}) => (isActive ? 'is-active' : '')} onClick={onNavigate}>
                <Icon size={17} aria-hidden />
                <span>{label}</span>
              </NavLink>
            ))}
          </Fragment>
        ))}
      </nav>
      <div className="site-end">
        <div className="site-lang" role="group" aria-label={t.language}>
          {langs.map(item => (
            <button key={item.id} type="button" lang={item.id} aria-label={item.name} aria-pressed={item.id === lang} className={item.id === lang ? 'is-active' : ''} onClick={() => setLang(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        <NavLink to={account.to} aria-label={account.label} title={account.label} className={({isActive}) => `site-login ${isActive ? 'is-active' : ''}`} onClick={onNavigate}>
          <account.Icon size={16} aria-hidden />
          <span>{account.label}</span>
        </NavLink>
      </div>
    </header>
  );
}
