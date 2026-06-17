"use client";

import { useState } from "react";
import Dialogue from "@/components/Dialogue";
import Summary from "@/components/Summary";
import Upload from "@/components/Upload";

type Stage = "upload" | "dialogue" | "summary";

export default function Home() {
  const [stage, setStage] = useState<Stage>("upload");
  const [document, setDocument] = useState("");
  const [theme, setTheme] = useState("");
  const [history, setHistory] = useState<any[]>([]);

  function handleUploadComplete(doc: string, sessionTheme: string) {
    setDocument(doc);
    setTheme(sessionTheme);
    setStage("dialogue");
  }

  function handleDialogueEnd(dialogueHistory: any[]) {
    setHistory(dialogueHistory);
    setStage("summary");
  }

  function handleRestart() {
    setStage("upload");
    setDocument("");
    setTheme("");
    setHistory([]);
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10 sm:px-8">
        <header className="mb-8 text-center sm:text-left">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Socratic Tutor
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Upload material, answer probing questions, and receive structured
            feedback.
          </p>
        </header>

        <div className="flex flex-1 flex-col">
          {stage === "upload" && (
            <Upload onComplete={handleUploadComplete} />
          )}

          {stage === "dialogue" && (
            <Dialogue
              document={document}
              theme={theme}
              onEnd={handleDialogueEnd}
            />
          )}

          {stage === "summary" && (
            <Summary
              dialogue={history}
              theme={theme}
              onRestart={handleRestart}
            />
          )}
        </div>
      </main>
    </div>
  );
}
