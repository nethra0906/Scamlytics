import { useState } from "react";
import { LogIn } from "lucide-react";
import { useAuth } from "../RoleContext";
import { useToast } from "../ToastContext";
import Starfield from "../components/Starfield";
import { SectionLabel, Diamond } from "../components/Editorial";

const DEMO_ACCOUNTS = [
  { label: "Police", username: "police", password: "police123" },
  { label: "Bank", username: "bank", password: "bank123" },
  { label: "Citizen", username: "citizen", password: "citizen123" },
];

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);
    try {
      const role = await login(username.trim(), password);
      toast.success(`Signed in — clearance ${role.toUpperCase()}`, "Access Granted");
    } catch (err) {
      const msg =
        err?.response?.status === 401
          ? "Invalid credentials. Check your username and password."
          : err?.response?.data?.detail || err.message || "Sign-in failed.";
      toast.error(msg, "Access Denied");
    }
    setLoading(false);
  };

  const quickFill = (acc) => { setUsername(acc.username); setPassword(acc.password); };

  const inputCls =
    "w-full bg-transparent border-0 border-b border-surface-border focus:border-accent text-text-primary py-2.5 focus:outline-none transition-colors placeholder:text-text-muted";

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
      <Starfield />

      {/* fixed corner motifs, echoing the reference */}
      <div className="fixed top-6 left-6 text-text-muted"><Diamond size={12} /></div>
      <div className="fixed top-6 right-6 text-text-muted"><Diamond size={12} /></div>

      <div className="w-full max-w-sm animate-[fadeInUp_0.6s_ease-out]">
        <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }`}</style>

        <div className="text-center mb-10">
          <SectionLabel className="justify-center">Secure Access</SectionLabel>
          <h1 className="display-serif text-6xl mt-6 mb-3">Scamlytics</h1>
          <p className="text-sm text-text-secondary">Digital Public Safety Intelligence</p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <div>
            <label className="eyebrow block mb-1">Username</label>
            <input
              type="text" value={username} autoComplete="username"
              onChange={(e) => setUsername(e.target.value)}
              placeholder="police" className={inputCls}
            />
          </div>
          <div>
            <label className="eyebrow block mb-1">Password</label>
            <input
              type="password" value={password} autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" className={inputCls}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim() || !password}
            className="group w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white py-3 rounded-md text-xs font-mono uppercase tracking-[0.25em] transition-colors disabled:opacity-40 mt-2"
          >
            {loading ? "Authenticating…" : (<><LogIn size={14} /> Sign In</>)}
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-surface-border">
          <p className="eyebrow mb-3">Demo Accounts</p>
          <div className="flex items-center justify-between">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.username}
                type="button"
                onClick={() => quickFill(acc)}
                className="text-xs font-mono uppercase tracking-[0.15em] text-text-secondary hover:text-accent transition-colors"
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-[10px] text-text-muted font-mono uppercase tracking-[0.2em] mt-10">
          Authorised access only · Activity logged
        </p>
      </div>
    </div>
  );
}
