import Link from "next/link";
import { redirect } from "next/navigation";
import AccessDenied from "@/components/AccessDenied";
import { getCurrentUserProfile } from "@/utils/auth/permissions";

export const dynamic = "force-dynamic";

type QuoteRow = {
  id: string;
  user_id: string | null;
  quote_number: string | null;
  title: string | null;
  quote_type: string | null;
  client_name: string | null;
  seller_name: string | null;
  project_name: string | null;
  total_with_tax: number | null;
  price_without_tax: number | null;
  status: string | null;
  created_at: string;
};

export default async function CotizacionesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    status?: string;
    q?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const { user, profile, supabase } = await getCurrentUserProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile || profile.active === false) {
    return <AccessDenied profile={profile} section="Historial de cotizaciones" />;
  }

  if (profile.role === "invitado") {
    return <AccessDenied profile={profile} section="Historial de cotizaciones" />;
  }

  const isAdmin = profile.role === "admin";

  let query = supabase
    .from("quotes")
    .select(
      `
      id,
      user_id,
      quote_number,
      title,
      quote_type,
      client_name,
      seller_name,
      project_name,
      total_with_tax,
      price_without_tax,
      status,
      created_at
    `
    )
    .eq("quote_type", "CAJA_LUZ")
    .order("created_at", { ascending: false })
    .limit(100);

  if (!isAdmin) {
    query = query.eq("user_id", user.id);
  }

  if (params.status && params.status !== "TODAS") {
    query = query.eq("status", params.status);
  }

  const { data, error } = await query;

  let quotes = (data ?? []) as QuoteRow[];

  const search = (params.q ?? "").trim().toLowerCase();

  if (search) {
    quotes = quotes.filter((quote) => {
      const text = [
        quote.quote_number,
        quote.title,
        quote.client_name,
        quote.seller_name,
        quote.project_name,
        quote.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(search);
    });
  }

  const totalCotizado = quotes.reduce(
    (sum, quote) => sum + Number(quote.total_with_tax ?? 0),
    0
  );

  const borradores = quotes.filter((quote) => quote.status === "BORRADOR").length;
  const aprobadas = quotes.filter((quote) => quote.status === "APROBADA").length;

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-400">
            Hollow Cotizadores
          </p>

          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black">Historial de cotizaciones</h1>

              <p className="mt-2 text-sm text-neutral-400">
                Consulta las cotizaciones guardadas de cajas de luz.
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                Usuario: {profile.email} · Rol: {profile.role}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <NavButton href="/" label="Inicio" />
              <NavButton href="/cotizadores/cajas-luz" label="Nueva cotización" />
              {isAdmin && <NavButton href="/admin" label="Admin" />}
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
            No se pudieron cargar las cotizaciones: {error.message}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Cotizaciones"
            value={String(quotes.length)}
            description="Registros encontrados"
          />

          <MetricCard
            title="Borradores"
            value={String(borradores)}
            description="Pendientes de enviar"
          />

          <MetricCard
            title="Aprobadas"
            value={String(aprobadas)}
            description="Cotizaciones ganadas"
          />

          <MetricCard
            title="Total listado"
            value={money(totalCotizado)}
            description="Suma con IVA"
          />
        </section>

        <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5">
          <form className="grid gap-4 md:grid-cols-12">
            <label className="grid gap-2 md:col-span-5">
              <span className="text-xs font-bold uppercase tracking-wide text-neutral-500">
                Buscar
              </span>

              <input
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Cliente, proyecto, vendedor o número..."
                className="rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400"
              />
            </label>

            <label className="grid gap-2 md:col-span-3">
              <span className="text-xs font-bold uppercase tracking-wide text-neutral-500">
                Estado
              </span>

              <select
                name="status"
                defaultValue={params.status ?? "TODAS"}
                className="rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400"
              >
                <option value="TODAS">Todas</option>
                <option value="BORRADOR">Borrador</option>
                <option value="ENVIADA">Enviada</option>
                <option value="APROBADA">Aprobada</option>
                <option value="RECHAZADA">Rechazada</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </label>

            <div className="flex items-end gap-3 md:col-span-4">
              <button
                type="submit"
                className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black uppercase tracking-wide text-neutral-950 transition hover:bg-yellow-300"
              >
                Filtrar
              </button>

              <Link
                href="/cotizaciones"
                className="rounded-2xl border border-neutral-700 bg-neutral-950 px-5 py-3 text-sm font-bold text-neutral-300 transition hover:border-yellow-400 hover:text-yellow-300"
              >
                Limpiar
              </Link>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-neutral-800 bg-neutral-900">
          <div className="border-b border-neutral-800 p-5">
            <h2 className="text-lg font-black">Cotizaciones guardadas</h2>
            <p className="mt-1 text-sm text-neutral-500">
              {isAdmin
                ? "Como administrador puedes ver todas las cotizaciones."
                : "Solo estás viendo tus propias cotizaciones."}
            </p>
          </div>

          <div className="overflow-x-auto p-5">
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="border-b border-neutral-800 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="px-3 py-3">Número</th>
                  <th className="px-3 py-3">Título</th>
                  <th className="px-3 py-3">Cliente</th>
                  <th className="px-3 py-3">Proyecto</th>
                  <th className="px-3 py-3">Vendedor</th>
                  <th className="px-3 py-3 text-right">Total</th>
                  <th className="px-3 py-3">Estado</th>
                  <th className="px-3 py-3">Fecha</th>
                  <th className="px-3 py-3 text-right">Acción</th>
                </tr>
              </thead>

              <tbody>
                {quotes.map((quote) => (
                  <tr key={quote.id} className="border-b border-neutral-800">
                    <td className="px-3 py-3 align-top">
                      <span className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 font-mono text-xs font-bold text-yellow-300">
                        {quote.quote_number ?? "Sin número"}
                      </span>
                    </td>

                    <td className="px-3 py-3 align-top font-semibold text-white">
                      {quote.title ?? "Cotización sin título"}
                    </td>

                    <td className="px-3 py-3 align-top text-neutral-300">
                      {quote.client_name ?? "—"}
                    </td>

                    <td className="px-3 py-3 align-top text-neutral-400">
                      {quote.project_name ?? "—"}
                    </td>

                    <td className="px-3 py-3 align-top text-neutral-400">
                      {quote.seller_name ?? "—"}
                    </td>

                    <td className="px-3 py-3 text-right align-top font-bold text-white">
                      {money(Number(quote.total_with_tax ?? 0))}
                    </td>

                    <td className="px-3 py-3 align-top">
                      <StatusBadge status={quote.status ?? "BORRADOR"} />
                    </td>

                    <td className="px-3 py-3 align-top text-neutral-500">
                      {formatDate(quote.created_at)}
                    </td>

                    <td className="px-3 py-3 text-right align-top">
                      <Link
                        href={`/cotizaciones/${quote.id}`}
                        className="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black uppercase tracking-wide text-neutral-950 transition hover:bg-yellow-300"
                      >
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}

                {quotes.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-3 py-10 text-center text-neutral-500"
                    >
                      No hay cotizaciones guardadas con esos filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function NavButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-2 text-sm font-bold text-neutral-200 transition hover:border-yellow-400 hover:text-yellow-300"
    >
      {label}
    </Link>
  );
}

function MetricCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
        {title}
      </p>

      <p className="mt-3 break-words text-2xl font-black text-white">{value}</p>

      <p className="mt-2 text-xs leading-5 text-neutral-500">{description}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    BORRADOR: "border-neutral-500/30 bg-neutral-500/10 text-neutral-300",
    ENVIADA: "border-blue-500/30 bg-blue-500/10 text-blue-300",
    APROBADA: "border-green-500/30 bg-green-500/10 text-green-300",
    RECHAZADA: "border-red-500/30 bg-red-500/10 text-red-300",
    CANCELADA: "border-orange-500/30 bg-orange-500/10 text-orange-300",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${
        styles[status] ?? styles.BORRADOR
      }`}
    >
      {status}
    </span>
  );
}

function money(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value || 0);
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}