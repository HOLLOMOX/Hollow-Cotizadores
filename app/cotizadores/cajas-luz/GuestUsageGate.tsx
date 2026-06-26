"use client";

import { useState, useTransition } from "react";
import type {
  CostRow,
  InstallationCondition,
  TransportZone,
} from "./_lib/types";
import CajasLuzForm from "./CajasLuzForm";
import type {
  ConsumeCotizadorResponse,
  SaveQuotePayload,
  SaveQuoteResponse,
} from "./actions";

export default function GuestUsageGate({
  costRows,
  installationConditions,
  transportZones,
  initialLimit,
  initialUsed,
  initialRemaining,
  consumeAction,
  saveAction,
  userRole,
}: {
  costRows: CostRow[];
  installationConditions: InstallationCondition[];
  transportZones: TransportZone[];
  initialLimit: number | null;
  initialUsed: number;
  initialRemaining: number | null;
  consumeAction: () => Promise<ConsumeCotizadorResponse>;
  saveAction: (payload: SaveQuotePayload) => Promise<SaveQuoteResponse>;
  userRole: string;
}) {
  const [activated, setActivated] = useState(false);
  const [used, setUsed] = useState(initialUsed);
  const [remaining, setRemaining] = useState(initialRemaining);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const limit = initialLimit ?? 5;
  const remainingSafe = remaining ?? Math.max(limit - used, 0);
  const agotado = remainingSafe <= 0 && !activated;

  function handleActivate() {
    setMessage("");

    startTransition(async () => {
      const result = await consumeAction();

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setUsed(result.cotizadorUsed);
      setRemaining(result.cotizadorRemaining);
      setActivated(true);
    });
  }

  if (activated) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-300">
            Modo invitado activo
          </p>

          <h1 className="mt-2 text-xl font-black text-white">
            Uso de cotizador activado
          </h1>

          <p className="mt-2 text-sm text-yellow-100">
            Esta sesión ya consumió 1 uso. Usos restantes después de este:{" "}
            <span className="font-black">{remaining ?? 0}</span>.
          </p>

          <p className="mt-2 text-xs text-yellow-200/80">
            La cuenta invitada no puede ver materiales, costos internos ni
            precios de productos.
          </p>
        </div>

        <CajasLuzForm
          costRows={costRows}
          installationConditions={installationConditions}
          transportZones={transportZones}
          saveAction={saveAction}
          userRole={userRole}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-2xl rounded-3xl border border-neutral-800 bg-neutral-900 p-8 text-center shadow-2xl shadow-black/40">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-500/10 text-3xl">
          👤
        </div>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.25em] text-yellow-400">
          Acceso invitado Hollow
        </p>

        <h1 className="mt-3 text-3xl font-black text-white">
          Cotizador limitado
        </h1>

        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-neutral-400">
          Esta cuenta puede usar el cotizador solo{" "}
          <span className="font-bold text-white">{limit}</span> veces. Cada vez
          que presiones el botón para usar el cotizador se descontará 1 uso.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <MetricCard title="Límite" value={`${limit}`} />
          <MetricCard title="Usados" value={`${used}`} />
          <MetricCard title="Restantes" value={`${remainingSafe}`} />
        </div>

        {message && (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
            {message}
          </div>
        )}

        {agotado ? (
          <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
            <p className="text-sm font-bold text-red-200">
              Esta cuenta invitada ya agotó sus usos disponibles.
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleActivate}
            disabled={isPending}
            className="mt-8 w-full rounded-2xl bg-yellow-400 px-5 py-4 text-sm font-black uppercase tracking-wide text-neutral-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Activando uso..." : "Usar cotizador"}
          </button>
        )}

        <a
          href="/"
          className="mt-5 inline-flex text-sm font-semibold text-neutral-500 transition hover:text-white"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
      <p className="text-xs uppercase tracking-wide text-neutral-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}