"use client";

import { MessageStream } from "@anthropic-ai/sdk/lib/MessageStream";
import { useEffect, useRef, useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface DialogueProps {
  document: string;
  theme: string;
  onEnd: (history: any[]) => void;
}

function displayContent(content: string): string {
  const trimmed = content.trim();
  if (trimmed === "DIALOGUE_COMPLETE") {
    return "The session has come to a natural close.";
  }
  return content.replace(/\s*DIALOGUE_COMPLETE\s*/g, "").trim();
}

export default function Dialogue({ document, theme, onEnd }: DialogueProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [dialogueComplete, setDialogueComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  async function streamChat(
    apiMessages: ChatMessage[],
    onUpdate: (text: string) => void
  ): Promise<string> {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        document,
        theme,
        mode: "dialogue",
        messages: apiMessages,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get response from tutor");
    }
    if (!response.body) {
      throw new Error("No response body");
    }

    const stream = MessageStream.fromReadableStream(response.body);
    let fullText = "";

    stream.on("text", (_delta, snapshot) => {
      fullText = snapshot;
      onUpdate(snapshot);
    });

    await stream.done();
    return fullText;
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchOpening() {
      setIsLoading(true);
      setError(null);

      try {
        setMessages([{ role: "assistant", content: "" }]);

        const text = await streamChat([], (snapshot) => {
          if (!cancelled) {
            setMessages([{ role: "assistant", content: snapshot }]);
          }
        });

        if (cancelled) return;

        setMessages([{ role: "assistant", content: text }]);
        setDialogueComplete(text.includes("DIALOGUE_COMPLETE"));
      } catch {
        if (!cancelled) {
          setError("Could not start the session. Please try again.");
          setMessages([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchOpening();
    return () => {
      cancelled = true;
    };
  }, [document, theme]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading || dialogueComplete) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const history = [...messages, userMessage];
    const assistantPlaceholder: ChatMessage = { role: "assistant", content: "" };

    setMessages([...history, assistantPlaceholder]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const text = await streamChat(history, (snapshot) => {
        setMessages([...history, { role: "assistant", content: snapshot }]);
      });

      setMessages([...history, { role: "assistant", content: text }]);
      setDialogueComplete(text.includes("DIALOGUE_COMPLETE"));
    } catch {
      setError("Failed to send message. Please try again.");
      setMessages(history);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-full w-full max-w-2xl flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Socratic dialogue
        </h2>
        <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">{theme}</p>
      </div>

      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
      >
        {messages.length === 0 && isLoading && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Socrates is preparing his first question…
          </p>
        )}

        {messages.map((message, index) => {
          const isUser = message.role === "user";
          const isStreaming =
            isLoading &&
            index === messages.length - 1 &&
            message.role === "assistant" &&
            message.content === "";

          if (isStreaming) return null;

          const content = displayContent(message.content);
          if (!content && message.role === "assistant") return null;

          return (
            <div
              key={index}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  isUser
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700"
                }`}
              >
                {!isUser && (
                  <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Socrates
                  </p>
                )}
                <p className="whitespace-pre-wrap">{content}</p>
              </div>
            </div>
          );
        })}

        {isLoading && messages.at(-1)?.role === "assistant" && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-white px-4 py-2.5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Socrates
              </p>
              <p className="text-sm text-zinc-400">…</p>
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      {dialogueComplete ? (
        <button
          type="button"
          onClick={() => onEnd(messages)}
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          End Session &amp; Get Summary
        </button>
      ) : (
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Type your response…"
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
}
