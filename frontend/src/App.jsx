import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { Shield, Activity, Map, MessageSquare, Monitor, LayoutDashboard } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import ScamChecker from "./pages/ScamChecker";
import CurrencyChecker from "./pages/CurrencyChecker";
import FraudGraph from "./pages/FraudGraph";
import GeoIntel from "./pages/GeoIntel";
import CitizenAssistant from "./pages/CitizenAssistant";
import { useRole } from "./RoleContext";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["Police", "Bank", "Citizen"] },
  { path: "/scam", label: "Scam Checker", icon: Shield, roles: ["Police", "Bank", "Citizen"] },
  { path: "/currency", label: "Currency Checker", icon: Activity, roles: ["Police", "Bank"] },
  { path: "/graph", label: "Fraud Graph", icon: Monitor, roles: ["Police"] },
  { path: "/geo", label: "Geo Intel", icon: Map, roles: ["Police"] },
  { path: "/assistant", label: "Citizen Assistant", icon: MessageSquare, roles: ["Citizen"] },
];

function NavLinks() {
  const { role } = useRole();
  const location = useLocation();

  return (
    <>
      {NAV_ITEMS.filter(item => item.roles.includes(role)).map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive 
                ? "bg-surface-elevated text-accent border border-surface-border shadow-sm" 
                : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated/50"
            }`}
          >
            <Icon size={16} />
            {item.label}
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

function App() {
  const { role, setRole } = useRole();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-surface-base flex flex-col">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-50 bg-surface-base/80 backdrop-blur-md border-b border-surface-border shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-sm bg-accent/20 border border-accent flex items-center justify-center text-accent">
                  <Shield size={20} />
                </div>
                <span className="font-sans font-bold text-lg tracking-tight">
                  DPS<span className="text-accent">.AI</span>
                </span>
              </div>

              {/* Desktop Nav */}
              <nav className="hidden md:flex gap-1 ml-10 flex-1">
                <NavLinks />
              </nav>

              {/* Role Selector */}
              <div className="flex items-center gap-3 ml-auto">
                <span className="text-xs text-text-muted font-mono uppercase tracking-wider hidden sm:inline-block">
                  Clearance Level:
                </span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="bg-surface-elevated border border-surface-border text-text-primary text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-accent font-mono transition-colors cursor-pointer"
                >
                  <option value="Police">POLICE_INTEL</option>
                  <option value="Bank">BANK_ANALYST</option>
                  <option value="Citizen">CITIZEN_PUBLIC</option>
                </select>
              </div>
            </div>
          </div>
          {/* Mobile Nav (horizontal scroll) */}
          <div className="md:hidden border-t border-surface-border overflow-x-auto">
            <nav className="flex px-4 py-2 gap-2 min-w-max">
              <NavLinks />
            </nav>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/scam" element={<RoleGuard allowedRoles={["Police", "Bank", "Citizen"]}><ScamChecker /></RoleGuard>} />
            <Route path="/currency" element={<RoleGuard allowedRoles={["Police", "Bank"]}><CurrencyChecker /></RoleGuard>} />
            <Route path="/graph" element={<RoleGuard allowedRoles={["Police"]}><FraudGraph /></RoleGuard>} />
            <Route path="/geo" element={<RoleGuard allowedRoles={["Police"]}><GeoIntel /></RoleGuard>} />
            <Route path="/assistant" element={<RoleGuard allowedRoles={["Citizen"]}><CitizenAssistant /></RoleGuard>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;