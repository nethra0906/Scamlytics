import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import { ScanSearch, Upload, CheckCircle, AlertOctagon, Download, Cpu, Layers } from "lucide-react";
import { useRole } from "../RoleContext";

export default function CurrencyChecker() {
  const { role } = useRole();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setResult(null);
    }
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/currency/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
    } catch (e) {
      alert("Error: " + e.message);
    }
    setLoading(false);
  };

  const handleGenerateReport = async () => {
    if (!result || !result.id) return;
    setGeneratingReport(true);
    try {
      const res = await api.post(`/currency/report/${result.id}`, {}, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `NCRB_CURRENCY_${result.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert("Error generating report: " + e.message);
    }
    setGeneratingReport(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="flex flex-col items-center text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
          <ScanSearch className="text-accent" /> Counterfeit Intelligence
        </h1>
        <p className="text-text-secondary mt-1">Heuristic and CNN ensemble analysis of physical currency.</p>
      </header>

      <div className={`grid gap-6 items-start ${result && !result.error ? 'md:grid-cols-2' : 'max-w-xl mx-auto w-full'}`}>
        {/* Upload Column */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-6 shadow-sm space-y-4">
          <div 
            onClick={() => !loading && fileInputRef.current?.click()}
            className={`w-full relative overflow-hidden border-2 ${preview ? 'border-surface-border' : 'border-dashed border-surface-border hover:border-accent/50'} rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#0a0f16] ${!preview ? 'h-64' : 'min-h-[16rem]'}`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFile} 
              accept="image/*" 
              className="hidden" 
              disabled={loading}
            />
            
            {preview ? (
              <div className="relative w-full h-full">
                <img src={preview} alt="preview" className={`w-full h-auto object-contain ${loading ? 'opacity-50' : ''}`} />
                {loading && (
                  <motion.div 
                    initial={{ top: "0%" }}
                    animate={{ top: "100%" }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-1 bg-accent shadow-[0_0_15px_3px_var(--color-accent)] z-10"
                  />
                )}
              </div>
            ) : (
              <>
                <Upload className="text-text-muted mb-3" size={32} />
                <p className="font-mono text-sm text-text-secondary">Select Currency Scan (.jpg, .png)</p>
              </>
            )}
          </div>

          <button
            onClick={analyze}
            disabled={loading || !file}
            className="w-full bg-accent text-surface-base hover:bg-accent-hover py-3 rounded-md font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? <><div className="w-4 h-4 border-2 border-surface-base border-t-transparent rounded-full animate-spin"></div> SCANNING...</> : "ANALYZE CURRENCY"}
          </button>
        </div>

        {/* Results Column */}
        <AnimatePresence mode="wait">
          {result && !result.error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={`bg-surface-card border rounded-xl p-6 shadow-lg relative overflow-hidden ${
                result.verdict === "genuine" ? "border-alert-low/50" : "border-alert-high/50 bg-alert-high-dim"
              }`}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xs font-mono text-text-muted tracking-wider uppercase mb-1">ANALYSIS VERDICT</h2>
                  <div className={`text-3xl font-mono font-bold flex items-center gap-2 ${result.verdict === "genuine" ? "text-alert-low" : "text-alert-high"}`}>
                    {result.verdict === "genuine" ? <CheckCircle size={28} /> : <AlertOctagon size={28} />}
                    {result.verdict.toUpperCase()}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono text-text-muted uppercase mb-1">CONFIDENCE</p>
                  <p className="text-2xl font-mono font-bold text-text-primary">{(result.confidence * 100).toFixed(1)}%</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm font-mono">
                  {Object.entries(result.sub_scores).map(([k, v]) => (
                    <div key={k} className="bg-surface-elevated p-3 rounded-md border border-surface-border">
                      <p className="text-text-muted text-[10px] uppercase mb-1">{k.replaceAll("_", " ")}</p>
                      <p className="text-text-primary font-bold">{(v * 100).toFixed(0)}%</p>
                    </div>
                  ))}
                </div>

                {result.cnn_status && (
                  <div className="flex items-center gap-2 text-xs font-mono bg-surface-elevated p-2 rounded border border-surface-border mt-2">
                    <Cpu size={14} className={result.cnn_status === 'success' ? "text-accent" : "text-text-muted"} />
                    <span className="text-text-secondary">CNN ENSEMBLE: </span>
                    <span className={result.cnn_status === 'success' ? "text-text-primary font-bold" : "text-text-muted"}>
                      {result.cnn_status.toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="mt-4">
                  <p className="text-xs font-mono text-text-muted uppercase mb-2 flex items-center gap-2">
                    <Layers size={14} /> Heatmap & Regions ({result.suspicious_regions.length} anomalies)
                  </p>
                  <div className="rounded-lg overflow-hidden border border-surface-border relative">
                    <img
                      src={`data:image/jpeg;base64,${result.annotated_image_base64}`}
                      alt="annotated"
                      className="w-full object-cover"
                    />
                  </div>
                </div>

                {role === "Police" && result.id && (
                  <div className="mt-6 pt-4 border-t border-surface-border">
                    <button
                      onClick={handleGenerateReport}
                      disabled={generatingReport}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-surface-border bg-surface-elevated hover:bg-surface-border text-text-primary font-mono text-sm transition-colors rounded"
                    >
                      {generatingReport ? (
                        <span className="flex items-center gap-2"><div className="w-3 h-3 border border-text-primary border-t-transparent rounded-full animate-spin"></div> COMPILING...</span>
                      ) : (
                        <><Download size={14} /> GENERATE NCRB DOSSIER</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}