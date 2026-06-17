"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

interface UploadProps {
  onComplete: (document: string, theme: string) => void;
}

export default function Upload({ onComplete }: UploadProps) {
  const [document, setDocument] = useState("");
  const [theme, setTheme] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const text = await file.text();
    setDocument(text);
    setFileName(file.name);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/plain": [".txt"] },
    multiple: false,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onComplete(document.trim(), theme.trim());
  }

  const canSubmit = document.trim().length > 0 && theme.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-2xl flex-col gap-6">
      <div
        {...getRootProps()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-12 transition-colors ${
          isDragActive
            ? "border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-900"
            : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Drop your .txt file here…
          </p>
        ) : (
          <>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Drag and drop a .txt file, or click to browse
            </p>
            {fileName && (
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Loaded: {fileName}
              </p>
            )}
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="document-text"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Or paste text directly
        </label>
        <textarea
          id="document-text"
          value={document}
          onChange={(e) => {
            setDocument(e.target.value);
            setFileName(null);
          }}
          rows={10}
          placeholder="Paste your study material here…"
          className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="theme"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Theme
        </label>
        <input
          id="theme"
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="e.g. The causes of the French Revolution"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Start session
      </button>
    </form>
  );
}
