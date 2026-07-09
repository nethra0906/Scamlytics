import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ScamChecker from "./pages/ScamChecker";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <nav className="flex gap-6 p-4 bg-slate-800 border-b border-slate-700">
          <Link to="/" className="font-bold text-blue-400">SafetyAI</Link>
          <Link to="/scam">Scam Checker</Link>
        </nav>
        <div className="p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/scam" element={<ScamChecker />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;