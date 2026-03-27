import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const chunkReloadKey = 'vite:chunk-reload-path';

window.addEventListener('vite:preloadError', (event) => {
  const hasReloadedCurrentPath = sessionStorage.getItem(chunkReloadKey) === window.location.pathname;

  if (hasReloadedCurrentPath) {
    sessionStorage.removeItem(chunkReloadKey);
    return;
  }

  event.preventDefault();
  sessionStorage.setItem(chunkReloadKey, window.location.pathname);
  window.location.reload();
});

window.addEventListener('load', () => {
  sessionStorage.removeItem(chunkReloadKey);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
