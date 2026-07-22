import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useRole, useAuth } from "./RoleContext";
import { ToastProvider } from "./ToastContext";
import { SkeletonPage } from "./components/Skeleton";
import Starfield from "./components/Starfield";
import { Diamond } from "./components/Editorial";
import Login from "./pages/Login";

// ── Code-split page components ────────────────────────────────────────────────
const Dashboard        = lazy(() => import("./pages/Dashboard"));
const ScamChecker      = lazy(() => import("./pages/ScamChecker"));
const CurrencyChecker  = lazy(() => import("./pages/CurrencyChecker"));
const FraudGraph       = lazy(() => import("./pages/FraudGraph"));
const GeoIntel         = lazy(() => import("./pages/GeoIntel"));
const CitizenAssistant = lazy(() => import("./pages/CitizenAssistant"));

// ── Nav config ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { path: "/",          label: "Dashboard",         roles: ["Police", "Bank", "Citizen"] },
  { path: "/scam",      label: "Scam Checker",      roles: ["Police", "Bank", "Citizen"] },
  { path: "/currency",  label: "Currency Checker",  roles: ["Police", "Bank"] },
  { path: "/graph",     label: "Fraud Graph",       roles: ["Police"] },
  { path: "/geo",       label: "Geo Intel",         roles: ["Police"] },
  { path: "/assistant", label: "Citizen Assistant", roles: ["Citizen"] },
];

// Stylised DNA-helix wordmark glyph (stacked hairlines forming a spindle).
function HelixMark({ size = 22, className = "" }) {
  const rows = [10, 15, 9, 5, 9, 15, 10];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      {rows.map((w, i) => (
        <line
          key={i}
          x1={12 - w / 2} x2={12 + w / 2}
          y1={3 + i * 3} y2={3 + i * 3}
          stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

function Wordmark({ className = "" }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <HelixMark size={22} className="text-accent" />
      <span className="text-sm font-medium tracking-[0.28em] uppercase text-text-primary font-sans">
        Scamlytics
      </span>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NavLinks({ onNavigate }) {
  const { role } = useRole();
  const location = useLocation();

  return (
    <>
      {NAV_ITEMS.filter((item) => item.roles.includes(role)).map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={`group relative py-1 text-[11px] font-mono uppercase tracking-[0.12em] whitespace-nowrap transition-colors ${
              isActive ? "text-accent" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {item.label}
            <span
              className={`absolute -bottom-0.5 left-0 h-px bg-accent transition-all duration-300 ${
                isActive ? "w-full" : "w-0 group-hover:w-full"
              }`}
            />
          </Link>
        );
      })}
    </>
  );
}

function RoleGuard({ allowedRoles, children }) {
  const { role } = useRole();
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function Footer() {
  const { role } = useAuth();
  const items = NAV_ITEMS.filter((i) => i.roles.includes(role));
  return (
    <footer className="mt-24 border-t border-surface-border bg-surface-deep">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
          <div className="max-w-xs">
            <Wordmark />
            <p className="mt-4 text-sm text-text-secondary leading-relaxed">
              Proactive intelligence against digital-arrest scams, counterfeit
              currency, and fraud networks.
            </p>
          </div>
          <div>
            <p className="eyebrow mb-4">Modules</p>
            <ul className="grid grid-cols-2 gap-x-10 gap-y-2.5">
              {items.map((i) => (
                <li key={i.path}>
                  <Link to={i.path} className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-surface-border flex flex-col sm:flex-row justify-between gap-3 text-[10px] font-mono uppercase tracking-[0.2em] text-text-muted">
          <span>© 2026 Scamlytics — Hackathon Build</span>
          <span>AI for Digital Public Safety</span>
        </div>
      </div>
    </footer>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthGate />
      </ToastProvider>
    </BrowserRouter>
  );
}

// Gate the whole app behind authentication. Unauthenticated users see the login screen.
function AuthGate() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Login />;
  return <AppShell />;
}

function AppShell() {
  const { role, user, logout } = useAuth();

  return (
    <>
      <Starfield />
      <div className="min-h-screen flex flex-col">
        {/* Top bar — minimal editorial */}
        <header className="sticky top-0 z-50 backdrop-blur-md bg-surface-base/70 border-b border-surface-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 gap-6">
              <Link to="/"><Wordmark /></Link>

              <nav className="hidden md:flex items-center gap-5 lg:gap-7 ml-auto">
                <NavLinks />
              </nav>

              <div className="flex items-center gap-4 md:pl-7 md:border-l border-surface-border">
                <div className="hidden sm:flex flex-col items-end leading-tight">
                  <span className="text-xs text-text-primary tracking-wide">{user}</span>
                  <span className="text-[9px] text-accent font-mono uppercase tracking-[0.2em]">
                    {role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="text-text-muted hover:text-alert-high transition-colors"
                >
                  <LogOut size={16} />
                </button>
                <Diamond size={12} className="hidden lg:inline-block" />
              </div>
            </div>
          </div>
          {/* Mobile nav */}
          <div className="md:hidden border-t border-surface-border overflow-x-auto">
            <nav className="flex px-4 py-3 gap-6 min-w-max">
              <NavLinks />
            </nav>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <Suspense fallback={<SkeletonPage />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/scam" element={<RoleGuard allowedRoles={["Police", "Bank", "Citizen"]}><ScamChecker /></RoleGuard>} />
              <Route path="/currency" element={<RoleGuard allowedRoles={["Police", "Bank"]}><CurrencyChecker /></RoleGuard>} />
              <Route path="/graph" element={<RoleGuard allowedRoles={["Police"]}><FraudGraph /></RoleGuard>} />
              <Route path="/geo" element={<RoleGuard allowedRoles={["Police"]}><GeoIntel /></RoleGuard>} />
              <Route path="/assistant" element={<RoleGuard allowedRoles={["Citizen"]}><CitizenAssistant /></RoleGuard>} />
            </Routes>
          </Suspense>
        </main>

        <Footer />
      </div>
    </>
  );
}

export default App;
