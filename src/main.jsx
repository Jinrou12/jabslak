import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Remove the static HTML preloader before React mounts
// (it has z-index:99999 and would permanently block the app otherwise)
const loader = document.getElementById('initial-loader');
if (loader) loader.remove();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
