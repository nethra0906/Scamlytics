import axios from "axios";

// Shared localStorage keys for the auth session.
export const TOKEN_KEY = "scamlytics_token";
export const ROLE_KEY = "scamlytics_role";
export const USER_KEY = "scamlytics_user";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
});

// ── Request: attach the JWT bearer token when present ─────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response: on 401 (expired/invalid token) clear the session and re-gate ────
// A 403 (authenticated but wrong role) is left for the calling page to surface.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err?.config?.url || "";
    const status = err?.response?.status;
    // Never self-logout on the login call itself — that would swallow the
    // "invalid credentials" message and cause a reload loop.
    if (status === 401 && !url.includes("/auth/")) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ROLE_KEY);
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new Event("scamlytics:logout"));
    }
    return Promise.reject(err);
  }
);

export default api;
