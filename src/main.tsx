import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import LandingPage from './components/LandingPage.tsx';
import './index.css';

function Root() {
  const [entered, setEntered] = useState(false);

  if (!entered) {
    return <LandingPage onEnter={() => setEntered(true)} />;
  }

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
