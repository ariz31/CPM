import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initializePwaUpdateControl } from './infrastructure/pwaUpdate';
import './styles.css';
import './phase10.css';

initializePwaUpdateControl();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Application root element is missing.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
