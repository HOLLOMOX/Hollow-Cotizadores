"use client";

import { useState } from "react";

export default function CopyQuoteText({ text }: { text: string }) {
  const [message, setMessage] = useState("");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setMessage("Texto copiado correctamente.");
    } catch {
      setMessage("No se pudo copiar el texto.");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black uppercase tracking-wide text-neutral-950 transition hover:bg-yellow-300"
      >
        Copiar texto
      </button>

      {message && (
        <p className="mt-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm font-semibold text-yellow-100">
          {message}
        </p>
      )}
    </div>
  );
}