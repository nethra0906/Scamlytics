import { useState } from "react";
import { Shield, LogIn, Lock, User } from "lucide-react";
import { useAuth } from "../RoleContext";
import { useToast } from "../ToastContext";

// Demo accounts (mirrors the backend _DEMO_USERS store).
const DEMO_ACCOUNTS = [
  { label: "Police Intel", username: "police", password: "police123" },
  { label: "Bank Analyst", username: "bank", password: "bank123" },
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
      toast.success(`Signed in — clearance: ${role.toUpperCase()}`, "Access Granted");
    } catch (err) {
      const msg =
        err?.response?.status === 401
          ? "Invalid credentials. Check your username and password."
          : err?.response?.data?.detail || err.message || "Sign-in failed.";
      toast.error(msg, "Access Denied");
    }
    setLoading(false);
  };

  const quickFill = (acc) => {
    setUsername(acc.username);
    setPassword(acc.password);
  };

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-[fadeInUp_0.4s_ease-out]">
        <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-lg bg-accent/20 border border-accent flex items-center justify-center text-accent mb-4">
            <Shield size={28} />
          </div>
          <h1 className="font-sans font-bold text-2xl tracking-tight">
            Scam<span className="text-accent">lytics</span>
          </h1>
          <p className="text-text-secondary text-sm mt-1">Digital Public Safety Intelligence</p>
        </div>

        {/* Card */}
        <form
          onSubmit={submit}
          className="bg-surface-card border border-surface-border rounded-xl p-6 shadow-lg space-y-4"
        >
          <div className="text-xs font-mono text-text-muted uppercase tracking-wider mb-2">
            Secure Authentication
          </div>

          <div>
            <label className="block text-xs font-mono text-text-muted mb-2">USERNAME</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={username}
                autoComplete="username"
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. police"
                className="w-full bg-surface-elevated border border-surface-border text-text-primary rounded-md pl-9 pr-3 py-2.5 focus:outline-none focus:border-accent transition-colors font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-text-muted mb-2">PASSWORD</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-elevated border border-surface-border text-text-primary rounded-md pl-9 pr-3 py-2.5 focus:outline-none focus:border-accent transition-colors font-mono text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim() || !password}
            className="w-full bg-accent text-surface-base hover:bg-accent-hover py-3 rounded-md font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-surface-base border-t-transparent rounded-full animate-spin" />
                AUTHENTICATING...
              </>
            ) : (
              <>
                <LogIn size={16} /> SIGN IN
              </>
            )}
          </button>

          {/* Demo credential shortcuts */}
          <div className="pt-4 border-t border-surface-border">
            <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider mb-2">
              Demo Accounts — click to fill
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => quickFill(acc)}
                  className="text-[11px] font-mono px-2 py-2 rounded border border-surface-border bg-surface-elevated text-text-secondary hover:text-accent hover:border-accent/50 transition-colors"
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </form>

        <p className="text-center text-[10px] text-text-muted font-mono mt-4 uppercase tracking-wider">
          Authorised access only · Activity is logged
        </p>
      </div>
    </div>
  );
}
