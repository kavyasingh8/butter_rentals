import React from 'react';
import ReactDOM from 'react-dom/client';
import { PhoneApp } from './PhoneApp';
import { whenReady } from './phoneApi';
import { applyTheme } from '../utils/theme';
import './phone.css';

applyTheme();

whenReady().then(() => {
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <PhoneApp />
    </React.StrictMode>,
  );
});
