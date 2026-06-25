import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import type { CostRow, InstallationCondition } from "./_lib/types";
import CajasLuzForm from "./CajasLuzForm";
import GuestUsageGate from "./GuestUsageGate";
import { consumeGuestCotizadorUse, saveCajaLuzQuote } from "./actions";

type AccessRow = {
  role: string;
  active: boolean;
  cotizador_limit: number | null;
  cotizador_used: number;
  cotizador_remaining: number | null;
  can_use: boolean;
};

type InstallationConditionRow = {
  code: string;
  label: string;
  percent_extra: number | string;
  active: boolean;
  sort_order: number;
  notes: string | null;
};

export default async function CajasLuzPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: accessData, error: accessError } = await supabase.rpc(
    "get_cotizador_access"
  );

  const access = Array.isArray(accessData)
    ? (accessData[0] as AccessRow | undefined)
    : (accessData as AccessRow | undefined);

  if (accessError || !access) {
    return (
      <BlockedPage
        title="No se pudo validar tu acceso"
        message="Tu usuario no tiene perfil asignado o hubo un error al validar permisos. Revisa user_profiles en Supabase."
      />
    );
  }

  if (!access.active) {
    return (
      <BlockedPage
        title="Usuario inactivo"
        message="Tu usuario está desactivado. Contacta al administrador."
      />
    );
  }

  if (!access.can_use && access.role === "invitado") {
    return (
      <BlockedPage
        title="Límite de invitado agotado"
        message="Esta cuenta invitada ya usó las oportunidades disponibles para el cotizador."
      />
    );
  }

  const { data: costRows, error: costError } = await supabase
    .from("cost_catalog")
    .select("sku,name,unit,cost,sale_price")
    .eq("active", true)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (costError) {
    return (
      <BlockedPage
        title="No se pudo cargar el catálogo"
        message="Hubo un error cargando los costos. Revisa permisos RLS de cost_catalog."
      />
    );
  }

  const { data: conditionRows } = await supabase
    .from("installation_conditions")
    .select("code,label,percent_extra,active,sort_order,notes")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  const rows = (costRows ?? []) as CostRow[];

  const installationConditions: InstallationCondition[] = (
    (conditionRows ?? []) as InstallationConditionRow[]
  ).map((condition) => ({
    code: condition.code,
    label: condition.label,
    percent_extra: Number(condition.percent_extra ?? 0),
    active: condition.active,
    sort_order: condition.sort_order,
    notes: condition.notes,
  }));

  if (access.role === "invitado") {
    return (
      <main className="min-h-screen bg-neutral-950 px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <GuestUsageGate
            costRows={rows}
            installationConditions={installationConditions}
            initialLimit={access.cotizador_limit}
            initialUsed={access.cotizador_used}
            initialRemaining={access.cotizador_remaining}
            consumeAction={consumeGuestCotizadorUse}
            saveAction={saveCajaLuzQuote}
            userRole={access.role}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-400">
            Hollow Cotizadores
          </p>

          <h1 className="mt-2 text-2xl font-black">
            Cotizador de cajas de luz
          </h1>

          <p className="mt-1 text-sm text-neutral-400">
            Usuario: {user.email} · Rol: {access.role}
          </p>
        </div>

        <CajasLuzForm
          costRows={rows}
          installationConditions={installationConditions}
          saveAction={saveCajaLuzQuote}
          userRole={access.role}
        />
      </div>
    </main>
  );
}

function BlockedPage({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
      <div className="w-full max-w-xl rounded-3xl border border-neutral-800 bg-neutral-900 p-8 text-center shadow-2xl shadow-black/40">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-2xl">
          ⚠️
        </div>

        <h1 className="mt-6 text-2xl font-black">{title}</h1>

        <p className="mt-3 text-sm leading-6 text-neutral-400">{message}</p>

        <a
          href="/"
          className="mt-8 inline-flex rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black uppercase tracking-wide text-neutral-950 transition hover:bg-yellow-300"
        >
          Volver al inicio
        </a>
      </div>
    </main>
  );
}