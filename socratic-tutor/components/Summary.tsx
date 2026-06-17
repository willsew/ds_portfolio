"use client";

import { MessageStream } from "@anthropic-ai/sdk/lib/MessageStream";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

interface SummaryProps {
  dialogue: any[];
  theme: string;
  onRestart: () => void;
}

export default function Summary({ dialogue, theme, onRestart }: SummaryProps) {
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchSummary() {
      setIsLoading(true);
      setError(null);
      setSummary("");

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "summary",
            messages: dialogue,
            theme,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate summary");
        }
        if (!response.body) {
          throw new Error("No response body");
        }

        const stream = MessageStream.fromReadableStream(response.body);

        stream.on("text", (_delta, snapshot) => {
          if (!cancelled) {
            setSummary(snapshot);
          }
        });

        await stream.done();
      } catch {
        if (!cancelled) {
          setError("Could not generate summary. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchSummary();
    return () => {
      cancelled = true;
    };
  }, [dialogue, theme]);

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Session summary
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{theme}</p>
      </div>

      <div className="min-h-[12rem] rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        {isLoading && !summary && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Generating your summary…
          </p>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {summary && (
          <div className="max-w-none text-sm">
            <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <h2 className="mt-6 mb-3 text-base font-semibold text-zinc-900 first:mt-0 dark:text-zinc-100">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mt-4 mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="mb-3 leading-relaxed text-zinc-700 last:mb-0 dark:text-zinc-300">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="mb-3 list-disc space-y-1 pl-5 text-zinc-700 dark:text-zinc-300">
                    {children}
                  </ul>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {children}
                  </strong>
                ),
              }}
            >
              {summary}
            </ReactMarkdown>
          </div>
        )}

        {isLoading && summary && (
          <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
            Still writing…
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onRestart}
        disabled={isLoading}
        className="self-start rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Start New Session
      </button>
    </div>
  );
}
