import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import { ShieldAlert, FileText, Upload, Mic, Download, CheckCircle, AlertTriangle } from "lucide-react";
import { useRole } from "../RoleContext";
import { useToast } from "../ToastContext";

export default function ScamChecker() {
  const { role } = useRole();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("text"); // 'text' or 'audio'

  // Text state
  const [text, setText] = useState("");
  const [channel, setChannel] = useState("call");

  // Audio state
  const [audioFile, setAudioFile] = useState(null);
  const fileInputRef = useRef(null);

  // Results state
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  const analyzeText = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post("/scam/analyze", { text, channel });
      setResult({ ...res.data, type: "text" });
      const risk = res.data.risk_level;
      if (risk === "HIGH") toast.error("HIGH RISK threat detected — take immediate action.", "Threat Detected");
      else if (risk === "MEDIUM") toast.warning("MEDIUM RISK — verify the source independently.", "Caution");
      else toast.success("No significant scam indicators found.", "Low Risk");
    } catch (e) {
      const msg = e?.response?.data?.detail || e.message || "Analysis failed.";
      toast.error(msg, "Analysis Error");
    }
    setLoading(false);
  };

  const analyzeAudio = async () => {
    if (!audioFile) return;
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", audioFile);
      const res = await api.post("/audio/analyze", formData);

      setResult({
        type: "audio",
        filename: res.data.filename,
        is_spoofed: res.data.is_spoofed,
        confidence: res.data.confidence,
        risk_level: res.data.is_spoofed ? "HIGH" : "LOW",
        scam_probability: res.data.is_spoofed ? res.data.confidence : 1 - res.data.confidence,
        explanation: res.data.is_spoofed
          ? `Audio exhibits artifacts characteristic of AI generation (${res.data.model_used}).`
          : `Audio analysis found no significant deepfake signatures.`,
        recommended_action: res.data.is_spoofed
          ? "Flag as fraudulent interaction."
          : "Proceed with standard verification.",
        note: res.data.note,
      });

      // NOTE: the audio endpoint is a demo stub (randomised). Keep the toast
      // honest so users don't mistake it for a real forensic verdict.
      if (res.data.is_spoofed) {
        toast.warning("Simulated deepfake flag (demo module — not a real verdict).", "Audio Analysis (Demo)");
      } else {
        toast.info("Simulated clean result (demo module — not a real verdict).", "Audio Analysis (Demo)");
      }
    } catch (e) {
      const msg = e?.response?.data?.detail || e.message || "Audio analysis failed.";
      toast.error(msg, "Audio Error");
    }
    setLoading(false);
  };

  const handleGenerateReport = async () => {
    if (!result || result.type !== "text" || !result.id) {
      toast.info("Report generation is only available for text analysis.", "Not Available");
      return;
    }
    setGeneratingReport(true);
    try {
      const res = await api.post(`/scam/report/${result.id}`, {}, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `NCRB_SCAM_${result.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("NCRB dossier downloaded successfully.", "Report Generated");
    } catch (e) {
      toast.error(e?.response?.data?.detail || e.message || "Report generation failed.", "Report Error");
    }
    setGeneratingReport(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="flex flex-col items-center text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
          <ShieldAlert className="text-accent" /> Threat &amp; Scam Analyzer
        </h1>
        <p className="text-text-secondary mt-1">Multi-vector analysis for digital arrest and impersonation scams.</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-card p-1 rounded-lg border border-surface-border w-max mx-auto">
        <button
          onClick={() => { setActiveTab("text"); setResult(null); }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "text" ? "bg-surface-elevated text-text-primary" : "text-text-muted hover:text-text-secondary"
          }`}
        >
          <FileText size={16} /> Text / Transcript
        </button>
        <button
          onClick={() => { setActiveTab("audio"); setResult(null); }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "audio" ? "bg-surface-elevated text-text-primary" : "text-text-muted hover:text-text-secondary"
          }`}
        >
          <Mic size={16} /> Audio Deepfake
        </button>
      </div>

      <div className={`grid gap-6 items-start ${result ? "md:grid-cols-2" : "max-w-xl mx-auto w-full"}`}>
        {/* Input Column */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-6 shadow-sm">
          {activeTab === "text" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-text-muted mb-2">VECTOR CHANNEL</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full bg-surface-elevated border border-surface-border text-text-primary rounded-md px-3 py-2 focus:outline-none focus:border-accent transition-colors"
                >
                  <option value="call">Voice Call Transcript</option>
                  <option value="whatsapp">WhatsApp Message</option>
                  <option value="sms">SMS / Text</option>
                  <option value="email">Email</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono text-text-muted mb-2">INTERCEPTED CONTENT</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste the intercepted message or transcript..."
                  className="w-full h-48 bg-surface-elevated border border-surface-border text-text-primary rounded-md px-3 py-3 focus:outline-none focus:border-accent transition-colors resize-none font-mono text-sm"
                />
              </div>
              <button
                onClick={analyzeText}
                disabled={loading || !text.trim()}
                className="w-full bg-accent text-surface-base hover:bg-accent-hover py-3 rounded-md font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-surface-base border-t-transparent rounded-full animate-spin" /> ANALYZING...</>
                ) : "ANALYZE THREAT"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-surface-border hover:border-accent/50 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors bg-surface-elevated/50"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => setAudioFile(e.target.files[0])}
                  accept="audio/*"
                  className="hidden"
                />
                <Upload className="text-text-muted mb-3" size={32} />
                <p className="font-mono text-sm text-text-secondary">
                  {audioFile ? audioFile.name : "Select Audio Sample (.wav, .mp3)"}
                </p>
              </div>
              <button
                onClick={analyzeAudio}
                disabled={loading || !audioFile}
                className="w-full bg-accent text-surface-base hover:bg-accent-hover py-3 rounded-md font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-surface-base border-t-transparent rounded-full animate-spin" /> PROCESSING AUDIO...</>
                ) : "ANALYZE DEEPFAKE SIGNATURE"}
              </button>
            </div>
          )}
        </div>

        {/* Results Column */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-card border border-surface-border rounded-xl p-6 shadow-lg relative overflow-hidden"
            >
              {result.risk_level === "HIGH" && (
                <div className="absolute inset-0 bg-alert-high/5 animate-pulse pointer-events-none" />
              )}

              <h2 className="text-xs font-mono text-text-muted mb-6 tracking-wider">ANALYSIS REPORT</h2>

              {/* Risk Gauge */}
              <div className="flex flex-col items-center mb-8 relative">
                <svg className="w-48 h-24" viewBox="0 0 100 50">
                  <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="var(--color-surface-border)" strokeWidth="8" strokeLinecap="round" />
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: result.scam_probability }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke={
                      result.risk_level === "HIGH" ? "var(--color-alert-high)"
                      : result.risk_level === "MEDIUM" ? "var(--color-accent)"
                      : "var(--color-alert-low)"
                    }
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute bottom-0 flex flex-col items-center">
                  <span className="text-3xl font-mono font-bold text-text-primary">
                    {(result.scam_probability * 100).toFixed(1)}%
                  </span>
                  <span
                    className={`text-xs font-mono font-bold mt-1 px-2 py-0.5 rounded ${
                      result.risk_level === "HIGH"   ? "bg-alert-high-dim text-alert-high"
                    : result.risk_level === "MEDIUM" ? "bg-accent-dim text-accent"
                    : "bg-alert-low-dim text-alert-low"
                    }`}
                  >
                    {result.risk_level} RISK
                  </span>
                </div>
              </div>

              <div className="space-y-4 font-sans text-sm">
                <div>
                  <h3 className="text-xs font-mono text-text-muted uppercase mb-1">Diagnosis</h3>
                  <p className="text-text-primary">{result.explanation}</p>
                </div>

                <div className="p-3 bg-surface-elevated border border-surface-border rounded-md">
                  <h3 className="text-xs font-mono text-text-muted uppercase mb-1 flex items-center gap-1">
                    <CheckCircle size={12} className="text-accent" /> Recommended Action
                  </h3>
                  <p className="text-text-primary font-medium">{result.recommended_action}</p>
                </div>

                {result.note && (
                  <div className="p-3 bg-accent-dim/30 border border-accent/20 rounded-md flex items-start gap-2">
                    <AlertTriangle size={14} className="text-accent mt-0.5 shrink-0" />
                    <p className="text-xs text-text-secondary">{result.note}</p>
                  </div>
                )}
              </div>

              {role === "Police" && result.type === "text" && result.id && (
                <div className="mt-8 pt-6 border-t border-surface-border">
                  <button
                    onClick={handleGenerateReport}
                    disabled={generatingReport}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-surface-border bg-surface-elevated hover:bg-surface-border text-text-primary font-mono text-sm transition-colors rounded"
                  >
                    {generatingReport ? (
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 border border-text-primary border-t-transparent rounded-full animate-spin" /> COMPILING...
                      </span>
                    ) : (
                      <><Download size={14} /> GENERATE NCRB DOSSIER</>
                    )}
                  </button>
                  <p className="text-center text-[10px] text-text-muted mt-2 font-mono uppercase">
                    Simulates Cybercrime.gov.in integration
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}