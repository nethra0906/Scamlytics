import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import { MessageSquare, Send, Bot, User, ShieldCheck } from "lucide-react";
import { useToast } from "../ToastContext";

export default function CitizenAssistant() {
  const toast = useToast();
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your Citizen Fraud Shield assistant. Ask me about suspicious calls, messages, or how to report fraud. आप हिंदी में भी पूछ सकते हैं।" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/chat/message", {
        message: input,
        history: newMessages.slice(0, -1),
      });
      setMessages([...newMessages, { role: "assistant", content: res.data.reply }]);
    } catch (e) {
      if (e?.response?.status === 429) {
        toast.warning(
          "Too many messages sent. Please wait a moment before sending another.",
          "Rate Limit Reached"
        );
        setMessages(newMessages); // Remove the loading state without an error message
      } else {
        setMessages([...newMessages, { role: "assistant", content: "Sorry, I couldn't reach the server. Please try again. " + (e?.message || "") }]);
      }
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <header className="flex items-center gap-3 border-b border-surface-border pb-4">
        <div className="bg-accent/20 p-3 rounded-xl border border-accent/30">
          <MessageSquare className="text-accent" size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Citizen AI Support</h1>
          <p className="text-text-secondary mt-1 flex items-center gap-2">
            <ShieldCheck size={14} className="text-alert-low" /> 
            Multilingual Fraud Prevention Assistant
          </p>
        </div>
      </header>

      <div className="bg-surface-card border border-surface-border rounded-xl shadow-lg overflow-hidden flex flex-col h-[600px] relative">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50 pointer-events-none"></div>
        
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar z-10 relative">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex gap-4 ${m.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border shadow-sm ${
                  m.role === "user" 
                    ? "bg-accent text-surface-base border-accent/20" 
                    : "bg-surface-elevated text-accent border-surface-border"
                }`}>
                  {m.role === "user" ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div className={`max-w-[75%] px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                  m.role === "user"
                    ? "bg-accent text-surface-base rounded-tr-none font-medium"
                    : "bg-surface-elevated border border-surface-border text-text-primary rounded-tl-none font-sans"
                }`}>
                  {m.content}
                </div>
              </motion.div>
            ))}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-4"
              >
                <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center border shadow-sm bg-surface-elevated text-text-muted border-surface-border">
                  <Bot size={20} />
                </div>
                <div className="bg-surface-elevated border border-surface-border px-5 py-4 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-surface-base border-t border-surface-border z-10 relative">
          <div className="flex items-end gap-3 max-w-4xl mx-auto relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Report an incident or ask a question (Hindi/English)..."
              className="flex-1 p-4 bg-surface-elevated rounded-xl border border-surface-border focus:border-accent text-text-primary resize-none h-14 min-h-[56px] max-h-32 transition-colors custom-scrollbar font-sans shadow-inner placeholder:text-text-muted"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="shrink-0 h-14 w-14 bg-accent hover:bg-accent-hover text-surface-base rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:hover:bg-accent shadow-md disabled:shadow-none hover:shadow-lg hover:shadow-accent/20"
            >
              <Send size={20} className={input.trim() ? "translate-x-0.5 -translate-y-0.5 transition-transform" : ""} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}