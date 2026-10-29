import {lazy,Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,Routes,Route} from 'react-router-dom';
import LandingPage from '../app/landing/page';
import {LangProvider} from '../app/locale';
import '../app/globals.css';

// The landing page ships in the entry bundle; the atlas (with ROM Lab's camera code) and the
// account pages download only when someone opens them.
const Home=lazy(()=>import('../app/page'));
const LoginPage=lazy(()=>import('../app/login/page'));
const SignupPage=lazy(()=>import('../app/signup/page'));
const QuizPage=lazy(()=>import('../app/quiz/page'));
const AccountPage=lazy(()=>import('../app/account/page'));
const AdminPage=lazy(()=>import('../app/admin/page'));

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <LangProvider>
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<LandingPage/>}/>
        <Route path="/atlas" element={<Home/>}/>
        {/* The Plaque lab is the atlas with its panel open; the same element keeps the loaded model between the two. */}
        <Route path="/plaque" element={<Home/>}/>
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/signup" element={<SignupPage/>}/>
        <Route path="/quiz" element={<QuizPage/>}/>
        <Route path="/account" element={<AccountPage/>}/>
        <Route path="/admin" element={<AdminPage/>}/>
      </Routes>
    </Suspense>
    </LangProvider>
  </BrowserRouter>
);
