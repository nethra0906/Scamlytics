import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ScamChecker from "./pages/ScamChecker";
import CurrencyChecker from "./pages/CurrencyChecker";
import FraudGraph from "./pages/FraudGraph";
import GeoIntel from "./pages/GeoIntel";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <nav className="flex gap-6 p-4 bg-slate-800 border-b border-slate-700 flex-wrap">
          <Link to="/" className="font-bold text-blue-400">SafetyAI</Link>
          <Link to="/scam">Scam Checker</Link>
          <Link to="/currency">Currency Checker</Link>
          <Link to="/graph">Fraud Graph</Link>
          <Link to="/geo">Geo Intel</Link>
        </nav>
        <div className="p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/scam" element={<ScamChecker />} />
            <Route path="/currency" element={<CurrencyChecker />} />
            <Route path="/graph" element={<FraudGraph />} />
            <Route path="/geo" element={<GeoIntel />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;