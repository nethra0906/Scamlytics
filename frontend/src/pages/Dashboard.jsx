import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api";
import { ArrowUpRight } from "lucide-react";
import { useAuth } from "../RoleContext";
import { useToast } from "../ToastContext";
import { SectionLabel, StatRing } from "../components/Editorial";
import { SkeletonStat, SkeletonCard } from "../components/Skeleton";

const MODULES = [
  { title: "Scam Detection",       path: "/scam",      roles: ["Police", "Bank", "Citizen"], desc: "Flag coercion & impersonation across call and message transcripts." },
  { title: "Currency Intelligence", path: "/currency",  roles: ["Police", "Bank"],            desc: "Computer-vision verification of counterfeit currency notes." },
  { title: "Fraud Graph",          path: "/graph",     roles: ["Police"],                    desc: "Map fraud rings across phones, devices and bank accounts." },
  { title: "Geo Intelligence",     path: "/geo",       roles: ["Police"],                    desc: "District-level hotspot detection and risk scoring." },
  { title: "Citizen Assistant",    path: "/assistant", roles: ["Citizen"],                   desc: "Multilingual, guided fraud-reporting copilot." },
];

const ratio = (a, b) => (b ? Math.min(a / b, 1) : 0);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();
  const toast = useToast();

  useEffect(() => {
    // loading defaults to true; fetch once on mount
    api.get("/dashboard/stats")
      .then((res) => setStats(res.data))
      .catch((err) =>
        toast.error(err?.response?.data?.detail || err.message || "Failed to load statistics.", "Dashboard Error")
      )
      .finally(() => setLoading(false));
  }, []);

  const s = stats;
  const scamChecks = s?.scam_module.total_checks ?? 0;

  // Rings blend LIVE operational counts with always-meaningful capability
  // stats, so the dashboard advertises the platform even before any data.
  const ringsByRole = {
    Police: [
      { value: scamChecks, label: "Threat transcripts analysed to date", arc: ratio(s?.scam_module.high_risk_count, scamChecks), accent: true },
      { value: s?.graph_module.total_transactions_ingested ?? 0, label: "Entities linked in the fraud graph", arc: 0.28 },
      { value: "5", label: "Intelligence modules online", arc: 1 },
      { value: "24/7", label: "Continuous threat monitoring", arc: 0.75, accent: true },
    ],
    Bank: [
      { value: scamChecks, label: "Threat transcripts analysed to date", arc: ratio(s?.scam_module.high_risk_count, scamChecks), accent: true },
      { value: s?.currency_module.total_checks ?? 0, label: "Currency notes verified", arc: ratio(s?.currency_module.counterfeit_count, s?.currency_module.total_checks) },
      { value: "4", label: "Detection vectors covered", arc: 1 },
      { value: "24/7", label: "Continuous monitoring", arc: 0.75, accent: true },
    ],
    Citizen: [
      { value: scamChecks, label: "Suspicious messages checked", arc: 0.4, accent: true },
      { value: "6+", label: "Indian languages supported", arc: 0.6 },
      { value: "1930", label: "National cybercrime helpline", arc: 1, accent: true },
      { value: "24/7", label: "Assistant always available", arc: 0.75 },
    ],
  };
  const rings = ringsByRole[role] || ringsByRole.Citizen;

  const modules = MODULES.filter((m) => m.roles.includes(role));
  const showRecent = role === "Police" || role === "Bank";

  return (
    <div className="space-y-24">
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="pt-6"
      >
        <SectionLabel>Command Center</SectionLabel>
        <h1 className="display-serif text-5xl sm:text-6xl lg:text-7xl mt-7 max-w-4xl">
          Proactive intelligence for<br className="hidden sm:block" /> digital public safety
        </h1>
        <p className="mt-7 max-w-xl text-text-secondary leading-relaxed">
          One command center tracking scam vectors, counterfeit currency,
          fraud networks and geospatial risk, shifting response from reactive
          investigation to real-time detection.
        </p>
      </motion.section>

      {/* ── Stat rings ───────────────────────────────────────────────────────── */}
      <section>
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: rings.length || 4 }).map((_, i) => <SkeletonStat key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-14 justify-items-center">
            {rings.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
              >
                <StatRing value={r.value} label={r.label} arc={r.arc} accentValue={r.accent} delay={0.2 + i * 0.08} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ── Modules (editorial list) ─────────────────────────────────────────── */}
      <section>
        <SectionLabel>Modules</SectionLabel>
        <div className="mt-8 border-t border-surface-border">
          {modules.map((m) => (
            <Link
              key={m.path}
              to={m.path}
              className="group flex items-center justify-between gap-6 py-7 border-b border-surface-border transition-colors hover:bg-surface-card/40 -mx-4 px-4"
            >
              <div className="flex items-baseline gap-6">
                <span className="hidden sm:block numeral text-accent/70 text-lg w-8">
                  {String(modules.indexOf(m) + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-2xl sm:text-3xl text-text-primary group-hover:text-accent transition-colors">
                    {m.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-text-secondary max-w-md">{m.desc}</p>
                </div>
              </div>
              <ArrowUpRight
                size={22}
                className="shrink-0 text-text-muted group-hover:text-accent group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* ── Recent activity ──────────────────────────────────────────────────── */}
      {showRecent && (
        loading ? (
          <div className="grid lg:grid-cols-2 gap-10">
            <SkeletonCard rows={5} /><SkeletonCard rows={5} />
          </div>
        ) : (
          stats && (
            <section className="grid lg:grid-cols-2 gap-12">
              <div>
                <SectionLabel>Recent Scam Intercepts</SectionLabel>
                <div className="mt-6 border-t border-surface-border">
                  {stats.recent_activity.scams.map((sc) => (
                    <div key={sc.id} className="flex justify-between items-center py-3.5 border-b border-surface-border">
                      <span className="text-sm text-text-secondary capitalize">{sc.channel}</span>
                      <span
                        className={`text-[10px] font-mono uppercase tracking-[0.15em] px-2.5 py-1 rounded-full ${
                          sc.risk_level === "HIGH"   ? "bg-alert-high-dim text-alert-high"
                        : sc.risk_level === "MEDIUM" ? "bg-alert-med-dim text-alert-med"
                        : "bg-alert-low-dim text-alert-low"
                        }`}
                      >
                        {sc.risk_level}
                      </span>
                    </div>
                  ))}
                  {stats.recent_activity.scams.length === 0 && (
                    <p className="text-sm text-text-muted py-4">No recent data.</p>
                  )}
                </div>
              </div>

              <div>
                <SectionLabel>Currency Scans</SectionLabel>
                <div className="mt-6 border-t border-surface-border">
                  {stats.recent_activity.currency.map((c) => (
                    <div key={c.id} className="flex justify-between items-center py-3.5 border-b border-surface-border">
                      <span className="text-sm text-text-secondary capitalize">{c.verdict}</span>
                      <span className="text-sm text-text-muted numeral">{(c.confidence * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                  {stats.recent_activity.currency.length === 0 && (
                    <p className="text-sm text-text-muted py-4">No recent data.</p>
                  )}
                </div>
              </div>
            </section>
          )
        )
      )}
    </div>
  );
}
