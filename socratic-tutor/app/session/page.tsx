"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function SessionPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [material, setMaterial] = useState("");
  const [topic, setTopic] = useState("");
  const [filename, setFilename] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [error, setError] = useState("");
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);

  useEffect(() => {
    const mat = sessionStorage.getItem("socratic_material");
    const top = sessionStorage.getItem("socratic_topic");
    const file = sessionStorage.getItem("socratic_filename");

    if (!mat || !top) {
      router.replace("/");
      return;
    }

    setMaterial(mat);
    setTopic(top);
    setFilename(file || "Your material");
    startDialogue(mat, top);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startDialogue = async (mat: string, top: string) => {
    setIsStreaming(true);
    setError("");
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [], material: mat, topic: top }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to connect to Socrates");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      setMessages([{ role: "assistant", content: "" }]);
      setQuestionCount(1);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages([{ role: "assistant", content: accumulated }]);
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") {
        setError((err as Error)?.message || "Something went wrong");
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);
    setError("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, material, topic }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to get response");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      const withPlaceholder = [...newMessages, { role: "assistant" as const, content: "" }];
      setMessages(withPlaceholder);
      setQuestionCount((q) => q + 1);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages([...newMessages, { role: "assistant", content: accumulated }]);
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") {
        setError((err as Error)?.message || "Something went wrong. Please try again.");
        setMessages(messages);
      }
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, messages, material, topic]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleEndSession = async () => {
    if (messages.length < 2) {
      router.replace("/");
      return;
    }
    setShowEndConfirm(false);
    setIsEnding(true);

    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, material, topic }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate summary");
      }

      const summary = await res.json();
      sessionStorage.setItem("socratic_summary", JSON.stringify(summary));
      sessionStorage.setItem("socratic_messages", JSON.stringify(messages));
      router.push("/summary");
    } catch (err: unknown) {
      setError((err as Error)?.message || "Failed to generate summary. Please try again.");
      setIsEnding(false);
    }
  };

  const userTurns = messages.filter((m) => m.role === "user").length;

  if (isEnding) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", border: "2px solid var(--border)", borderTop: "2px solid var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1.5rem" }} />
          <p style={{ fontFamily: "system-ui, sans-serif", color: "var(--muted)", fontSize: "0.9rem" }}>
            Reflecting on the dialogue...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--background)" }}>

      {/* Header */}
      <header style={{ borderBottom: "1px solid var(--border)", padding: "0 1.5rem", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--card)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => router.replace("/")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", padding: "0.25rem 0" }}
          >
            ← Home
          </button>
          <span style={{ color: "var(--border)" }}>|</span>
          <div>
            <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "var(--muted)", marginRight: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Topic</span>
            <span style={{ fontSize: "0.9rem", color: "var(--foreground)" }}>{topic}</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "var(--muted)" }}>
            {userTurns} {userTurns === 1 ? "response" : "responses"}
          </span>
          <button
            onClick={() => setShowEndConfirm(true)}
            disabled={messages.length < 2 || isStreaming}
            style={{
              padding: "0.4rem 1rem",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--foreground)",
              fontFamily: "system-ui, sans-serif",
              fontSize: "0.8rem",
              cursor: messages.length < 2 || isStreaming ? "not-allowed" : "pointer",
              opacity: messages.length < 2 || isStreaming ? 0.4 : 1,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { if (messages.length >= 2 && !isStreaming) (e.target as HTMLElement).style.borderColor = "var(--accent)"; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.borderColor = "var(--border)"; }}
          >
            End Session
          </button>
        </div>
      </header>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "2rem 1rem" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Source indicator */}
          <div style={{ textAlign: "center", paddingBottom: "0.5rem" }}>
            <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.72rem", color: "var(--muted)", background: "var(--socrates-bg)", padding: "0.3rem 0.75rem", borderRadius: "20px", border: "1px solid var(--border)" }}>
              Drawing from: {filename}
            </span>
          </div>

          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              {msg.role === "assistant" && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--foreground)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "var(--background)", fontSize: "0.7rem", fontFamily: "Georgia, serif", fontWeight: "bold" }}>S</span>
                  </div>
                  <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "var(--muted)", fontWeight: "500" }}>Socrates</span>
                </div>
              )}
              <div
                style={{
                  maxWidth: "85%",
                  padding: "0.875rem 1.125rem",
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
                  background: msg.role === "user" ? "var(--user-bg)" : "var(--socrates-bg)",
                  color: msg.role === "user" ? "var(--user-fg)" : "var(--foreground)",
                  border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                  fontSize: "0.975rem",
                  lineHeight: "1.65",
                  fontFamily: "Georgia, serif",
                }}
              >
                {msg.content || (
                  <span style={{ opacity: 0.4 }}>
                    <span style={{ animation: "pulse 1.5s ease-in-out infinite" }}>&#9679;</span>
                    <span style={{ animation: "pulse 1.5s ease-in-out 0.2s infinite", marginLeft: "0.2rem" }}>&#9679;</span>
                    <span style={{ animation: "pulse 1.5s ease-in-out 0.4s infinite", marginLeft: "0.2rem" }}>&#9679;</span>
                  </span>
                )}
              </div>
            </div>
          ))}

          {error && (
            <div style={{ background: "rgba(192,57,43,0.06)", border: "1px solid rgba(192,57,43,0.2)", borderRadius: "8px", padding: "0.75rem 1rem" }}>
              <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", color: "#c0392b" }}>{error}</p>
              <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#c0392b", fontSize: "0.75rem", cursor: "pointer", fontFamily: "system-ui, sans-serif", padding: 0, marginTop: "0.25rem", textDecoration: "underline" }}>Dismiss</button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "1rem 1.5rem", background: "var(--card)", flexShrink: 0 }}>
        <div style={{ maxWidth: "680px", margin: "0 auto", display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Respond to Socrates..."
            disabled={isStreaming}
            rows={1}
            style={{
              flex: 1,
              padding: "0.75rem 1rem",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              background: "transparent",
              color: "var(--foreground)",
              fontFamily: "Georgia, serif",
              fontSize: "0.975rem",
              lineHeight: "1.5",
              resize: "none",
              outline: "none",
              transition: "border-color 0.15s",
              maxHeight: "150px",
              overflowY: "auto",
              opacity: isStreaming ? 0.5 : 1,
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 150) + "px";
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              border: "none",
              background: input.trim() && !isStreaming ? "var(--accent)" : "var(--border)",
              color: input.trim() && !isStreaming ? "#fff" : "var(--muted)",
              cursor: input.trim() && !isStreaming ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.15s",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <p style={{ textAlign: "center", fontFamily: "system-ui, sans-serif", fontSize: "0.7rem", color: "var(--muted)", marginTop: "0.5rem" }}>
          Enter to send · Shift+Enter for new line · End Session when ready for feedback
        </p>
      </div>

      {/* End session confirmation modal */}
      {showEndConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" }}>
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "2rem", maxWidth: "420px", width: "100%" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "400", marginBottom: "0.75rem", color: "var(--foreground)" }}>End the dialogue?</h2>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.9rem", color: "var(--muted)", lineHeight: "1.6", marginBottom: "1.5rem" }}>
              Socrates will step back and you&apos;ll receive a full assessment — what you understood, what to revisit, and feedback on each of your {userTurns} {userTurns === 1 ? "response" : "responses"}.
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => setShowEndConfirm(false)}
                style={{ flex: 1, padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--foreground)", fontFamily: "system-ui, sans-serif", fontSize: "0.9rem", cursor: "pointer" }}
              >
                Keep going
              </button>
              <button
                onClick={handleEndSession}
                style={{ flex: 1, padding: "0.75rem", borderRadius: "8px", border: "none", background: "var(--accent)", color: "#fff", fontFamily: "system-ui, sans-serif", fontSize: "0.9rem", cursor: "pointer" }}
              >
                Get my assessment
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
