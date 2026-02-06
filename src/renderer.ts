import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './renderer/App';
import './renderer/styles/global.css';
import './renderer/styles/preferences.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(React.createElement(App));
}
