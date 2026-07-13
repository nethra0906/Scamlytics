import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api";
import { ShieldAlert, Banknote, Network, MapPin, MessageCircle, Activity, ChevronRight } from "lucide-react";
import { useRole } from "../RoleContext";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const { role } = useRole();

  useEffect(() => {
    api.get("/dashboard/stats").then((res) => setStats(res.data)).catch(() => {});
  }, []);

  const allCards = [
    {
      title: "Scam Detection", icon: ShieldAlert, path: "/scam", 
      roles: ["Police", "Bank", "Citizen"],
      value: stats?.scam_module.total_checks ?? "-",
      sub: `${stats?.scam_module.high_risk_count ?? 0} HIGH RISK`,
      colorClass: "text-alert-high", bgClass: "bg-alert-high-dim"
    },
    {
      title: "Currency Intelligence", icon: Banknote, path: "/currency", 
      roles: ["Police", "Bank"],
      value: stats?.currency_module.total_checks ?? "-",
      sub: `${stats?.currency_module.counterfeit_count ?? 0} COUNTERFEIT`,
      colorClass: "text-accent", bgClass: "bg-accent-dim"
    },
    {
      title: "Fraud Graph", icon: Network, path: "/graph", 
      roles: ["Police"],
      value: stats?.graph_module.total_transactions_ingested ?? "-",
      sub: "TRANSACTIONS",
      colorClass: "text-alert-low", bgClass: "bg-alert-low-dim"
    },
    {
      title: "Geo Intelligence", icon: MapPin, path: "/geo", 
      roles: ["Police"],
      value: stats?.geo_module.total_incidents ?? "-",
      sub: "MAPPED INCIDENTS",
      colorClass: "text-text-primary", bgClass: "bg-surface-elevated"
    },
    {
      title: "Citizen Assistant", icon: MessageCircle, path: "/assistant", 
      roles: ["Citizen"],
      value: "ACTIVE", sub: "24/7 SUPPORT",
      colorClass: "text-accent", bgClass: "bg-accent-dim"
    },
  ];

  const visibleCards = allCards.filter(c => c.roles.includes(role));

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-xl bg-surface-card border border-surface-border p-8 sm:p-12"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Activity size={200} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-mono font-medium rounded-full bg-accent-dim text-accent border border-accent/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            SYSTEM ONLINE
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl mb-4 font-bold tracking-tighter">
            Scam<span className="text-accent">lytics</span>
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed">
            Unified intelligence platform for multi-agency threat detection. 
            Monitoring scam vectors, counterfeit currency distribution, fraud networks, and geospatial risk.
          </p>
        </div>
      </motion.div>

      {/* Module Grid */}
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        {visibleCards.map((c) => (
          <motion.div key={c.title} variants={itemVariants}>
            <Link
              to={c.path}
              className="group block relative overflow-hidden bg-surface-card border border-surface-border rounded-xl p-6 hover:border-accent transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,159,10,0.1)] hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-8">
                <div className={`p-3 rounded-lg ${c.bgClass} ${c.colorClass}`}>
                  <c.icon size={24} />
                </div>
                <ChevronRight className="text-text-muted group-hover:text-accent transition-colors" />
              </div>
              <div>
                <div className="text-3xl font-mono font-bold text-text-primary mb-1">{c.value}</div>
                <h3 className="text-sm font-sans font-medium text-text-secondary">{c.title}</h3>
                <p className="text-xs font-mono mt-2 text-text-muted">{c.sub}</p>
              </div>
              {/* Decorative scanline on hover */}
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-accent scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Activity (visible mainly to Police/Bank) */}
      {stats && (role === "Police" || role === "Bank") && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid lg:grid-cols-2 gap-6"
        >
          <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
            <div className="border-b border-surface-border p-4 bg-surface-base/50">
              <h2 className="text-sm font-mono text-text-secondary uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert size={14} /> Recent Scam Intercepts
              </h2>
            </div>
            <div className="p-4">
              {stats.recent_activity.scams.map((s) => (
                <div key={s.id} className="flex justify-between items-center text-sm py-3 border-b border-surface-border last:border-0">
                  <span className="font-mono text-text-primary">{s.channel}</span>
                  <span className={`px-2 py-1 rounded text-xs font-mono font-medium ${
                    s.risk_level === "HIGH" ? "bg-alert-high-dim text-alert-high border border-alert-high/30" : 
                    s.risk_level === "MEDIUM" ? "bg-accent-dim text-accent border border-accent/30" : 
                    "bg-alert-low-dim text-alert-low border border-alert-low/30"
                  }`}>
                    {s.risk_level}
                  </span>
                </div>
              ))}
              {stats.recent_activity.scams.length === 0 && <p className="text-text-muted text-sm font-mono py-2">NO RECENT DATA</p>}
            </div>
          </div>

          <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
            <div className="border-b border-surface-border p-4 bg-surface-base/50">
              <h2 className="text-sm font-mono text-text-secondary uppercase tracking-wider flex items-center gap-2">
                <Banknote size={14} /> Currency Scans
              </h2>
            </div>
            <div className="p-4">
              {stats.recent_activity.currency.map((c) => (
                <div key={c.id} className="flex justify-between items-center text-sm py-3 border-b border-surface-border last:border-0">
                  <span className="font-mono text-text-primary">{c.verdict}</span>
                  <span className="font-mono text-text-muted">{(c.confidence * 100).toFixed(0)}% CONFIDENCE</span>
                </div>
              ))}
              {stats.recent_activity.currency.length === 0 && <p className="text-text-muted text-sm font-mono py-2">NO RECENT DATA</p>}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}