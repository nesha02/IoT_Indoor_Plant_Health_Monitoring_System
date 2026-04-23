import { useState, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatbotProps {
  selectedPlant?: string;
  // Controlled from Index.tsx header button
  isOpen: boolean;
  onToggle: () => void;
}

// ─── Suggested prompts ────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  "Which plant needs water right now?",
  "Why did the moisture drop?",
  "Is the temperature okay for my plants?",
  "When was the last watering event?",
  "Which plant is at risk?",
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Chatbot({ selectedPlant, isOpen, onToggle }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your plant care assistant 🌿 I have live access to your sensor data and irrigation history. Ask me anything about your plants!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // ── Send message ─────────────────────────────────────────────────────────

  async function sendMessage(text?: string) {
    const question = (text ?? input).trim();
    if (!question || loading) return;

    const userMsg: Message = {
      role: "user",
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages
        .slice(1)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history }),
      });

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer ?? "Sorry, I couldn't get a response.",
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting right now. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function formatTime(date: Date) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40%            { opacity: 1;   transform: scale(1);   }
        }
        .chat-scroll::-webkit-scrollbar { width: 5px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }
        .chip-btn:hover { background: rgba(22,163,74,0.28) !important; border-color: rgba(22,163,74,0.7) !important; }
        .send-btn:hover { background: #15803d !important; }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

      {/* ── Chat panel — drops down from top-right ── */}
      <div
        style={{
          position: "fixed",
          top: "72px",        /* sits just below the header */
          right: "24px",
          zIndex: 49,
          width: "480px",     /* wider than before */
          maxWidth: "calc(100vw - 48px)",
          height: "600px",    /* taller than before */
          borderRadius: "16px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: "#0f172a",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
          animation: "slideDown 0.25s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            background: "linear-gradient(135deg, #166534 0%, #14532d 100%)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
            }}
          >
            🌿
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 600, fontSize: "16px" }}>
              Plant Assistant
            </div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>
              {selectedPlant
                ? `Viewing ${selectedPlant.replace("plant", "Plant ")}`
                : "Live sensor data connected"}
            </div>
          </div>
          {/* Live indicator */}
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <div
              style={{
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                background: "#4ade80",
                boxShadow: "0 0 7px #4ade80",
              }}
            />
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>Live</span>
          </div>
          {/* Close button */}
          <button
            onClick={onToggle}
            style={{
              marginLeft: "12px",
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: "50%",
              width: "30px",
              height: "30px",
              color: "#fff",
              cursor: "pointer",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div
          className="chat-scroll"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "80%",
                  padding: "12px 16px",       /* bigger padding */
                  borderRadius:
                    msg.role === "user"
                      ? "18px 18px 4px 18px"
                      : "18px 18px 18px 4px",
                  background:
                    msg.role === "user"
                      ? "linear-gradient(135deg, #16a34a, #15803d)"
                      : "rgba(255,255,255,0.06)",
                  color:
                    msg.role === "user" ? "#fff" : "rgba(255,255,255,0.9)",
                  fontSize: "15px",           /* bigger font */
                  lineHeight: "1.6",
                  border:
                    msg.role === "assistant"
                      ? "1px solid rgba(255,255,255,0.08)"
                      : "none",
                  whiteSpace: "pre-line",     /* respects \n in answers */
                }}
              >
                {msg.content}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.25)",
                  marginTop: "4px",
                  paddingLeft: "4px",
                  paddingRight: "4px",
                }}
              >
                {formatTime(msg.timestamp)}
              </div>
            </div>
          ))}

          {/* Loading dots */}
          {loading && (
            <div style={{ display: "flex", alignItems: "flex-start" }}>
              <div
                style={{
                  padding: "14px 18px",
                  borderRadius: "18px 18px 18px 4px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  gap: "6px",
                  alignItems: "center",
                }}
              >
                {[0, 1, 2].map((n) => (
                  <span
                    key={n}
                    style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      background: "#4ade80",
                      display: "inline-block",
                      animation: `pulse 1.2s ease-in-out ${n * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Suggested prompts — only before first user message */}
        {messages.length === 1 && (
          <div
            style={{
              padding: "0 20px 14px",
              display: "flex",
              flexWrap: "wrap",
              gap: "7px",
              flexShrink: 0,
            }}
          >
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                className="chip-btn"
                onClick={() => sendMessage(prompt)}
                style={{
                  padding: "6px 13px",
                  borderRadius: "20px",
                  border: "1px solid rgba(22,163,74,0.35)",
                  background: "rgba(22,163,74,0.12)",
                  color: "#4ade80",
                  fontSize: "12px",       /* slightly bigger */
                  cursor: "pointer",
                  transition: "background 0.15s, border-color 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input area */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            gap: "10px",
            alignItems: "center",
            flexShrink: 0,
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your plants…"
            disabled={loading}
            style={{
              flex: 1,
              padding: "11px 16px",       /* bigger input */
              borderRadius: "24px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.9)",
              fontSize: "15px",           /* bigger font */
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          <button
            className="send-btn"
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={{
              width: "42px",              /* bigger send button */
              height: "42px",
              borderRadius: "50%",
              border: "none",
              background: "#16a34a",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "17px",
              flexShrink: 0,
              transition: "background 0.15s",
            }}
          >
            ➤
          </button>
        </div>
      </div>
    </>
  );
}