import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import api, { TOKEN_KEY, ROLE_KEY, USER_KEY } from "./api";

const AuthContext = createContext(null);

// Backend roles are lowercase (police|bank|citizen); the UI uses capitalised
// labels (Police|Bank|Citizen) throughout, so normalise on the way in.
const cap = (r) => (r ? r.charAt(0).toUpperCase() + r.slice(1).toLowerCase() : r);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [role, setRole] = useState(() => localStorage.getItem(ROLE_KEY) || null);
  const [user, setUser] = useState(() => localStorage.getItem(USER_KEY) || null);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setRole(null);
    setUser(null);
  }, []);

  // The axios interceptor fires this when a request comes back 401.
  useEffect(() => {
    const onLogout = () => clearSession();
    window.addEventListener("scamlytics:logout", onLogout);
    return () => window.removeEventListener("scamlytics:logout", onLogout);
  }, [clearSession]);

  const login = useCallback(async (username, password) => {
    const res = await api.post("/auth/login", { username, password });
    const { access_token, role: backendRole } = res.data;
    const roleLabel = cap(backendRole);
    localStorage.setItem(TOKEN_KEY, access_token);
    localStorage.setItem(ROLE_KEY, roleLabel);
    localStorage.setItem(USER_KEY, username);
    setToken(access_token);
    setRole(roleLabel);
    setUser(username);
    return roleLabel;
  }, []);

  const logout = useCallback(() => clearSession(), [clearSession]);

  const value = { token, role, user, isAuthenticated: !!token, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

// Backward-compatible hook: pages that only need the current role keep working.
export function useRole() {
  const { role } = useAuth();
  return { role };
}
