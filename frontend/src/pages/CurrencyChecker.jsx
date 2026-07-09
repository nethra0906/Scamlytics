import { useState } from "react";
import api from "../api";

export default function CurrencyChecker() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFile = (e) => {
    const f = e.target.files[0];
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
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

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Counterfeit Currency Detector</h1>

      <input type="file" accept="image/*" onChange={handleFile} className="mb-3" />

      {preview && (
        <img src={preview} alt="preview" className="w-full max-h-64 object-contain mb-3 rounded border border-slate-700" />
      )}

      <button
        onClick={analyze}
        disabled={loading || !file}
        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold disabled:opacity-50"
      >
        {loading ? "Analyzing..." : "Analyze Note"}
      </button>

      {result && !result.error && (
        <div className="mt-6 p-4 bg-slate-800 rounded border border-slate-700">
          <div className={`inline-block px-3 py-1 rounded text-white font-bold mb-2 ${result.verdict === "genuine" ? "bg-green-600" : "bg-red-600"}`}>
            {result.verdict.toUpperCase()}
          </div>
          <p className="mb-2"><b>Confidence:</b> {(result.confidence * 100).toFixed(1)}%</p>
          <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
            {Object.entries(result.sub_scores).map(([k, v]) => (
              <div key={k} className="bg-slate-700 p-2 rounded">
                {k.replaceAll("_", " ")}: {(v * 100).toFixed(0)}%
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-400 mb-2">
            {result.suspicious_regions.length} suspicious region(s) highlighted below.
          </p>
          <img
            src={`data:image/jpeg;base64,${result.annotated_image_base64}`}
            alt="annotated"
            className="w-full rounded border border-slate-700"
          />
        </div>
      )}
    </div>
  );
}