import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api";
import { Map, RefreshCw, AlertTriangle, Crosshair, MapPin } from "lucide-react";
import { useToast } from "../ToastContext";

export default function GeoIntel() {
  const toast = useToast();
  const [points, setPoints] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [districtRisk, setDistrictRisk] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ptRes, hsRes, drRes] = await Promise.all([
        api.get("/geo/heatmap"),
        api.get("/geo/hotspots"),
        api.get("/geo/district-risk"),
      ]);
      setPoints(ptRes.data);
      setHotspots(hsRes.data);
      setDistrictRisk(drRes.data);
    } catch (e) {
      toast.error(e?.response?.data?.detail || e.message || "Failed to load geo intelligence data.", "Sync Error");
    }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const center = points.length ? [points[0].lat, points[0].lng] : [22.9734, 78.6569];

  const riskColor = { 
    HIGH: "var(--color-alert-high)", 
    MEDIUM: "var(--color-accent)", 
    LOW: "var(--color-alert-low)" 
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
            <Map className="text-accent" /> Geospatial Crime Intelligence
          </h1>
          <p className="text-text-secondary mt-1">Real-time mapping of fraud hotzones and incident clustering.</p>
        </div>
        <button
          onClick={loadAll}
          disabled={loading}
          className="bg-surface-card border border-surface-border text-text-primary hover:text-accent px-6 py-2.5 rounded-md font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
        >
          <RefreshCw size={16} className={loading ? "animate-spin text-accent" : ""} /> 
          {loading ? "SYNCING..." : "SYNC INTEL"}
        </button>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map Column */}
        <div className="lg:col-span-2 h-[600px] rounded-xl overflow-hidden border border-surface-border relative shadow-lg bg-surface-card">
          <div className="absolute top-4 left-4 z-[400] bg-surface-base/80 backdrop-blur border border-surface-border px-3 py-2 rounded flex items-center gap-2 font-mono text-xs text-text-primary">
            <Crosshair size={14} className="text-accent" /> LIVE SATELLITE TRACKING
          </div>
          
          <MapContainer center={center} zoom={5} style={{ height: "100%", width: "100%", background: "#0a0f16" }} zoomControl={false}>
            {/* Dark mode tiles */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            
            {/* Raw Incidents */}
            {points.map((p, i) => (
              <CircleMarker 
                key={i} 
                center={[p.lat, p.lng]} 
                radius={6} 
                pathOptions={{ color: "var(--color-alert-high)", fillColor: "var(--color-alert-high)", fillOpacity: 0.8, weight: 1 }}
              >
                <Popup className="custom-popup">
                  <div className="font-mono text-xs p-1">
                    <p className="font-bold text-text-primary mb-1 border-b border-surface-border pb-1">INCIDENT REPORT</p>
                    <p><span className="text-text-muted">Type:</span> {p.type.toUpperCase()}</p>
                    <p><span className="text-text-muted">Loc:</span> {p.district.toUpperCase()}</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
            
            {/* Hotzones */}
            {hotspots.map((h, i) => (
              <CircleMarker
                key={"hs" + i}
                center={[h.center_lat, h.center_lng]}
                radius={24}
                pathOptions={{ 
                  color: riskColor[h.severity], 
                  fillColor: riskColor[h.severity],
                  fillOpacity: 0.15, 
                  weight: 2,
                  dashArray: "4 4"
                }}
              >
                <Popup>
                  <div className="font-mono text-xs p-1 text-center">
                    <AlertTriangle size={24} className="mx-auto mb-2" style={{ color: riskColor[h.severity] }} />
                    <p className="font-bold text-text-primary">HOTZONE DETECTED</p>
                    <p className="mt-1"><span className="text-text-muted">Incidents:</span> <span className="font-bold">{h.incident_count}</span></p>
                    <p><span className="text-text-muted">Severity:</span> <span className="font-bold" style={{ color: riskColor[h.severity] }}>{h.severity}</span></p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* Intelligence Sidebar Column */}
        <div className="flex flex-col h-[600px]">
          <div className="bg-surface-base border-b border-surface-border p-4 flex items-center justify-between">
            <h2 className="font-mono font-bold text-sm flex items-center gap-2">
              <MapPin size={16} className="text-accent" /> DISTRICT RISK MATRIX
            </h2>
            <span className="text-[10px] font-mono text-text-muted bg-surface-elevated px-2 py-1 rounded">
              {districtRisk.length} ZONES
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-surface-card border-x border-b border-surface-border rounded-b-xl p-4 space-y-3 custom-scrollbar">
            <AnimatePresence>
              {districtRisk.length === 0 && !loading && (
                <div className="text-center text-text-muted font-mono text-sm py-10">
                  NO INTEL DATA AVAILABLE
                </div>
              )}
              
              {districtRisk.map((d, index) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={d.district} 
                  className="p-4 bg-surface-elevated rounded-lg border border-surface-border relative overflow-hidden group hover:border-accent/50 transition-colors"
                >
                  {/* Background risk indicator */}
                  <div 
                    className="absolute top-0 bottom-0 left-0 w-1" 
                    style={{ backgroundColor: riskColor[d.risk_level] }} 
                  />
                  
                  <div className="flex justify-between items-start ml-2">
                    <div>
                      <span className="font-bold font-mono text-text-primary block">{d.district.toUpperCase()}</span>
                      <span className="text-xs text-text-secondary mt-1 block">
                        {d.incident_count} Active Incidents
                      </span>
                    </div>
                    <div className="text-right">
                      <span 
                        style={{ color: riskColor[d.risk_level], backgroundColor: `${riskColor[d.risk_level]}20` }} 
                        className="font-mono text-[10px] font-bold px-2 py-1 rounded-full uppercase"
                      >
                        {d.risk_level} RISK
                      </span>
                      <div className="text-xs font-mono text-text-muted mt-2">
                        {/* backend already returns risk_score on a 0–100 scale */}
                        SCORE: <span className="text-text-primary font-bold">{d.risk_score.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}