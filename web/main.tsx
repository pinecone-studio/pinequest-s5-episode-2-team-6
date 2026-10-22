import {lazy,Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,Routes,Route} from 'react-router-dom';
import LandingPage from '../app/landing/page';
import '../app/globals.css';

// The landing page ships in the entry bundle; the atlas (with ROM Lab's camera code) and the
// account pages download only when someone opens them.
const Home=lazy(()=>import('../app/page'));
const LoginPage=lazy(()=>import('../app/login/page'));
const SignupPage=lazy(()=>import('../app/signup/page'));

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<LandingPage/>}/>
        <Route path="/atlas" element={<Home/>}/>
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/signup" element={<SignupPage/>}/>
      </Routes>
    </Suspense>
  </BrowserRouter>
);
