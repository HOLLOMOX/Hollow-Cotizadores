"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { QuoteStatus, UpdateQuoteStatusResponse } from "./actions";

const ALL_STATUS_OPTIONS: {
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
    value: "PRODUCCION",
    label: "Producción",
    description: "Proyecto aprobado y enviado a producción.",
  },
  {
    value: "TERMINADA",
    label: "Terminada",
    description: "Proyecto finalizado por producción.",
  },
  {
    value: "CANCELADA",
    label: "Cancelada",
    description: "Cotización cancelada internamente.",
  },
];

function normalizeRole(role: string) {
  return role.trim().toLowerCase();
}

function normalizeStatus(status: string): QuoteStatus {
  const clean = status
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

  if (clean === "PRODUCCIÓN") return "PRODUCCION";
  if (clean === "PRODUCCION") return "PRODUCCION";

  if (
    [
      "BORRADOR",
      "ENVIADA",
      "APROBADA",
      "RECHAZADA",
      "PRODUCCION",
      "TERMINADA",
      "CANCELADA",
    ].includes(clean)
  ) {
    return clean as QuoteStatus;
  }

  return "BORRADOR";
}

function getOptionsByRole(roleRaw: string) {
  const role = normalizeRole(roleRaw);

  if (role === "admin") {
    return ALL_STATUS_OPTIONS;
  }

  if (role === "vendedor") {
    return ALL_STATUS_OPTIONS.filter((option) =>
      ["BORRADOR", "ENVIADA", "APROBADA", "RECHAZADA", "CANCELADA"].includes(
        option.value
      )
    );
  }

  if (role === "produccion" || role === "producción") {
    return ALL_STATUS_OPTIONS.filter((option) =>
      ["PRODUCCION", "TERMINADA"].includes(option.value)
    );
  }

  return [];
}

export default function StatusActions({
  quoteId,
  currentStatus,
  role,
  canChange,
  updateAction,
}: {
  quoteId: string;
  currentStatus: string;
  role: string;
  canChange: boolean;
  updateAction: (
    quoteId: string,
    nextStatus: QuoteStatus
  ) => Promise<UpdateQuoteStatusResponse>;
}) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [selectedStatus, setSelectedStatus] = useState<QuoteStatus>(
    normalizeStatus(currentStatus)
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const options = useMemo(() => getOptionsByRole(role), [role]);

  const canUserChange = canChange && options.length > 0;

  function handleChangeStatus(nextStatus: QuoteStatus) {
    setSelectedStatus(nextStatus);
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
          <span className="font-black text-yellow-300">
            {normalizeStatus(currentStatus)}
          </span>
        </p>
      </div>

      <div className="space-y-4 p-5">
        {!canUserChange && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
            Tu rol puede consultar el estado, pero no puede modificarlo.
          </div>
        )}

        {canUserChange && (
          <div className="grid gap-3">
            <label className="grid gap-1 text-sm">
              <span className="text-neutral-400">Seleccionar estado</span>

              <select
                value={selectedStatus}
                disabled={isPending}
                onChange={(event) =>
                  handleChangeStatus(event.target.value as QuoteStatus)
                }
                className="w-full rounded-2xl border border-neutral-700 bg-yellow-50 px-4 py-3 text-sm font-semibold text-neutral-950 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {options.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              {options.map((status) => {
                const active = status.value === normalizeStatus(currentStatus);

                return (
                  <button
                    key={status.value}
                    type="button"
                    disabled={!canUserChange || isPending || active}
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
          </div>
        )}

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