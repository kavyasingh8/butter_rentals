import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { fetchNui } from './utils/fetchNui';
import { isEnvBrowser } from './utils/misc';
import { setLocale } from './utils/locale';
import { applyTheme, Theme } from './utils/theme';
import './index.css';

applyTheme();
if (!isEnvBrowser()) fetchNui<Partial<Theme>>('getTheme').then(applyTheme).catch(() => {});

const render = () =>
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );

// Strings are loaded before the first render so nothing flashes in English.
if (isEnvBrowser()) render();
else fetchNui<Record<string, string>>('getLocale').then(setLocale).catch(() => {}).finally(render);
