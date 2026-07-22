import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './RoleContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)

// ── Service Worker Registration ───────────────────────────────────────────────
// Only register in production builds. In dev the cache-first service worker
// serves a stale app shell and hides code changes behind old caches.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.info('[SW] Registered — scope:', reg.scope))
      .catch((err) => console.warn('[SW] Registration failed:', err));
  });
} else if (!import.meta.env.PROD && 'serviceWorker' in navigator) {
  // Dev safety: tear down any SW a previous prod/preview session installed.
  navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
}
