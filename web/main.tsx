import {createRoot} from 'react-dom/client';
import {BrowserRouter,Routes,Route} from 'react-router-dom';
import Home from '../app/page';
import LandingPage from '../app/landing/page';
import LoginPage from '../app/login/page';
import SignupPage from '../app/signup/page';
import '../app/globals.css';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LandingPage/>}/>
      <Route path="/atlas" element={<Home/>}/>
      <Route path="/login" element={<LoginPage/>}/>
      <Route path="/signup" element={<SignupPage/>}/>
    </Routes>
  </BrowserRouter>
);