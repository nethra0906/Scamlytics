import { useState } from "react";
import api from "../api";

export default function FraudGraph() {
  const [clusters, setClusters] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Fraud Network Intelligence</h1>

      <button
        onClick={runAnalysis}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold mb-4"
      >
        {loading ? "Analyzing..." : "Run Graph Analysis"}
      </button>

      {stats && (
        <p className="mb-4 text-slate-400">
          {stats.nodes} nodes, {stats.edges} edges detected.
        </p>
      )}

      {clusters && clusters.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {clusters.map((c) => (
            <div
              key={c.cluster_id}
              className={`p-3 rounded border ${c.is_suspicious ? "border-red-500 bg-red-950/30" : "border-slate-700 bg-slate-800"}`}
            >
              <p className="font-bold mb-1">
                Cluster #{c.cluster_id} {c.is_suspicious && <span className="text-red-400">⚠ SUSPICIOUS</span>}
              </p>
              <p className="text-sm text-slate-400">
                {c.phone_count} phones, {c.device_count} devices, {c.account_count} accounts (size {c.size})
              </p>
            </div>
          ))}
        </div>
      )}

      {clusters && clusters.length > 0 && (
        <iframe
          src="http://127.0.0.1:8000/graph/view"
          title="fraud-graph"
          className="w-full h-[600px] rounded border border-slate-700"
        />
      )}
    </div>
  );
}