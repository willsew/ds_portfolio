"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface QuestionFeedback {
  question: string;
  answer: string;
  feedback: string;
  strength: "strong" | "partial" | "gap";
}

interface Summary {
  understood: string[];
  revisit: string[];
  questionFeedback: QuestionFeedback[];
  overallAssessment: string;
}

const strengthConfig = {
  strong: { label: "Strong", color: "var(--success)", bg: "rgba(45,106,79,0.08)", border: "rgba(45,106,79,0.2)" },
  partial: { label: "Partial", color: "var(--warning)", bg: "rgba(181,98,12,0.08)", border: "rgba(181,98,12,0.2)" },
  gap: { label: "Gap", color: "#c0392b", bg: "rgba(192,57,43,0.08)", border: "rgba(192,57,43,0.2)" },
};

export default function SummaryPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [topic, setTopic] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("socratic_summary");
    const top = sessionStorage.getItem("socratic_topic");

    if (!raw || !top) {
      router.replace("/");
      return;
    }

    try {
      setSummary(JSON.parse(raw));
      setTopic(top);
    } catch {
      setError("Could not parse assessment data.");
    }
  }, []);

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background)" }}>
        <p style={{ color: "#c0392b", fontFamily: "system-ui, sans-serif" }}>{error}</p>
      </div>
    );
  }

  if (!summary) return null;

  const strongCount = summary.questionFeedback.filter((q) => q.strength === "strong").length;
  const partialCount = summary.questionFeedback.filter((q) => q.strength === "partial").length;
  const gapCount = summary.questionFeedback.filter((q) => q.strength === "gap").length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <button
            onClick={() => router.replace("/")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", padding: "0 0 1.5rem", display: "block" }}
          >
            ← Start a new dialogue
          </button>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)", marginBottom: "0.5rem" }}>
            Assessment
          </p>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "400", lineHeight: "1.3", color: "var(--foreground)", marginBottom: "0.75rem" }}>
            {topic}
          </h1>

          {/* Score bar */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {[
              { count: strongCount, label: "Strong", color: "var(--success)", bg: "rgba(45,106,79,0.1)" },
              { count: partialCount, label: "Partial", color: "var(--warning)", bg: "rgba(181,98,12,0.1)" },
              { count: gapCount, label: "Gap", color: "#c0392b", bg: "rgba(192,57,43,0.1)" },
            ].map(({ count, label, color, bg }) => count > 0 && (
              <span key={label} style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", padding: "0.3rem 0.7rem", borderRadius: "20px", background: bg, color }}>
                {count} {label}
              </span>
            ))}
          </div>
        </div>

        {/* Overall assessment */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "1.5rem", marginBottom: "1.5rem" }}>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: "0.75rem" }}>
            Overall Assessment
          </p>
          <p style={{ fontSize: "1rem", lineHeight: "1.7", color: "var(--foreground)" }}>
            {summary.overallAssessment}
          </p>
        </div>

        {/* Two-column: understood + revisit */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>

          {/* Understood well */}
          {summary.understood.length > 0 && (
            <div style={{ background: "rgba(45,106,79,0.05)", border: "1px solid rgba(45,106,79,0.2)", borderRadius: "10px", padding: "1.25rem" }}>
              <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--success)", marginBottom: "0.875rem", fontWeight: "600" }}>
                Understood well
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {summary.understood.map((item, i) => (
                  <li key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                    <span style={{ color: "var(--success)", marginTop: "0.1rem", flexShrink: 0, fontSize: "0.8rem" }}>✓</span>
                    <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", color: "var(--foreground)", lineHeight: "1.5" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* To revisit */}
          {summary.revisit.length > 0 && (
            <div style={{ background: "rgba(181,98,12,0.05)", border: "1px solid rgba(181,98,12,0.2)", borderRadius: "10px", padding: "1.25rem" }}>
              <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--warning)", marginBottom: "0.875rem", fontWeight: "600" }}>
                Worth revisiting
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {summary.revisit.map((item, i) => (
                  <li key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                    <span style={{ color: "var(--warning)", marginTop: "0.1rem", flexShrink: 0, fontSize: "0.9rem" }}>↺</span>
                    <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", color: "var(--foreground)", lineHeight: "1.5" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Per-question feedback */}
        {summary.questionFeedback.length > 0 && (
          <div>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: "1rem" }}>
              Question-by-question feedback
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {summary.questionFeedback.map((qf, i) => {
                const cfg = strengthConfig[qf.strength] || strengthConfig.partial;
                return (
                  <div key={i} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
                    <div style={{ padding: "1.125rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "0.75rem" }}>
                        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.72rem", color: "var(--muted)" }}>Q{i + 1}</span>
                        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.72rem", padding: "0.2rem 0.55rem", borderRadius: "12px", background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, flexShrink: 0 }}>
                          {cfg.label}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.95rem", lineHeight: "1.55", color: "var(--foreground)", fontStyle: "italic", marginBottom: "0.75rem" }}>
                        &ldquo;{qf.question}&rdquo;
                      </p>
                      {qf.answer && (
                        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.82rem", color: "var(--muted)", lineHeight: "1.5" }}>
                          <strong style={{ color: "var(--foreground)", fontWeight: "500" }}>Your response:</strong> {qf.answer}
                        </p>
                      )}
                    </div>
                    <div style={{ padding: "1rem 1.25rem", background: cfg.bg }}>
                      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", color: "var(--foreground)", lineHeight: "1.6" }}>
                        {qf.feedback}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div style={{ marginTop: "2.5rem", paddingTop: "2rem", borderTop: "1px solid var(--border)", display: "flex", gap: "0.75rem" }}>
          <button
            onClick={() => router.replace("/")}
            style={{ padding: "0.75rem 1.5rem", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--foreground)", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", cursor: "pointer" }}
          >
            Start over
          </button>
          <button
            onClick={() => {
              const text = [
                `Socratic Assessment: ${topic}`,
                "",
                `OVERALL: ${summary.overallAssessment}`,
                "",
                `UNDERSTOOD WELL:\n${summary.understood.map((u) => `• ${u}`).join("\n")}`,
                "",
                `WORTH REVISITING:\n${summary.revisit.map((r) => `• ${r}`).join("\n")}`,
                "",
                `QUESTION FEEDBACK:\n${summary.questionFeedback.map((qf, i) =>
                  `Q${i + 1} [${qf.strength.toUpperCase()}]\n"${qf.question}"\nResponse: ${qf.answer}\nFeedback: ${qf.feedback}`
                ).join("\n\n")}`,
              ].join("\n");
              navigator.clipboard.writeText(text);
            }}
            style={{ padding: "0.75rem 1.5rem", borderRadius: "8px", border: "none", background: "var(--accent)", color: "#fff", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", cursor: "pointer" }}
          >
            Copy assessment
          </button>
        </div>

      </div>
    </div>
  );
}
