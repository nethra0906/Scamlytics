import { useState } from "react";
import api from "../api";

export default function ScamChecker() {
  const [text, setText] = useState("");
  const [channel, setChannel] = useState("call");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await api.post("/scam/analyze", { text, channel });
      setResult(res.data);
    } catch (e) {
      alert("Error: " + e.message);
    }
    setLoading(false);
  };

  const riskColor = {
    HIGH: "bg-red-600", MEDIUM: "bg-yellow-600", LOW: "bg-green-600"
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Digital Arrest Scam Checker</h1>

      <select
        value={channel}
        onChange={(e) => setChannel(e.target.value)}
        className="mb-3 p-2 bg-slate-800 rounded border border-slate-700"
      >
        <option value="call">Call Transcript</option>
        <option value="whatsapp">WhatsApp Message</option>
        <option value="sms">SMS</option>
        <option value="email">Email</option>
      </select>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste the message or call transcript here..."
        className="w-full h-40 p-3 bg-slate-800 rounded border border-slate-700 mb-3"
      />

      <button
        onClick={analyze}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold"
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      {result && (
        <div className="mt-6 p-4 bg-slate-800 rounded border border-slate-700">
          <div className={`inline-block px-3 py-1 rounded text-white font-bold mb-2 ${riskColor[result.risk_level]}`}>
            {result.risk_level} RISK
          </div>
          <p className="mb-1"><b>Scam Probability:</b> {(result.scam_probability * 100).toFixed(1)}%</p>
          <p className="mb-1"><b>Explanation:</b> {result.explanation}</p>
          <p className="mb-1"><b>Recommended Action:</b> {result.recommended_action}</p>
        </div>
      )}
    </div>
  );
}