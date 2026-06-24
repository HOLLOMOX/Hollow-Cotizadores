"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { DuplicateQuoteResponse } from "./actions";

export default function DuplicateQuoteButton({
  quoteId,
  canDuplicate,
  duplicateAction,
}: {
  quoteId: string;
  canDuplicate: boolean;
  duplicateAction: (quoteId: string) => Promise<DuplicateQuoteResponse>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleDuplicate() {
    setMessage("");
    setError("");

    startTransition(async () => {
      const response = await duplicateAction(quoteId);

      if (!response.ok) {
        setError(response.message);
        return;
      }

      setMessage(response.message);

      router.push(`/cotizaciones/${response.id}`);
      router.refresh();
    });
  }

  return (
    <section className="rounded-3xl border border-neutral-800 bg-neutral-900">
      <div className="border-b border-neutral-800 p-5">
        <h2 className="text-lg font-black text-white">Duplicar cotización</h2>

        <p className="mt-1 text-sm text-neutral-500">
          Crea una nueva cotización en borrador usando los mismos datos de esta.
        </p>
      </div>

      <div className="p-5">
        {!canDuplicate && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
            Tu rol no puede duplicar cotizaciones.
          </div>
        )}

        {canDuplicate && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleDuplicate}
            className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black uppercase tracking-wide text-neutral-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Duplicando..." : "Duplicar cotización"}
          </button>
        )}

        {message && (
          <div className="mt-4 rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-200">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
            {error}
          </div>
        )}
      </div>
    </section>
  );
}