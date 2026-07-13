import { useState } from "react";
import { motion } from "framer-motion";
import api from "../api";
import { Network, Play, Terminal, AlertTriangle, ChevronRight } from "lucide-react";

export default function FraudGraph() {
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
      alert("Error: " + e.message);
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Network className="text-accent" /> Fraud Network Intelligence
          </h1>
          <p className="text-text-secondary mt-1">Multi-modal graph analysis of devices, phones, and accounts.</p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="bg-accent text-surface-base hover:bg-accent-hover px-6 py-2.5 rounded-md font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-surface-base border-t-transparent rounded-full animate-spin"></div> ANALYZING...</span>
          ) : (
            <><Play size={16} /> RUN GRAPH ANALYSIS</>
          )}
        </button>
      </header>

      {/* Query Terminal */}
      <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden shadow-sm">
        <div className="bg-surface-base/80 px-4 py-2 border-b border-surface-border flex items-center gap-2">
          <Terminal size={14} className="text-text-muted" />
          <span className="text-xs font-mono text-text-muted">CYPHER QUERY CONSOLE</span>
        </div>
        <div className="p-4 bg-[#0a0f16]">
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
          {queryResult && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 ml-4 pl-3 border-l-2 border-surface-border text-sm font-mono text-text-secondary">
              {queryResult}
            </motion.div>
          )}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-card border border-surface-border rounded-lg p-4">
            <p className="text-xs font-mono text-text-muted">TOTAL NODES</p>
            <p className="text-2xl font-mono text-text-primary mt-1">{stats.nodes}</p>
          </div>
          <div className="bg-surface-card border border-surface-border rounded-lg p-4">
            <p className="text-xs font-mono text-text-muted">TOTAL EDGES</p>
            <p className="text-2xl font-mono text-text-primary mt-1">{stats.edges}</p>
          </div>
        </div>
      )}

      {clusters && clusters.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <ul className="space-y-1 text-sm font-mono text-text-secondary">
                  <li className="flex justify-between"><span>Phones:</span> <span className="text-text-primary">{c.phone_count}</span></li>
                  <li className="flex justify-between"><span>Devices:</span> <span className="text-text-primary">{c.device_count}</span></li>
                  <li className="flex justify-between"><span>Accounts:</span> <span className="text-text-primary">{c.account_count}</span></li>
                  <li className="flex justify-between border-t border-surface-border pt-1 mt-1">
                    <span>Total Size:</span> <span className="text-text-primary font-bold">{c.size}</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {clusters && clusters.length > 0 && (
        <div className="bg-surface-card border border-surface-border rounded-xl p-1 overflow-hidden h-[600px] relative shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent-dim/20 via-transparent to-transparent pointer-events-none"></div>
          <iframe
            src="http://127.0.0.1:8000/graph/view"
            title="fraud-graph"
            className="w-full h-full rounded-lg"
          />
        </div>
      )}
    </motion.div>
  );
}