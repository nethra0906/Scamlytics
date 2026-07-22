import { useState } from "react";
import { motion } from "framer-motion";
import api from "../api";
import { Play, Terminal, AlertTriangle } from "lucide-react";
import { useToast } from "../ToastContext";
import { SectionLabel } from "../components/Editorial";

export default function FraudGraph() {
  const toast = useToast();
  const [clusters, setClusters] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [query, setQuery] = useState("MATCH (n:Suspicious) RETURN COUNT(n)");
  const [queryResult, setQueryResult] = useState("");

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const res = await api.get("/graph/analyze");
      setClusters(res.data.clusters || []);
      setStats({ nodes: res.data.total_nodes, edges: res.data.total_edges });
    } catch (e) {
      toast.error(e?.response?.data?.detail || e.message || "Graph analysis failed.", "Analysis Error");
    }
    setLoading(false);
  };

  const handleQuery = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/graph/query", { query });
      setQueryResult(res.data.result);
    } catch (e) {
      setQueryResult("Error: " + e.message);
    }
  };

  const suspiciousCount = clusters ? clusters.filter((c) => c.is_suspicious).length : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <SectionLabel>Module 03 - Fraud Graph</SectionLabel>
          <h1 className="display-serif text-4xl sm:text-5xl mt-5">Fraud Network Intelligence</h1>
          <p className="mt-4 max-w-lg text-text-secondary leading-relaxed">
            Multi-modal graph analysis linking phones, devices, and accounts to surface coordinated fraud rings.
          </p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="shrink-0 bg-accent text-white hover:bg-accent-hover px-6 py-2.5 rounded-md font-mono text-xs uppercase tracking-[0.2em] flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-surface-base border-t-transparent rounded-full animate-spin"></div> ANALYZING...</span>
          ) : (
            <><Play size={16} /> RUN GRAPH ANALYSIS</>
          )}
        </button>
      </header>

      {/* Query Console */}
      <div className="border border-surface-border rounded-lg overflow-hidden bg-surface-card/40">
        <div className="px-4 py-2.5 border-b border-surface-border flex items-center gap-2.5">
          <Terminal size={13} className="text-accent" />
          <span className="eyebrow">Query Console</span>
        </div>
        <div className="p-4">
          <form onSubmit={handleQuery} className="flex gap-2">
            <span className="text-accent font-mono pt-2">{">"}</span>
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent border-none text-text-primary font-mono text-sm focus:outline-none focus:ring-0"
              placeholder="Enter query..."
            />
            <button type="submit" className="text-xs font-mono bg-surface-elevated text-text-secondary hover:text-accent px-3 py-1 rounded border border-surface-border transition-colors">
              EXECUTE
            </button>
          </form>
          <p className="mt-2 ml-4 text-[10px] font-mono text-text-muted">
            Try: <span className="text-text-secondary">COUNT</span> ·{" "}
            <span className="text-text-secondary">SUSPICIOUS</span> ·{" "}
            <span className="text-text-secondary">HUBS</span> ·{" "}
            <span className="text-text-secondary">PHONE:&lt;number&gt;</span>
          </p>
          {queryResult && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 ml-4 pl-3 border-l-2 border-surface-border text-sm font-mono text-text-secondary">
              {queryResult}
            </motion.div>
          )}
        </div>
      </div>

      {stats && (
        <div>
          <SectionLabel>Network Overview</SectionLabel>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-px bg-surface-border border border-surface-border rounded-lg overflow-hidden">
            {[
              { k: "Total Nodes", v: stats.nodes },
              { k: "Total Edges", v: stats.edges },
              { k: "Clusters", v: clusters?.length ?? 0 },
              { k: "Suspicious", v: suspiciousCount, danger: true },
            ].map((t) => (
              <div key={t.k} className="bg-surface-base p-5">
                <p className="eyebrow">{t.k}</p>
                <p className={`numeral text-4xl mt-2 ${t.danger && t.v > 0 ? "text-alert-high" : "text-text-primary"}`}>{t.v}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {clusters && clusters.length > 0 && (
        <div>
        <SectionLabel>Detected Clusters</SectionLabel>
        <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clusters.map((c) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={c.cluster_id}
              className={`p-4 rounded-xl border relative overflow-hidden ${
                c.is_suspicious 
                  ? "border-alert-high/50 bg-alert-high-dim" 
                  : "border-surface-border bg-surface-card"
              }`}
            >
              {c.is_suspicious && (
                <div className="absolute top-0 right-0 p-3 opacity-20 text-alert-high">
                  <AlertTriangle size={64} />
                </div>
              )}
              <div className="relative z-10">
                <p className="font-mono font-bold text-sm mb-3 flex items-center gap-2">
                  CLUSTER #{c.cluster_id}
                  {c.is_suspicious && <span className="bg-alert-high text-white text-[10px] px-2 py-0.5 rounded-full">HIGH RISK</span>}
                </p>
                <ul className="space-y-1.5 text-sm font-mono text-text-secondary">
                  <li className="flex justify-between"><span>Phones</span> <span className="text-text-primary">{c.phone_count}</span></li>
                  <li className="flex justify-between"><span>Devices</span> <span className="text-text-primary">{c.device_count}</span></li>
                  <li className="flex justify-between"><span>Accounts</span> <span className="text-text-primary">{c.account_count}</span></li>
                  <li className="flex justify-between items-baseline border-t border-surface-border pt-2 mt-2">
                    <span>Total size</span> <span className="numeral text-2xl text-text-primary">{c.size}</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
        </div>
      )}

      {clusters && clusters.length > 0 && (
        <div>
          <SectionLabel>Network Graph</SectionLabel>
          <div className="mt-6 border border-surface-border rounded-lg p-1 overflow-hidden h-[600px] relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent-dim/20 via-transparent to-transparent pointer-events-none"></div>
            <iframe
              src={`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/graph/view`}
              title="fraud-graph"
              className="w-full h-full rounded-md"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}