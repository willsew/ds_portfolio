"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [topic, setTopic] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (f: File) => {
    const allowed = ["application/pdf", "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword"];
    if (!allowed.includes(f.type) && !f.name.endsWith(".txt") && !f.name.endsWith(".pdf") && !f.name.endsWith(".docx")) {
      setError("Please upload a PDF, Word document, or plain text file.");
      return;
    }
    setError("");
    setFile(f);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, []);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const canBegin = topic.trim().length > 0 && (
    (mode === "upload" && file !== null) ||
    (mode === "paste" && pastedText.trim().length > 50)
  );

  const handleBegin = async () => {
    if (!canBegin) return;
    setIsProcessing(true);
    setError("");

    try {
      let materialText = "";

      if (mode === "upload" && file) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to process file");
        }
        const data = await res.json();
        materialText = data.text;
      } else {
        materialText = pastedText.trim();
      }

      sessionStorage.setItem("socratic_material", materialText);
      sessionStorage.setItem("socratic_topic", topic.trim());
      sessionStorage.setItem("socratic_filename", file?.name || "Pasted text");

      router.push("/session");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", background: "var(--background)" }}>
      <div style={{ width: "100%", maxWidth: "640px" }}>

        {/* Header */}
        <div style={{ marginBottom: "3rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", fontFamily: "system-ui, sans-serif", marginBottom: "0.75rem" }}>
            A Socratic Learning Tool
          </p>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "400", lineHeight: "1.2", color: "var(--foreground)", marginBottom: "1rem" }}>
            What do you<br />think you know?
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "1rem", lineHeight: "1.6", fontFamily: "system-ui, sans-serif", maxWidth: "480px", margin: "0 auto" }}>
            Upload your study materials, name a concept, and Socrates will question you until he finds where your understanding ends.
          </p>
        </div>

        {/* Card */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Mode toggle */}
          <div style={{ display: "flex", gap: "0.5rem", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem" }}>
            {(["upload", "paste"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  padding: "0.4rem 0.9rem",
                  borderRadius: "6px",
                  border: "1px solid",
                  borderColor: mode === m ? "var(--accent)" : "var(--border)",
                  background: mode === m ? "var(--accent-light)" : "transparent",
                  color: mode === m ? "var(--accent)" : "var(--muted)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "inherit",
                  transition: "all 0.15s",
                }}
              >
                {m === "upload" ? "Upload file" : "Paste text"}
              </button>
            ))}
          </div>

          {/* Upload zone */}
          {mode === "upload" && (
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed`,
                borderColor: isDragging ? "var(--accent)" : file ? "var(--success)" : "var(--border)",
                borderRadius: "10px",
                padding: "2.5rem 1.5rem",
                textAlign: "center",
                cursor: "pointer",
                background: isDragging ? "var(--accent-light)" : file ? "rgba(45,106,79,0.04)" : "transparent",
                transition: "all 0.2s",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.docx,.doc"
                style={{ display: "none" }}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              {file ? (
                <div>
                  <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>✓</div>
                  <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", color: "var(--success)", fontWeight: "500" }}>{file.name}</p>
                  <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.25rem" }}>Click to change</p>
                </div>
              ) : (
                <div>
                  <div style={{ width: "40px", height: "40px", margin: "0 auto 0.75rem", opacity: 0.4 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 16V8m0 0-3 3m3-3 3 3M20 16.7A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", color: "var(--foreground)", marginBottom: "0.25rem" }}>
                    Drop a file or click to browse
                  </p>
                  <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "var(--muted)" }}>
                    PDF, DOCX, or TXT
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Paste zone */}
          {mode === "paste" && (
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste your reading, lecture notes, or any study material here..."
              rows={8}
              style={{
                width: "100%",
                padding: "1rem",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                background: "transparent",
                color: "var(--foreground)",
                fontFamily: "system-ui, sans-serif",
                fontSize: "0.9rem",
                lineHeight: "1.6",
                resize: "vertical",
                outline: "none",
              }}
            />
          )}

          {/* Topic input */}
          <div>
            <label style={{ display: "block", fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", fontWeight: "500", color: "var(--muted)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
              Topic to explore
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && canBegin && handleBegin()}
              placeholder="e.g. the distinction between correlation and causation"
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                background: "transparent",
                color: "var(--foreground)",
                fontFamily: "Georgia, serif",
                fontSize: "1rem",
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          {error && (
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", color: "#c0392b", padding: "0.75rem 1rem", background: "rgba(192,57,43,0.06)", borderRadius: "6px" }}>
              {error}
            </p>
          )}

          {/* Begin button */}
          <button
            onClick={handleBegin}
            disabled={!canBegin || isProcessing}
            style={{
              width: "100%",
              padding: "0.875rem",
              borderRadius: "8px",
              border: "none",
              background: canBegin && !isProcessing ? "var(--accent)" : "var(--border)",
              color: canBegin && !isProcessing ? "#ffffff" : "var(--muted)",
              fontFamily: "Georgia, serif",
              fontSize: "1rem",
              cursor: canBegin && !isProcessing ? "pointer" : "not-allowed",
              transition: "all 0.2s",
              letterSpacing: "0.01em",
            }}
          >
            {isProcessing ? "Preparing the dialogue..." : "Begin the Dialogue"}
          </button>
        </div>

        <p style={{ textAlign: "center", fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "var(--muted)", marginTop: "1.5rem", lineHeight: "1.6" }}>
          &ldquo;I know that I know nothing.&rdquo; &mdash; attributed to Socrates
        </p>
      </div>
    </main>
  );
}
