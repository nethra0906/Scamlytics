import { useState, useRef, useEffect } from "react";
import api from "../api";

export default function CitizenAssistant() {
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
      setMessages([...newMessages, { role: "assistant", content: "Error reaching assistant: " + e.message }]);
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
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Citizen Fraud Assistant</h1>

      <div className="bg-slate-800 rounded border border-slate-700 h-[450px] overflow-y-auto p-4 mb-3 flex flex-col gap-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] p-3 rounded-lg ${
              m.role === "user"
                ? "bg-blue-600 self-end text-white"
                : "bg-slate-700 self-start text-slate-100"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && <div className="bg-slate-700 self-start text-slate-400 p-3 rounded-lg">Typing...</div>}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type your question... (any Indian language works)"
          className="flex-1 p-3 bg-slate-800 rounded border border-slate-700 resize-none h-14"
        />
        <button
          onClick={send}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 px-5 rounded font-semibold"
        >
          Send
        </button>
      </div>
    </div>
  );
}