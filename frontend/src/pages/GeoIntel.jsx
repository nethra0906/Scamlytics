import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api";

export default function GeoIntel() {
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
      alert("Error: " + e.message);
    }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const center = points.length ? [points[0].lat, points[0].lng] : [22.9734, 78.6569];

  const riskColor = { HIGH: "#ef4444", MEDIUM: "#eab308", LOW: "#22c55e" };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Geospatial Crime Intelligence</h1>

      <button
        onClick={loadAll}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold mb-4"
      >
        {loading ? "Loading..." : "Refresh"}
      </button>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-[500px] rounded overflow-hidden border border-slate-700">
          <MapContainer center={center} zoom={5} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            {points.map((p, i) => (
              <CircleMarker key={i} center={[p.lat, p.lng]} radius={8} pathOptions={{ color: "#ef4444", fillOpacity: 0.6 }}>
                <Popup>{p.type} — {p.district}</Popup>
              </CircleMarker>
            ))}
            {hotspots.map((h, i) => (
              <CircleMarker
                key={"hs" + i}
                center={[h.center_lat, h.center_lng]}
                radius={20}
                pathOptions={{ color: riskColor[h.severity], fillOpacity: 0.15, weight: 2 }}
              >
                <Popup>Hotspot: {h.incident_count} incidents ({h.severity})</Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        <div>
          <h2 className="font-bold mb-2">District Risk</h2>
          <div className="space-y-2">
            {districtRisk.map((d) => (
              <div key={d.district} className="p-3 bg-slate-800 rounded border border-slate-700">
                <div className="flex justify-between">
                  <span className="font-semibold">{d.district}</span>
                  <span style={{ color: riskColor[d.risk_level] }} className="font-bold">{d.risk_level}</span>
                </div>
                <p className="text-sm text-slate-400">{d.incident_count} incidents · score {d.risk_score}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}