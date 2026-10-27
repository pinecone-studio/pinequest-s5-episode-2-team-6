import {Link,NavLink} from 'react-router-dom';
import {Box,HandHeart,House,LogIn,UserRound} from 'lucide-react';
import {useAuth} from '../hooks/use-auth';
import {useLang} from './locale';
import './site-nav.css';

// One navigation bar for every page: the brand, the three screens, the language and the account (sign-in
// until someone is signed in). It is fixed to the top; each page keeps --site-nav-h clear for it. "glass"
// sits on the blue rooms (the atlas glass backdrop and the body check), "light" on the paper pages. Phones
// keep the icons and drop the labels.
export default function SiteNav({tone, onNavigate}: {tone: 'glass' | 'light'; onNavigate?: () => void}) {
  const {lang, setLang, langs, t} = useLang();
  const {user} = useAuth();
  const account = user ? {to: '/account', label: t.site.account, Icon: UserRound} : {to: '/login', label: t.site.signIn, Icon: LogIn};
  const links = [
    {to: '/', label: t.site.home, Icon: House},
    {to: '/atlas', label: t.site.atlas, Icon: Box},
    {to: '/body', label: t.site.body, Icon: HandHeart},
  ];
  return (
    <header className={`site-nav is-${tone}`}>
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
