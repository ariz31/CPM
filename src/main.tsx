import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { AppearanceProvider } from './design-system/theme';
import { initializePwaUpdateControl } from './infrastructure/pwaUpdate';
import './styles.css';
import './phases456.css';
import './phases789.css';
import './phase10.css';
import './ui-modernization.css';

initializePwaUpdateControl();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Application root element is missing.');
}

createRoot(rootElement).render(
  <StrictMode>
    <AppearanceProvider>
      <App />
    </AppearanceProvider>
  </StrictMode>
);
