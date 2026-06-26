import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import type {
  CostRow,
  DesignOption,
  InstallationCondition,
  TransportZone,
} from "./_lib/types";
import CajasLuzForm from "./CajasLuzForm";
import GuestUsageGate from "./GuestUsageGate";
import { consumeGuestCotizadorUse, saveCajaLuzQuote } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

type TransportZoneRow = {
  code: string;
  label: string;
  display_name: string | null;
  coverage_text: string | null;
  work_cost: number | string;
  delivery_cost: number | string;
  delivery_discount_percent: number | string;
  active: boolean;
  sort_order: number;
  notes: string | null;
};

type DesignOptionRow = {
  code: string;
  label: string;
  minutes: number | string;
  price: number | string;
  active: boolean;
  sort_order: number;
  notes: string | null;
};

const FALLBACK_DESIGN_OPTIONS: DesignOption[] = [
  {
    code: "NO_DISENO",
    label: "NO LLEVA DISEÑO",
    minutes: 0,
    price: 0,
    active: true,
    sort_order: 0,
  },
  {
    code: "DISENO_15_MIN",
    label: "15 MIN. DE DISEÑO GRÁFICO",
    minutes: 15,
    price: 80,
    active: true,
    sort_order: 10,
  },
  {
    code: "DISENO_30_MIN",
    label: "30 MIN. DE DISEÑO GRÁFICO",
    minutes: 30,
    price: 155,
    active: true,
    sort_order: 20,
  },
  {
    code: "DISENO_45_MIN",
    label: "45 MIN. DE DISEÑO GRÁFICO",
    minutes: 45,
    price: 230,
    active: true,
    sort_order: 30,
  },
  {
    code: "DISENO_60_MIN",
    label: "60 MIN. DE DISEÑO GRÁFICO",
    minutes: 60,
    price: 305,
    active: true,
    sort_order: 40,
  },
  {
    code: "DISENO_90_MIN",
    label: "90 MIN. DE DISEÑO GRÁFICO",
    minutes: 90,
    price: 385,
    active: true,
    sort_order: 50,
  },
  {
    code: "DISENO_120_MIN",
    label: "120 MIN. DE DISEÑO GRÁFICO",
    minutes: 120,
    price: 455,
    active: true,
    sort_order: 60,
  },
  {
    code: "DISENO_150_MIN",
    label: "150 MIN. DE DISEÑO GRÁFICO",
    minutes: 150,
    price: 530,
    active: true,
    sort_order: 70,
  },
  {
    code: "DISENO_180_MIN",
    label: "180 MIN. DE DISEÑO GRÁFICO",
    minutes: 180,
    price: 610,
    active: true,
    sort_order: 80,
  },
  {
    code: "DISENO_240_MIN",
    label: "240 MIN. DE DISEÑO GRÁFICO",
    minutes: 240,
    price: 685,
    active: true,
    sort_order: 90,
  },
];

const FALLBACK_INSTALLATION_CONDITIONS: InstallationCondition[] = [
  {
    code: "NIVEL_PISO_BAJA_ALTURA",
    label: "A NIVEL DE PISO / BAJA ALTURA",
    percent_extra: 0,
    active: true,
    sort_order: 10,
  },
  {
    code: "A_3_METROS",
    label: "A 3 METROS",
    percent_extra: 10,
    active: true,
    sort_order: 20,
  },
  {
    code: "A_4_METROS",
    label: "A 4 METROS",
    percent_extra: 15,
    active: true,
    sort_order: 30,
  },
  {
    code: "MAYOR_A_4_METROS",
    label: "MAYOR A 4 METROS",
    percent_extra: 25,
    active: true,
    sort_order: 40,
  },
  {
    code: "CON_ESCALERA",
    label: "CON ESCALERA",
    percent_extra: 15,
    active: true,
    sort_order: 50,
  },
  {
    code: "CON_ANDAMIOS",
    label: "CON ANDAMIOS",
    percent_extra: 25,
    active: true,
    sort_order: 60,
  },
  {
    code: "EN_FACHADA",
    label: "EN FACHADA",
    percent_extra: 20,
    active: true,
    sort_order: 70,
  },
  {
    code: "EN_TECHO",
    label: "EN TECHO",
    percent_extra: 30,
    active: true,
    sort_order: 80,
  },
  {
    code: "EN_ALTURA_CON_DESCOLGADA",
    label: "EN ALTURA CON DESCOLGADA",
    percent_extra: 40,
    active: true,
    sort_order: 90,
  },
  {
    code: "INSTALACION_ESPECIAL",
    label: "INSTALACIÓN ESPECIAL",
    percent_extra: 50,
    active: true,
    sort_order: 100,
  },
];

const FALLBACK_TRANSPORT_ZONES: TransportZone[] = [
  {
    code: "ZONA_A",
    label: "ZONA - A",
    display_name: "ZONA A — Zona cercana / base",
    coverage_text: "Agregar colonias o límites reales de la Zona A.",
    work_cost: 100,
    delivery_cost: 55,
    delivery_discount_percent: 45,
    active: true,
    sort_order: 10,
  },
  {
    code: "ZONA_B",
    label: "ZONA - B",
    display_name: "ZONA B — Zona urbana extendida",
    coverage_text: "Agregar colonias o límites reales de la Zona B.",
    work_cost: 170,
    delivery_cost: 110,
    delivery_discount_percent: 35.29,
    active: true,
    sort_order: 20,
  },
  {
    code: "ZONA_C",
    label: "ZONA - C",
    display_name: "ZONA C — Zona media / mayor distancia",
    coverage_text: "Agregar colonias o límites reales de la Zona C.",
    work_cost: 240,
    delivery_cost: 160,
    delivery_discount_percent: 33.33,
    active: true,
    sort_order: 30,
  },
  {
    code: "ZONA_D",
    label: "ZONA - D",
    display_name: "ZONA D — Zona lejana",
    coverage_text: "Agregar colonias o límites reales de la Zona D.",
    work_cost: 400,
    delivery_cost: 300,
    delivery_discount_percent: 25,
    active: true,
    sort_order: 40,
  },
  {
    code: "ZONA_E",
    label: "ZONA - E",
    display_name: "ZONA E — Zona foránea / especial",
    coverage_text: "Agregar colonias o límites reales de la Zona E.",
    work_cost: 480,
    delivery_cost: 360,
    delivery_discount_percent: 25,
    active: true,
    sort_order: 50,
  },
];

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

  const { data: conditionRows, error: conditionError } = await supabase
    .from("installation_conditions")
    .select("code,label,percent_extra,active,sort_order,notes")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  const { data: transportRows, error: transportError } = await supabase
    .from("transport_zones")
    .select(
      "code,label,display_name,coverage_text,work_cost,delivery_cost,delivery_discount_percent,active,sort_order,notes"
    )
    .eq("active", true)
    .order("sort_order", { ascending: true });

  const { data: designRows, error: designError } = await supabase
    .from("design_options")
    .select("code,label,minutes,price,active,sort_order,notes")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  const rows = (costRows ?? []) as CostRow[];

  const installationConditionsFromDb: InstallationCondition[] = (
    (conditionRows ?? []) as InstallationConditionRow[]
  ).map((condition) => ({
    code: condition.code,
    label: condition.label,
    percent_extra: Number(condition.percent_extra ?? 0),
    active: condition.active,
    sort_order: condition.sort_order,
    notes: condition.notes,
  }));

  const transportZonesFromDb: TransportZone[] = (
    (transportRows ?? []) as TransportZoneRow[]
  ).map((zone) => ({
    code: zone.code,
    label: zone.label,
    display_name: zone.display_name,
    coverage_text: zone.coverage_text,
    work_cost: Number(zone.work_cost ?? 0),
    delivery_cost: Number(zone.delivery_cost ?? 0),
    delivery_discount_percent: Number(zone.delivery_discount_percent ?? 0),
    active: zone.active,
    sort_order: zone.sort_order,
    notes: zone.notes,
  }));

  const designOptionsFromDb: DesignOption[] = (
    (designRows ?? []) as DesignOptionRow[]
  ).map((design) => ({
    code: design.code,
    label: design.label,
    minutes: Number(design.minutes ?? 0),
    price: Number(design.price ?? 0),
    active: design.active,
    sort_order: design.sort_order,
    notes: design.notes,
  }));

  const installationConditions =
    !conditionError && installationConditionsFromDb.length > 0
      ? installationConditionsFromDb
      : FALLBACK_INSTALLATION_CONDITIONS;

  const transportZones =
    !transportError && transportZonesFromDb.length > 0
      ? transportZonesFromDb
      : FALLBACK_TRANSPORT_ZONES;

  const designOptions =
    !designError && designOptionsFromDb.length > 0
      ? designOptionsFromDb
      : FALLBACK_DESIGN_OPTIONS;

  if (access.role === "invitado") {
    return (
      <main className="min-h-screen bg-neutral-950 px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <GuestUsageGate
            costRows={rows}
            installationConditions={installationConditions}
            transportZones={transportZones}
            designOptions={designOptions}
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
      <div className="mx-auto w-full max-w-7xl">
        <CajasLuzForm
          costRows={rows}
          installationConditions={installationConditions}
          transportZones={transportZones}
          designOptions={designOptions}
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