import { StrictMode, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

import AuthWrapper from './components/AuthWrapper'

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    createElement(StrictMode, null, 
      createElement(AuthWrapper, null, 
        createElement(App, null)
      )
    )
  );
}
