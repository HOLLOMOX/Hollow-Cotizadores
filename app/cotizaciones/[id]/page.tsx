import Link from "next/link";
import { Fragment } from "react";
import { notFound, redirect } from "next/navigation";
import AccessDenied from "@/components/AccessDenied";
import { getCurrentUserProfile } from "@/utils/auth/permissions";
import StatusActions from "./StatusActions";
import { updateQuoteStatus, type QuoteStatus } from "./actions";

export const dynamic = "force-dynamic";

type MaterialLine = {
  grupo?: string;
  concepto?: string;
  sku?: string;
  cantidad?: number;
  unidad?: string;
  costoUnitario?: number;
  total?: number;
};

type QuoteDetail = {
  id: string;
  user_id: string | null;
  quote_number: string | null;
  title: string | null;
  quote_type: string | null;
  client_name: string | null;
  seller_name: string | null;
  project_name: string | null;
  form_data: Record<string, unknown> | null;
  result_data: Record<string, unknown> | null;
  material_lines: MaterialLine[] | null;
  cost_direct: number | null;
  price_without_tax: number | null;
  tax_amount: number | null;
  total_with_tax: number | null;
  utility_amount: number | null;
  margin_percent: number | null;
  status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

function normalizeStatus(status: string | null): QuoteStatus {
  if (
    status === "BORRADOR" ||
    status === "ENVIADA" ||
    status === "APROBADA" ||
    status === "RECHAZADA" ||
    status === "CANCELADA"
  ) {
    return status;
  }

  return "BORRADOR";
}

export default async function CotizacionDetallePage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const { user, profile, supabase } = await getCurrentUserProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile || profile.active === false) {
    return <AccessDenied profile={profile} section="Detalle de cotización" />;
  }

  if (profile.role === "invitado") {
    return <AccessDenied profile={profile} section="Detalle de cotización" />;
  }

  const isAdmin = profile.role === "admin";

  const { data, error } = await supabase
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
      form_data,
      result_data,
      material_lines,
      cost_direct,
      price_without_tax,
      tax_amount,
      total_with_tax,
      utility_amount,
      margin_percent,
      status,
      notes,
      created_at,
      updated_at
    `
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const quote = data as QuoteDetail;

  if (!isAdmin && quote.user_id !== user.id) {
    return <AccessDenied profile={profile} section="Detalle de cotización" />;
  }

  const currentStatus = normalizeStatus(quote.status);
  const canChangeStatus =
    profile.role === "admin" ||
    profile.role === "vendedor" ||
    quote.user_id === user.id;

  const resultData = quote.result_data ?? {};
  const formData = quote.form_data ?? {};

  const textoCotizacion =
    typeof resultData.textoCotizacion === "string"
      ? resultData.textoCotizacion
      : "";

  const materialLines = Array.isArray(quote.material_lines)
    ? quote.material_lines
    : Array.isArray(resultData.partidas)
      ? (resultData.partidas as MaterialLine[])
      : [];

  const groupedLines = materialLines.reduce<Record<string, MaterialLine[]>>(
    (groups, line) => {
      const group = line.grupo || "Sin grupo";

      if (!groups[group]) {
        groups[group] = [];
      }

      groups[group].push(line);

      return groups;
    },
    {}
  );

  const groupedEntries = Object.entries(groupedLines);

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-400">
            Hollow Cotizadores
          </p>

          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black">
                  {quote.quote_number ?? "Cotización"}
                </h1>

                <StatusBadge status={currentStatus} />
              </div>

              <p className="mt-2 text-sm text-neutral-400">
                {quote.title ?? "Cotización sin título"}
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                Creada: {formatDate(quote.created_at)}
                {quote.updated_at ? ` · Actualizada: ${formatDate(quote.updated_at)}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <NavButton href="/cotizaciones" label="Historial" />
              <NavButton href="/cotizadores/cajas-luz" label="Nueva cotización" />
              {isAdmin && <NavButton href="/admin" label="Admin" />}
            </div>
          </div>
        </header>

        <StatusActions
          quoteId={quote.id}
          currentStatus={currentStatus}
          canChange={canChangeStatus}
          updateAction={updateQuoteStatus}
        />

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Precio S/IVA"
            value={money(Number(quote.price_without_tax ?? 0))}
            description="Precio antes de IVA"
          />

          <MetricCard
            title="IVA"
            value={money(Number(quote.tax_amount ?? 0))}
            description="Impuesto calculado"
          />

          <MetricCard
            title="Total con IVA"
            value={money(Number(quote.total_with_tax ?? 0))}
            description="Importe final"
          />

          <MetricCard
            title="Utilidad"
            value={money(Number(quote.utility_amount ?? 0))}
            description={`Margen: ${Number(quote.margin_percent ?? 0)}%`}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <InfoCard title="Cliente" value={quote.client_name ?? "—"} />
          <InfoCard title="Proyecto" value={quote.project_name ?? "—"} />
          <InfoCard title="Vendedor" value={quote.seller_name ?? "—"} />
        </section>

        <section className="rounded-3xl border border-neutral-800 bg-neutral-900">
          <SectionTitle
            title="Cotización para cliente"
            description="Texto generado automáticamente desde el cotizador."
          />

          <div className="p-5">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
              <p className="text-sm leading-7 text-neutral-200">
                {textoCotizacion || "Esta cotización no tiene texto generado."}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-neutral-800 bg-neutral-900">
          <SectionTitle
            title="Datos capturados"
            description="Resumen de los campos principales guardados."
          />

          <div className="grid gap-4 p-5 md:grid-cols-3">
            <InfoCard
              title="Tipo de caja"
              value={stringValue(formData.tipoCaja)}
            />

            <InfoCard
              title="Carátula"
              value={stringValue(formData.caratula)}
            />

            <InfoCard
              title="Iluminación"
              value={stringValue(formData.iluminacion)}
            />

            <InfoCard
              title="Ancho"
              value={`${stringValue(formData.anchoM)} m`}
            />

            <InfoCard
              title="Alto"
              value={`${stringValue(formData.altoM)} m`}
            />

            <InfoCard
              title="Canto"
              value={
                formData.usarCantoAutomatico
                  ? "Automático"
                  : `${stringValue(formData.cantoCmManual)} cm`
              }
            />

            <InfoCard
              title="Instalación"
              value={stringValue(formData.incluyeInstalacion)}
            />

            <InfoCard
              title="Condición"
              value={stringValue(formData.alturaCondicion)}
            />

            <InfoCard
              title="Traslado"
              value={stringValue(formData.traslado)}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-neutral-800 bg-neutral-900">
          <SectionTitle
            title="Detalle de materiales y costos"
            description="Desglose interno guardado en la cotización."
          />

          <div className="overflow-x-auto p-5">
            <table className="w-full min-w-[1000px] text-sm">
              <thead>
                <tr className="border-b border-neutral-800 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="px-3 py-3">Grupo</th>
                  <th className="px-3 py-3">Concepto</th>
                  <th className="px-3 py-3">SKU</th>
                  <th className="px-3 py-3 text-right">Cantidad</th>
                  <th className="px-3 py-3">Unidad</th>
                  <th className="px-3 py-3 text-right">Costo unitario</th>
                  <th className="px-3 py-3 text-right">Total</th>
                </tr>
              </thead>

              <tbody>
                {groupedEntries.map(([group, lines]) => (
                  <Fragment key={group}>
                    <tr className="bg-neutral-800/60">
                      <td
                        colSpan={7}
                        className="px-3 py-2 text-xs font-bold uppercase text-yellow-300"
                      >
                        {group}
                      </td>
                    </tr>

                    {lines.map((line, index) => (
                      <tr
                        key={`${group}-${line.concepto}-${index}`}
                        className="border-b border-neutral-800"
                      >
                        <td className="px-3 py-3 text-neutral-500">
                          {line.grupo ?? group}
                        </td>

                        <td className="px-3 py-3 text-white">
                          {line.concepto ?? "—"}
                        </td>

                        <td className="px-3 py-3 text-neutral-500">
                          {line.sku ?? "—"}
                        </td>

                        <td className="px-3 py-3 text-right">
                          {fixed(Number(line.cantidad ?? 0))}
                        </td>

                        <td className="px-3 py-3 text-neutral-400">
                          {line.unidad ?? "—"}
                        </td>

                        <td className="px-3 py-3 text-right">
                          {money(Number(line.costoUnitario ?? 0))}
                        </td>

                        <td className="px-3 py-3 text-right font-bold">
                          {money(Number(line.total ?? 0))}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}

                {materialLines.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-10 text-center text-neutral-500"
                    >
                      No hay materiales guardados en esta cotización.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {quote.notes && (
          <section className="rounded-3xl border border-neutral-800 bg-neutral-900">
            <SectionTitle
              title="Observaciones"
              description="Notas capturadas durante la cotización."
            />

            <div className="p-5">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 text-sm leading-7 text-neutral-300">
                {quote.notes}
              </div>
            </div>
          </section>
        )}
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

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-neutral-800 p-5">
      <h2 className="text-lg font-black text-white">{title}</h2>
      <p className="mt-1 text-sm text-neutral-500">{description}</p>
    </div>
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

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
        {title}
      </p>

      <p className="mt-3 break-words text-lg font-black text-white">{value}</p>
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

function stringValue(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return "—";
}

function fixed(value: number) {
  return new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
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