import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { ShieldAlert, Banknote, Network, MapPin, MessageCircle } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/dashboard/stats").then((res) => setStats(res.data)).catch(() => {});
  }, []);

  const cards = [
    {
      title: "Scam Detection", icon: ShieldAlert, path: "/scam", color: "text-red-400",
      value: stats?.scam_module.total_checks ?? "-",
      sub: `${stats?.scam_module.high_risk_count ?? 0} high risk flagged`,
    },
    {
      title: "Currency Checks", icon: Banknote, path: "/currency", color: "text-green-400",
      value: stats?.currency_module.total_checks ?? "-",
      sub: `${stats?.currency_module.counterfeit_count ?? 0} counterfeit detected`,
    },
    {
      title: "Fraud Graph", icon: Network, path: "/graph", color: "text-purple-400",
      value: stats?.graph_module.total_transactions_ingested ?? "-",
      sub: "transactions ingested",
    },
    {
      title: "Geo Intelligence", icon: MapPin, path: "/geo", color: "text-yellow-400",
      value: stats?.geo_module.total_incidents ?? "-",
      sub: "incidents mapped",
    },
    {
      title: "Citizen Assistant", icon: MessageCircle, path: "/assistant", color: "text-blue-400",
      value: "24/7", sub: "multilingual support",
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-1">Digital Public Safety AI</h1>
      <p className="text-slate-400 mb-6">Unified intelligence platform — scam detection, counterfeit currency, fraud networks, geospatial risk, citizen support.</p>

      <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((c) => (
          <Link
            to={c.path}
            key={c.title}
            className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-blue-500 transition"
          >
            <c.icon className={`${c.color} mb-2`} size={28} />
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-sm text-slate-300">{c.title}</p>
            <p className="text-xs text-slate-500">{c.sub}</p>
          </Link>
        ))}
      </div>

      {stats && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
            <h2 className="font-bold mb-3">Recent Scam Checks</h2>
            {stats.recent_activity.scams.map((s) => (
              <div key={s.id} className="flex justify-between text-sm py-1 border-b border-slate-700">
                <span>{s.channel}</span>
                <span className={s.risk_level === "HIGH" ? "text-red-400" : s.risk_level === "MEDIUM" ? "text-yellow-400" : "text-green-400"}>
                  {s.risk_level}
                </span>
              </div>
            ))}
            {stats.recent_activity.scams.length === 0 && <p className="text-slate-500 text-sm">No checks yet.</p>}
          </div>

          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
            <h2 className="font-bold mb-3">Recent Currency Checks</h2>
            {stats.recent_activity.currency.map((c) => (
              <div key={c.id} className="flex justify-between text-sm py-1 border-b border-slate-700">
                <span>{c.verdict}</span>
                <span>{(c.confidence * 100).toFixed(0)}%</span>
              </div>
            ))}
            {stats.recent_activity.currency.length === 0 && <p className="text-slate-500 text-sm">No checks yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}