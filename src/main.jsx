import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// ─── Loader Safety Net ───────────────────────────────────────────────────────
// The #initial-loader has z-index:99999 and will block the app if React fails
// to mount. We add two layers of protection:
//   1. Remove it immediately after createRoot().render() resolves.
//   2. A hard 8-second fallback that destroys it no matter what.
const loader = document.getElementById('initial-loader');

const removeLoader = () => {
  if (loader && loader.parentNode) {
    loader.style.transition = 'opacity 0.3s ease';
    loader.style.opacity = '0';
    setTimeout(() => loader.remove(), 350);
  }
};

// Hard fallback — destroy loader after 8s even if JS errors out
const loaderKillTimer = setTimeout(removeLoader, 8000);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// Remove loader now that React has started rendering
clearTimeout(loaderKillTimer);
removeLoader();
