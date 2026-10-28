import {Link,NavLink} from 'react-router-dom';
import {Activity,Bone,Box,House,ListChecks,LogIn,ScrollText,UserRound} from 'lucide-react';
import {useAuth} from '../hooks/use-auth';
import {useLang} from './locale';
import './site-nav.css';

// One navigation bar for every page: the brand, the six screens, the language and the account (sign-in
// until someone is signed in). It is fixed to the top; each page keeps --site-nav-h clear for it. "glass"
// sits on the blue rooms (the atlas glass backdrop, the Plaque lab and the quiz), "light" on the paper pages. Phones
// keep the icons and drop the labels.
// `highlight` rings the bar while the atlas's phone guide is explaining it.
export default function SiteNav({tone, highlight, onNavigate}: {tone: 'glass' | 'light'; highlight?: boolean; onNavigate?: () => void}) {
  const {lang, setLang, langs, t} = useLang();
  const {user} = useAuth();
  const account = user ? {to: '/account', label: t.site.account, Icon: UserRound} : {to: '/login', label: t.site.signIn, Icon: LogIn};
  const links = [
    {to: '/', label: t.site.home, Icon: House},
    {to: '/atlas', label: t.site.atlas, Icon: Box},
    {to: '/plaque', label: t.site.plaque, Icon: Activity},
    {to: '/fracture', label: lang==='mn'?'Хугарлын лаб':'Fracture Lab', Icon: Bone},
    {to: '/quiz', label: t.site.quiz, Icon: ListChecks},
    {to: '/exam', label: t.site.exam, Icon: ScrollText},
  ];
  return (
    <header className={`site-nav is-${tone} ${highlight ? 'intro-target' : ''}`}>
      <Link to="/" className="site-brand" onClick={onNavigate}>
        <span className="site-mark" aria-hidden />
        <span className="site-brand-name">Anatomn</span>
      </Link>
      <nav className="site-links" aria-label={t.site.label}>
        {links.map(({to, label, Icon}) => (
          <NavLink key={to} to={to} end aria-label={label} title={label} className={({isActive}) => (isActive ? 'is-active' : '')} onClick={onNavigate}>
            <Icon size={16} aria-hidden />
            <span>{label}</span>
          </NavLink>
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
