import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/600.css';
import './styles/global.css';
import './styles/scenes.css';
import './styles/animations.css';
import { App } from './app/App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Offline + "add to home screen" support (production builds only).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline support is optional */
    });
  });
}
