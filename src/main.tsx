import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

window.addEventListener('error', (e) => {
  console.error('[GlobalError]', e.message, e.filename, e.lineno, e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('[UnhandledPromise]', e.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
