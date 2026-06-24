"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type {
  QuoteStatus,
  UpdateQuoteStatusResponse,
} from "./actions";

const STATUS_OPTIONS: {
  value: QuoteStatus;
  label: string;
  description: string;
}[] = [
  {
    value: "BORRADOR",
    label: "Borrador",
    description: "Cotización en preparación.",
  },
  {
    value: "ENVIADA",
    label: "Enviada",
    description: "Cotización enviada al cliente.",
  },
  {
    value: "APROBADA",
    label: "Aprobada",
    description: "Cliente aprobó la cotización.",
  },
  {
    value: "RECHAZADA",
    label: "Rechazada",
    description: "Cliente rechazó la cotización.",
  },
  {
    value: "CANCELADA",
    label: "Cancelada",
    description: "Cotización cancelada internamente.",
  },
];

export default function StatusActions({
  quoteId,
  currentStatus,
  canChange,
  updateAction,
}: {
  quoteId: string;
  currentStatus: QuoteStatus;
  canChange: boolean;
  updateAction: (
    quoteId: string,
    nextStatus: QuoteStatus
  ) => Promise<UpdateQuoteStatusResponse>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleChangeStatus(nextStatus: QuoteStatus) {
    setMessage("");
    setError("");

    startTransition(async () => {
      const response = await updateAction(quoteId, nextStatus);

      if (!response.ok) {
        setError(response.message);
        return;
      }

      setMessage(response.message);
      router.refresh();
    });
  }

  return (
    <section className="rounded-3xl border border-neutral-800 bg-neutral-900">
      <div className="border-b border-neutral-800 p-5">
        <h2 className="text-lg font-black text-white">
          Estado de la cotización
        </h2>

        <p className="mt-1 text-sm text-neutral-500">
          Estado actual:{" "}
          <span className="font-black text-yellow-300">{currentStatus}</span>
        </p>
      </div>

      <div className="space-y-4 p-5">
        {!canChange && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
            Tu rol no puede cambiar el estado de esta cotización.
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-5">
          {STATUS_OPTIONS.map((status) => {
            const active = status.value === currentStatus;

            return (
              <button
                key={status.value}
                type="button"
                disabled={!canChange || isPending || active}
                onClick={() => handleChangeStatus(status.value)}
                className={[
                  "rounded-2xl border px-4 py-4 text-left transition",
                  active
                    ? "border-yellow-400 bg-yellow-400 text-neutral-950"
                    : "border-neutral-700 bg-neutral-950 text-neutral-200 hover:border-yellow-400 hover:text-yellow-300",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                ].join(" ")}
              >
                <p className="text-sm font-black uppercase">
                  {status.label}
                </p>

                <p className="mt-2 text-xs leading-5 opacity-80">
                  {status.description}
                </p>
              </button>
            );
          })}
        </div>

        {isPending && (
          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm font-semibold text-yellow-200">
            Actualizando estado...
          </div>
        )}

        {message && (
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-200">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
            {error}
          </div>
        )}
      </div>
    </section>
  );
}