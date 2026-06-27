import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AccessRow = {
  role: string;
  active: boolean;
  cotizador_limit?: number | null;
  cotizador_used?: number;
  cotizador_remaining?: number | null;
  can_use?: boolean;
};

type QuoteRow = Record<string, unknown>;

type NormalizedQuote = {
  id: string;
  quoteNumber: string;
  title: string;
  status: string;
  cliente: string;
  proyecto: string;
  totalConIva: number;
  precioSinIva: number;
  iva: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  ownerMatches: boolean;
};

type SearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

const STATUS_OPTIONS = [
  "todos",
  "borrador",
  "enviada",
  "aprobada",
  "rechazada",
  "produccion",
  "terminada",
];

export default async function CotizacionesPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const params = searchParams ? await searchParams : {};

  const q = getParam(params.q).trim();
  const status = getParam(params.status).trim().toLowerCase() || "todos";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const access = await getAccess(supabase, user.id);

  if (!access || !access.active) {
    return (
      <BlockedPage
        title="Acceso no autorizado"
        message="Tu usuario no tiene permisos activos para consultar cotizaciones."
      />
    );
  }

  const role = access.role || "invitado";

  const canViewSalePrice =
    role === "admin" || role === "vendedor" || role === "invitado";

  const canViewAllQuotes = role === "admin";

  const { data: quoteRows, error } = await supabase
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    return (
      <BlockedPage
        title="No se pudo cargar el historial"
        message={`Error al consultar la tabla quotes: ${error.message}`}
      />
    );
  }

  const normalizedQuotes = ((quoteRows ?? []) as QuoteRow[])
    .map((row) =>
      normalizeQuote(row, {
        userId: user.id,
        userEmail: user.email ?? "",
      })
    )
    .filter((quote) => quote.id);

  const visibleQuotes = canViewAllQuotes
    ? normalizedQuotes
    : normalizedQuotes.filter((quote) => quote.ownerMatches);

  const filteredQuotes = visibleQuotes.filter((quote) => {
    const text = [
      quote.quoteNumber,
      quote.title,
      quote.cliente,
      quote.proyecto,
      quote.status,
      quote.createdBy,
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = q ? text.includes(q.toLowerCase()) : true;

    const matchesStatus =
      status === "todos" ? true : quote.status.toLowerCase() === status;

    return matchesSearch && matchesStatus;
  });

  const totals = getTotals(filteredQuotes);

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <HeroHeader
          role={role}
          totalQuotes={filteredQuotes.length}
          totalAmount={totals.totalAmount}
          canViewSalePrice={canViewSalePrice}
          canViewAllQuotes={canViewAllQuotes}
        />

        <StatsGrid
          quotes={filteredQuotes}
          canViewSalePrice={canViewSalePrice}
        />

        <FiltersCard q={q} status={status} />

        {filteredQuotes.length > 0 ? (
          <section className="grid gap-4">
            {filteredQuotes.map((quote) => (
              <QuoteCard
                key={quote.id}
                quote={quote}
                canViewSalePrice={canViewSalePrice}
              />
            ))}
          </section>
        ) : (
          <EmptyState />
        )}
      </div>
    </main>
  );
}

async function getAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<AccessRow | null> {
  const { data: accessData, error: accessError } = await supabase.rpc(
    "get_cotizador_access"
  );

  if (!accessError && accessData) {
    const access = Array.isArray(accessData)
      ? (accessData[0] as AccessRow | undefined)
      : (accessData as AccessRow | undefined);

    if (access) return access;
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role,active")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return null;

  return {
    role: String(profile.role ?? "invitado"),
    active: Boolean(profile.active),
  };
}

function normalizeQuote(
  row: QuoteRow,
  user: {
    userId: string;
    userEmail: string;
  }
): NormalizedQuote {
  const id = getString(row, ["id", "quote_id"]);

  const form = getNestedRecord(row, ["form", "quote_form", "form_data"]);
  const result = getNestedRecord(row, [
    "result",
    "quote_result",
    "calculation_result",
  ]);

  const payload = getNestedRecord(row, ["payload", "data"]);

  const payloadForm = getRecord(payload?.form);
  const payloadResult = getRecord(payload?.result);

  const safeForm = form ?? payloadForm ?? {};
  const safeResult = result ?? payloadResult ?? {};

  const costos = getRecord(safeResult.costos);

  const quoteNumber =
    getString(row, ["quote_number", "quoteNumber", "folio", "number"]) ||
    `COT-${id.slice(0, 8).toUpperCase()}`;

  const cliente =
    getString(row, ["customer_name", "client_name", "cliente", "customer"]) ||
    getString(safeForm, ["cliente", "customer_name", "client_name"]) ||
    "Sin cliente";

  const proyecto =
    getString(row, ["project_name", "project", "proyecto"]) ||
    getString(safeForm, ["proyecto", "project_name", "project"]) ||
    "Sin proyecto";

  const title =
    getString(row, ["title", "name"]) ||
    `${quoteNumber} · ${cliente} · ${proyecto}`;

  const statusRaw =
    getString(row, ["status", "estado"]) ||
    getString(safeForm, ["status", "estado"]) ||
    "borrador";

  const status = normalizeStatus(statusRaw);

  const totalConIva =
    getNumber(row, [
      "total_con_iva",
      "totalConIva",
      "total_with_iva",
      "total",
      "amount",
    ]) ||
    getNumber(costos, ["totalConIva", "total_con_iva", "total"]);

  const precioSinIva =
    getNumber(row, ["precio_sin_iva", "precioSinIva", "subtotal"]) ||
    getNumber(costos, ["precioSinIva", "precio_sin_iva", "subtotal"]);

  const iva =
    getNumber(row, ["iva", "tax"]) || getNumber(costos, ["iva", "tax"]);

  const createdAt =
    getString(row, ["created_at", "createdAt", "date"]) || "";

  const updatedAt =
    getString(row, ["updated_at", "updatedAt"]) || createdAt;

  const createdBy =
    getString(row, [
      "created_by_email",
      "user_email",
      "email",
      "createdByEmail",
      "seller_email",
    ]) ||
    getString(safeForm, ["vendedor", "seller", "email"]) ||
    "Sin usuario";

  const ownerCandidates = [
    getString(row, ["created_by", "created_by_id", "user_id", "owner_id"]),
    getString(row, ["created_by_email", "user_email", "email"]),
    getString(safeForm, ["user_id", "created_by"]),
    getString(safeForm, ["email", "vendedor"]),
  ].filter(Boolean);

  const ownerMatches = ownerCandidates.some((candidate) => {
    const value = candidate.toLowerCase();

    return (
      value === user.userId.toLowerCase() ||
      value === user.userEmail.toLowerCase()
    );
  });

  return {
    id,
    quoteNumber,
    title,
    status,
    cliente,
    proyecto,
    totalConIva,
    precioSinIva,
    iva,
    createdAt,
    updatedAt,
    createdBy,
    ownerMatches,
  };
}

function getTotals(quotes: NormalizedQuote[]) {
  return {
    totalAmount: quotes.reduce((sum, quote) => sum + quote.totalConIva, 0),
  };
}

function HeroHeader({
  role,
  totalQuotes,
  totalAmount,
  canViewSalePrice,
  canViewAllQuotes,
}: {
  role: string;
  totalQuotes: number;
  totalAmount: number;
  canViewSalePrice: boolean;
  canViewAllQuotes: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-900 to-yellow-500/10 shadow-2xl shadow-black/20">
      <div className="grid gap-6 p-5 md:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-yellow-400/40 bg-yellow-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-yellow-300 sm:text-xs">
              Hollow Cotizadores
            </span>

            <span className="rounded-full border border-neutral-700 bg-neutral-950 px-3 py-1 text-[10px] font-bold uppercase text-neutral-300 sm:text-xs">
              Rol: {role}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-white md:text-4xl">
            Historial de cotizaciones
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">
            Consulta cotizaciones guardadas, revisa estados y abre el detalle de
            cada proyecto.
          </p>

          <p className="mt-3 text-xs font-semibold text-neutral-500">
            {canViewAllQuotes
              ? "Mostrando cotizaciones de todos los usuarios."
              : "Mostrando únicamente cotizaciones relacionadas con tu usuario."}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
          <HeroMetric title="Cotizaciones" value={`${totalQuotes}`} />

          <HeroMetric
            title="Importe visible"
            value={canViewSalePrice ? money(totalAmount) : "Oculto"}
          />
        </div>
      </div>
    </section>
  );
}

function HeroMetric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
        {title}
      </p>

      <p className="mt-2 break-words text-2xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function StatsGrid({
  quotes,
  canViewSalePrice,
}: {
  quotes: NormalizedQuote[];
  canViewSalePrice: boolean;
}) {
  const borrador = quotes.filter((q) => q.status === "borrador").length;
  const aprobada = quotes.filter((q) => q.status === "aprobada").length;
  const produccion = quotes.filter((q) => q.status === "produccion").length;
  const total = quotes.reduce((sum, quote) => sum + quote.totalConIva, 0);

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Borrador" value={`${borrador}`} />
      <StatCard title="Aprobadas" value={`${aprobada}`} />
      <StatCard title="Producción" value={`${produccion}`} />
      <StatCard
        title="Total cotizado"
        value={canViewSalePrice ? money(total) : "Oculto"}
      />
    </section>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-400">
        {title}
      </p>

      <p className="mt-2 break-words text-2xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function FiltersCard({ q, status }: { q: string; status: string }) {
  return (
    <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-4 sm:p-5">
      <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-end">
        <label className="grid gap-1 text-sm">
          <span className="text-neutral-400">Buscar</span>

          <input
            name="q"
            defaultValue={q}
            placeholder="Cliente, proyecto, folio, usuario..."
            className="w-full rounded-2xl border border-neutral-700 bg-yellow-50 px-4 py-3 text-sm font-semibold text-neutral-950 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-neutral-400">Estado</span>

          <select
            name="status"
            defaultValue={status}
            className="w-full rounded-2xl border border-neutral-700 bg-yellow-50 px-4 py-3 text-sm font-semibold text-neutral-950 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {getStatusLabel(option)}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <button
            type="submit"
            className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black uppercase tracking-wide text-neutral-950 transition hover:bg-yellow-300"
          >
            Filtrar
          </button>

          <Link
            href="/cotizaciones"
            className="rounded-2xl border border-neutral-700 bg-neutral-950 px-5 py-3 text-center text-sm font-black uppercase tracking-wide text-neutral-200 transition hover:border-yellow-400 hover:text-yellow-300"
          >
            Limpiar
          </Link>
        </div>
      </form>
    </section>
  );
}

function QuoteCard({
  quote,
  canViewSalePrice,
}: {
  quote: NormalizedQuote;
  canViewSalePrice: boolean;
}) {
  const statusMeta = getStatusMeta(quote.status);

  return (
    <article className="rounded-3xl border border-neutral-800 bg-neutral-900 p-4 shadow-2xl shadow-black/20 transition hover:border-neutral-700 sm:p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-yellow-400/40 bg-yellow-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
              {quote.quoteNumber}
            </span>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${statusMeta.className}`}
            >
              {statusMeta.label}
            </span>
          </div>

          <h2 className="mt-4 truncate text-xl font-black text-white">
            {quote.title}
          </h2>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <InfoItem title="Cliente" value={quote.cliente} />
            <InfoItem title="Proyecto" value={quote.proyecto} />
            <InfoItem title="Fecha" value={formatDate(quote.createdAt)} />
            <InfoItem title="Guardó" value={quote.createdBy} />
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
            Total
          </p>

          <p className="mt-2 break-words text-2xl font-black text-white">
            {canViewSalePrice ? money(quote.totalConIva) : "Oculto"}
          </p>

          <div className="mt-4 grid gap-2">
            <Link
              href={`/cotizaciones/${quote.id}`}
              className="rounded-2xl bg-yellow-400 px-4 py-3 text-center text-sm font-black uppercase tracking-wide text-neutral-950 transition hover:bg-yellow-300"
            >
              Ver detalle
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function InfoItem({ title, value }: { title: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-neutral-500">
        {title}
      </p>

      <p className="mt-1 truncate text-sm font-bold text-white">
        {value || "—"}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-yellow-400/10 text-3xl">
        📄
      </div>

      <h2 className="mt-5 text-2xl font-black text-white">
        No hay cotizaciones para mostrar
      </h2>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-neutral-400">
        Prueba limpiando filtros o guarda una nueva cotización desde el
        cotizador de cajas de luz.
      </p>

      <Link
        href="/cotizadores/cajas-luz"
        className="mt-6 inline-flex rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black uppercase tracking-wide text-neutral-950 transition hover:bg-yellow-300"
      >
        Ir al cotizador
      </Link>
    </section>
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

        <Link
          href="/"
          className="mt-8 inline-flex rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black uppercase tracking-wide text-neutral-950 transition hover:bg-yellow-300"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}

function getParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function getRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function getNestedRecord(
  row: Record<string, unknown> | null | undefined,
  keys: string[]
): Record<string, unknown> | null {
  if (!row) return null;

  for (const key of keys) {
    const value = row[key];
    const record = getRecord(value);

    if (record) return record;
  }

  return null;
}

function getString(row: Record<string, unknown> | null | undefined, keys: string[]) {
  if (!row) return "";

  for (const key of keys) {
    const value = row[key];

    if (typeof value === "string" && value.trim()) return value.trim();

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return "";
}

function getNumber(row: Record<string, unknown> | null | undefined, keys: string[]) {
  if (!row) return 0;

  for (const key of keys) {
    const value = row[key];

    if (typeof value === "number" && Number.isFinite(value)) return value;

    if (typeof value === "string") {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return 0;
}

function normalizeStatus(status: string) {
  const clean = status
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (clean === "draft") return "borrador";
  if (clean === "sent") return "enviada";
  if (clean === "approved") return "aprobada";
  if (clean === "rejected") return "rechazada";
  if (clean === "production") return "produccion";
  if (clean === "finished") return "terminada";

  if (
    [
      "borrador",
      "enviada",
      "aprobada",
      "rechazada",
      "produccion",
      "terminada",
    ].includes(clean)
  ) {
    return clean;
  }

  return "borrador";
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    todos: "Todos",
    borrador: "Borrador",
    enviada: "Enviada",
    aprobada: "Aprobada",
    rechazada: "Rechazada",
    produccion: "Producción",
    terminada: "Terminada",
  };

  return labels[status] ?? status;
}

function getStatusMeta(status: string) {
  const normalized = normalizeStatus(status);

  const meta: Record<
    string,
    {
      label: string;
      className: string;
    }
  > = {
    borrador: {
      label: "Borrador",
      className: "border-neutral-600 bg-neutral-800 text-neutral-200",
    },
    enviada: {
      label: "Enviada",
      className: "border-blue-500/40 bg-blue-500/10 text-blue-200",
    },
    aprobada: {
      label: "Aprobada",
      className: "border-green-500/40 bg-green-500/10 text-green-200",
    },
    rechazada: {
      label: "Rechazada",
      className: "border-red-500/40 bg-red-500/10 text-red-200",
    },
    produccion: {
      label: "Producción",
      className: "border-yellow-500/40 bg-yellow-500/10 text-yellow-200",
    },
    terminada: {
      label: "Terminada",
      className: "border-purple-500/40 bg-purple-500/10 text-purple-200",
    },
  };

  return meta[normalized] ?? meta.borrador;
}

function formatDate(value: string) {
  if (!value) return "Sin fecha";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function money(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value || 0);
}