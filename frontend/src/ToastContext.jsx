import React, { createContext, useContext, useState, useCallback, useRef } from "react";

const ToastContext = createContext(null);

let _toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const addToast = useCallback(
    ({ type = "info", title, message, duration = 4000 }) => {
      const id = ++_toastId;
      setToasts((prev) => [...prev, { id, type, title, message }]);
      timers.current[id] = setTimeout(() => removeToast(id), duration);
      return id;
    },
    [removeToast]
  );

  const toast = {
    success: (message, title = "Success") => addToast({ type: "success", title, message }),
    error:   (message, title = "Error")   => addToast({ type: "error",   title, message }),
    warning: (message, title = "Warning") => addToast({ type: "warning", title, message }),
    info:    (message, title = "Info")    => addToast({ type: "info",    title, message }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

// ── Toast Container + individual Toast ───────────────────────────────────────

const ICONS = {
  success: (
    <svg className="w-5 h-5 text-[#30d158]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 text-[#ff3b30]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 text-[#ff9f0a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const BORDER_COLORS = {
  success: "#30d158",
  error:   "#ff3b30",
  warning: "#ff9f0a",
  info:    "#3b82f6",
};

function ToastItem({ toast, onDismiss }) {
  return (
    <div
      style={{
        borderLeft: `3px solid ${BORDER_COLORS[toast.type]}`,
        animation: "toast-in 0.35s cubic-bezier(0.21,1.02,0.73,1) both",
      }}
      className="flex items-start gap-3 bg-[#0c121d] border border-[#1f2937] rounded-lg px-4 py-3 shadow-2xl min-w-[280px] max-w-[380px] pointer-events-auto"
    >
      <div className="mt-0.5 shrink-0">{ICONS[toast.type]}</div>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-mono font-bold text-[#f8fafc] mb-0.5">{toast.title}</p>
        )}
        <p className="text-xs text-[#94a3b8] leading-relaxed break-words">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-[#475569] hover:text-[#f8fafc] transition-colors mt-0.5"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(100%) scale(0.9); }
          to   { opacity: 1; transform: translateX(0)     scale(1);   }
        }
      `}</style>
      <div
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </div>
    </>
  );
}
