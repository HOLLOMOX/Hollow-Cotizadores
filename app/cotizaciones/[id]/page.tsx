import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import CopyQuoteText from "./CopyQuoteText";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AccessRow = {
  role: string;
  active: boolean;
};

type QuoteRow = Record<string, unknown>;

type MaterialLine = {
  grupo: string;
  concepto: string;
  sku?: string;
  cantidad: number;
  unidad: string;
  costoUnitario: number;
  total: number;
};

type NormalizedQuote = {
  id: string;
  quoteNumber: string;
  title: string;
  status: string;
  cliente: string;
  proyecto: string;
  vendedor: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  textoCotizacion: string;
  ownerMatches: boolean;
  costos: {
    costoDirecto: number;
    precioSinIva: number;
    iva: number;
    totalConIva: number;
    utilidad: number;
    margenPorcentaje: number;
  };
  medidas: Record<string, unknown>;
  tiempos: Record<string, unknown>;
  iluminacion: Record<string, unknown>;
  estructura: Record<string, unknown>;
  partidas: MaterialLine[];
  form: Record<string, unknown>;
  result: Record<string, unknown>;
};

export default async function CotizacionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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
        message="Tu usuario no tiene permisos activos para consultar esta cotización."
      />
    );
  }

  const role = access.role || "invitado";

  const canViewAllQuotes = role === "admin";
  const canViewSalePrice =
    role === "admin" || role === "vendedor" || role === "invitado";
  const canViewInternalCosts = role === "admin" || role === "vendedor";
  const canViewUtility = role === "admin" || role === "vendedor";
  const canViewProductPrices = role === "admin" || role === "vendedor";
  const canViewProductionMaterials =
    role === "admin" || role === "vendedor" || role === "produccion";

  const { data: quoteRow, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !quoteRow) {
    notFound();
  }

  const quote = normalizeQuote(quoteRow as QuoteRow, {
    userId: user.id,
    userEmail: user.email ?? "",
  });

  if (!canViewAllQuotes && !quote.ownerMatches) {
    return (
      <BlockedPage
        title="Cotización no disponible"
        message="No tienes permiso para consultar esta cotización."
      />
    );
  }

  const statusMeta = getStatusMeta(quote.status);

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-900 to-yellow-500/10 shadow-2xl shadow-black/20">
          <div className="grid gap-6 p-5 md:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
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

                <span className="rounded-full border border-neutral-700 bg-neutral-950 px-3 py-1 text-xs font-bold uppercase text-neutral-300">
                  Rol: {role}
                </span>
              </div>

              <h1 className="mt-4 break-words text-3xl font-black tracking-tight text-white md:text-4xl">
                Detalle de cotización
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">
                Consulta el resumen comercial, texto para cliente y materiales
                calculados de esta cotización.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <InfoCard title="Cliente" value={quote.cliente} />
                <InfoCard title="Proyecto" value={quote.proyecto} />
                <InfoCard title="Fecha" value={formatDate(quote.createdAt)} />
                <InfoCard title="Guardó" value={quote.createdBy} />
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-5 lg:w-72">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
                Total con IVA
              </p>

              <p className="mt-2 break-words text-3xl font-black text-white">
                {canViewSalePrice ? money(quote.costos.totalConIva) : "Oculto"}
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                {canViewSalePrice
                  ? "Importe visible para este rol"
                  : "Sin permiso de precio"}
              </p>

              <Link
                href="/cotizaciones"
                className="mt-5 inline-flex w-full justify-center rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm font-black uppercase tracking-wide text-neutral-200 transition hover:border-yellow-400 hover:text-yellow-300"
              >
                Volver
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-6">
            <PanelCard
              eyebrow="Texto"
              title="Cotización para cliente"
              description="Texto generado listo para copiar y enviar."
            >
              <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-4">
                <p className="whitespace-pre-wrap break-words text-sm leading-7 text-neutral-200">
                  {quote.textoCotizacion ||
                    "No se encontró texto de cotización."}
                </p>
              </div>

              {quote.textoCotizacion && (
                <div className="mt-4">
                  <CopyQuoteText text={quote.textoCotizacion} />
                </div>
              )}
            </PanelCard>

            <PanelCard
              eyebrow="Proyecto"
              title="Configuración capturada"
              description="Datos principales guardados en el formulario."
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <InfoCard
                  title="Tipo de caja"
                  value={getDisplay(quote.form.tipoCaja)}
                />
                <InfoCard
                  title="Carátula"
                  value={getDisplay(quote.form.caratula)}
                />
                <InfoCard
                  title="Iluminación"
                  value={getDisplay(quote.form.iluminacion)}
                />
                <InfoCard
                  title="Ancho"
                  value={`${getDisplay(quote.form.anchoM)} m`}
                />
                <InfoCard
                  title="Alto"
                  value={`${getDisplay(quote.form.altoM)} m`}
                />
                <InfoCard
                  title="Cantidad"
                  value={getDisplay(quote.form.cantidad)}
                />
                <InfoCard
                  title="Instalación"
                  value={getDisplay(quote.form.incluyeInstalacion)}
                />
                <InfoCard
                  title="Condición"
                  value={getDisplay(quote.form.alturaCondicion)}
                />
                <InfoCard
                  title="Traslado"
                  value={getDisplay(quote.form.traslado)}
                />
                <InfoCard
                  title="Diseño"
                  value={getDisplay(quote.form.disenoGrafico)}
                />
                <InfoCard title="Vendedor" value={quote.vendedor} />
                <InfoCard
                  title="Estado"
                  value={getStatusMeta(quote.status).label}
                />
              </div>
            </PanelCard>

            {canViewProductionMaterials && (
              <PanelCard
                eyebrow={canViewProductPrices ? "Costos internos" : "Producción"}
                title={
                  canViewProductPrices
                    ? "Detalle de costos internos"
                    : "Detalle de materiales para producción"
                }
                description={
                  canViewProductPrices
                    ? "Materiales, cantidades, costos unitarios y totales."
                    : "Materiales, SKUs y cantidades sin precios."
                }
              >
                <div className="w-full overflow-x-auto">
                  {quote.partidas.length > 0 ? (
                    canViewProductPrices ? (
                      <InternalCostTable partidas={quote.partidas} />
                    ) : (
                      <ProductionMaterialTable partidas={quote.partidas} />
                    )
                  ) : (
                    <p className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-sm text-neutral-400">
                      No se encontraron partidas de materiales en esta
                      cotización.
                    </p>
                  )}
                </div>
              </PanelCard>
            )}

            {!canViewProductionMaterials && (
              <section className="rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-5">
                <p className="text-sm font-semibold leading-6 text-yellow-100">
                  Tu rol no tiene permiso para ver materiales, SKUs, cantidades
                  ni precios internos.
                </p>
              </section>
            )}
          </div>

          <aside className="min-w-0">
            <div className="space-y-5 lg:sticky lg:top-6">
              <SummaryCard
                quote={quote}
                canViewSalePrice={canViewSalePrice}
                canViewInternalCosts={canViewInternalCosts}
                canViewUtility={canViewUtility}
              />

              <TechnicalCard quote={quote} />

              <PanelCard
                eyebrow="Acciones"
                title="Opciones"
                description="Acciones disponibles para esta cotización."
              >
                <div className="grid gap-3">
                  <Link
                    href="/cotizaciones"
                    className="rounded-2xl border border-neutral-700 bg-neutral-950 px-5 py-3 text-center text-sm font-black uppercase tracking-wide text-neutral-200 transition hover:border-yellow-400 hover:text-yellow-300"
                  >
                    Regresar al historial
                  </Link>

                  <Link
                    href="/cotizadores/cajas-luz"
                    className="rounded-2xl bg-yellow-400 px-5 py-3 text-center text-sm font-black uppercase tracking-wide text-neutral-950 transition hover:bg-yellow-300"
                  >
                    Nueva cotización
                  </Link>
                </div>
              </PanelCard>
            </div>
          </aside>
        </section>
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

  const costos = getRecord(safeResult.costos) ?? {};
  const medidas = getRecord(safeResult.medidas) ?? {};
  const tiempos = getRecord(safeResult.tiempos) ?? {};
  const iluminacion = getRecord(safeResult.iluminacion) ?? {};
  const estructura = getRecord(safeResult.estructura) ?? {};

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

  const vendedor =
    getString(row, ["seller", "vendedor", "seller_name"]) ||
    getString(safeForm, ["vendedor", "seller"]) ||
    "Sin vendedor";

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
    ]) || getNumber(costos, ["totalConIva", "total_con_iva", "total"]);

  const precioSinIva =
    getNumber(row, ["precio_sin_iva", "precioSinIva", "subtotal"]) ||
    getNumber(costos, ["precioSinIva", "precio_sin_iva", "subtotal"]);

  const iva =
    getNumber(row, ["iva", "tax"]) || getNumber(costos, ["iva", "tax"]);

  const costoDirecto =
    getNumber(row, ["costo_directo", "costoDirecto", "direct_cost"]) ||
    getNumber(costos, ["costoDirecto", "costo_directo", "direct_cost"]);

  const utilidad =
    getNumber(row, ["utilidad", "profit"]) ||
    getNumber(costos, ["utilidad", "profit"]);

  const margenPorcentaje =
    getNumber(row, ["margen", "margenPorcentaje", "margin"]) ||
    getNumber(costos, ["margenPorcentaje", "margen", "margin"]);

  const createdAt = getString(row, ["created_at", "createdAt", "date"]) || "";
  const updatedAt = getString(row, ["updated_at", "updatedAt"]) || createdAt;

  const createdBy =
    getString(row, [
      "created_by_email",
      "user_email",
      "email",
      "createdByEmail",
      "seller_email",
    ]) ||
    vendedor ||
    "Sin usuario";

  const textoCotizacion =
    getString(row, ["texto_cotizacion", "textoCotizacion", "quote_text"]) ||
    getString(safeResult, ["textoCotizacion", "texto_cotizacion", "quote_text"]);

  const partidas = normalizePartidas(getUnknownArray(safeResult.partidas));

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
    vendedor,
    createdBy,
    createdAt,
    updatedAt,
    textoCotizacion,
    ownerMatches,
    costos: {
      costoDirecto,
      precioSinIva,
      iva,
      totalConIva,
      utilidad,
      margenPorcentaje,
    },
    medidas,
    tiempos,
    iluminacion,
    estructura,
    partidas,
    form: safeForm,
    result: safeResult,
  };
}

function normalizePartidas(items: unknown[]): MaterialLine[] {
  const partidas: MaterialLine[] = [];

  for (const item of items) {
    const record = getRecord(item);

    if (!record) {
      continue;
    }

    partidas.push({
      grupo: getString(record, ["grupo", "group"]) || "General",
      concepto:
        getString(record, ["concepto", "name", "description"]) ||
        "Sin concepto",
      sku: getString(record, ["sku", "SKU"]),
      cantidad: getNumber(record, ["cantidad", "qty", "quantity"]),
      unidad: getString(record, ["unidad", "unit"]) || "—",
      costoUnitario: getNumber(record, [
        "costoUnitario",
        "costo_unitario",
        "unit_cost",
        "cost",
      ]),
      total: getNumber(record, ["total", "amount"]),
    });
  }

  return partidas;
}

function PanelCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5 shadow-2xl shadow-black/20">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-400">
        {eyebrow}
      </p>

      <h2 className="mt-1 text-xl font-black text-white">{title}</h2>

      <p className="mt-1 text-sm leading-6 text-neutral-500">{description}</p>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function SummaryCard({
  quote,
  canViewSalePrice,
  canViewInternalCosts,
  canViewUtility,
}: {
  quote: NormalizedQuote;
  canViewSalePrice: boolean;
  canViewInternalCosts: boolean;
  canViewUtility: boolean;
}) {
  return (
    <PanelCard
      eyebrow="Resumen"
      title="Importes"
      description="Resumen comercial de la cotización."
    >
      <div className="space-y-3">
        {canViewInternalCosts && (
          <ResultRow
            label="Costo directo"
            value={money(quote.costos.costoDirecto)}
          />
        )}

        {canViewSalePrice && (
          <>
            <ResultRow
              label="Precio S/IVA"
              value={money(quote.costos.precioSinIva)}
            />

            <ResultRow label="IVA" value={money(quote.costos.iva)} />
          </>
        )}

        {canViewUtility && (
          <>
            <ResultRow
              label="Utilidad"
              value={money(quote.costos.utilidad)}
            />

            <ResultRow
              label="Margen"
              value={`${fixed(quote.costos.margenPorcentaje)}%`}
            />
          </>
        )}
      </div>

      {canViewSalePrice ? (
        <div className="mt-5 rounded-3xl bg-yellow-400 p-5 text-neutral-950">
          <p className="text-xs font-black uppercase tracking-[0.18em]">
            Total con IVA
          </p>

          <p className="mt-2 break-words text-3xl font-black">
            {money(quote.costos.totalConIva)}
          </p>
        </div>
      ) : (
        <div className="mt-5 rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-100">
          <p className="text-sm font-bold uppercase">Precio oculto</p>
          <p className="mt-1 text-xs leading-5">
            Este rol no puede ver importes comerciales.
          </p>
        </div>
      )}
    </PanelCard>
  );
}

function TechnicalCard({ quote }: { quote: NormalizedQuote }) {
  return (
    <PanelCard
      eyebrow="Técnico"
      title="Resumen técnico"
      description="Medidas, tiempos, iluminación y estructura."
    >
      <div className="grid grid-cols-2 gap-3">
        <MiniMetric
          title="Área frente"
          value={`${fixed(getNumber(quote.medidas, ["areaFrenteM2"]))} m²`}
        />

        <MiniMetric
          title="Canto"
          value={`${fixed(getNumber(quote.medidas, ["cantoCm"]))} cm`}
        />

        <MiniMetric
          title="Fabricación"
          value={`${fixed(getNumber(quote.tiempos, ["fabricacionHoras"]))} h`}
        />

        <MiniMetric
          title="Instalación"
          value={`${fixed(getNumber(quote.tiempos, ["instalacionHoras"]))} h`}
        />

        <MiniMetric
          title="Iluminación"
          value={getString(quote.iluminacion, ["label"]) || "—"}
        />

        <MiniMetric
          title="Tubular"
          value={getString(quote.estructura, ["tubularLabel"]) || "—"}
        />
      </div>
    </PanelCard>
  );
}

function InternalCostTable({ partidas }: { partidas: MaterialLine[] }) {
  const grouped = groupPartidas(partidas);

  return (
    <table className="w-full min-w-[900px] border-collapse text-sm">
      <thead>
        <tr className="border-b border-neutral-700 bg-neutral-950 text-xs uppercase tracking-wider text-neutral-400">
          <th className="px-3 py-3 text-left">Grupo</th>
          <th className="px-3 py-3 text-left">Concepto</th>
          <th className="px-3 py-3 text-left">SKU</th>
          <th className="px-3 py-3 text-right">Cantidad</th>
          <th className="px-3 py-3 text-left">Unidad</th>
          <th className="px-3 py-3 text-right">Costo unitario</th>
          <th className="px-3 py-3 text-right">Total</th>
        </tr>
      </thead>

      <tbody>
        {grouped.map(([group, lines]) => (
          <Fragment key={group}>
            <tr className="bg-neutral-800/80">
              <td
                colSpan={7}
                className="px-3 py-2 text-xs font-black uppercase tracking-wide text-yellow-300"
              >
                {group}
              </td>
            </tr>

            {lines.map((line, index) => (
              <tr
                key={`${line.grupo}-${line.concepto}-${index}`}
                className="border-b border-neutral-800 transition hover:bg-neutral-800/40"
              >
                <td className="px-3 py-3 text-neutral-500">{line.grupo}</td>
                <td className="px-3 py-3 text-white">{line.concepto}</td>
                <td className="px-3 py-3 text-neutral-500">
                  {line.sku || "—"}
                </td>
                <td className="px-3 py-3 text-right">
                  {fixed(line.cantidad)}
                </td>
                <td className="px-3 py-3 text-neutral-400">{line.unidad}</td>
                <td className="px-3 py-3 text-right">
                  {money(line.costoUnitario)}
                </td>
                <td className="px-3 py-3 text-right font-semibold">
                  {money(line.total)}
                </td>
              </tr>
            ))}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}

function ProductionMaterialTable({ partidas }: { partidas: MaterialLine[] }) {
  const grouped = groupPartidas(partidas);

  return (
    <table className="w-full min-w-[700px] border-collapse text-sm">
      <thead>
        <tr className="border-b border-neutral-700 bg-neutral-950 text-xs uppercase tracking-wider text-neutral-400">
          <th className="px-3 py-3 text-left">Grupo</th>
          <th className="px-3 py-3 text-left">Concepto</th>
          <th className="px-3 py-3 text-left">SKU</th>
          <th className="px-3 py-3 text-right">Cantidad</th>
          <th className="px-3 py-3 text-left">Unidad</th>
        </tr>
      </thead>

      <tbody>
        {grouped.map(([group, lines]) => (
          <Fragment key={group}>
            <tr className="bg-neutral-800/80">
              <td
                colSpan={5}
                className="px-3 py-2 text-xs font-black uppercase tracking-wide text-yellow-300"
              >
                {group}
              </td>
            </tr>

            {lines.map((line, index) => (
              <tr
                key={`${line.grupo}-${line.concepto}-${index}`}
                className="border-b border-neutral-800 transition hover:bg-neutral-800/40"
              >
                <td className="px-3 py-3 text-neutral-500">{line.grupo}</td>
                <td className="px-3 py-3 text-white">{line.concepto}</td>
                <td className="px-3 py-3 text-neutral-500">
                  {line.sku || "—"}
                </td>
                <td className="px-3 py-3 text-right">
                  {fixed(line.cantidad)}
                </td>
                <td className="px-3 py-3 text-neutral-400">{line.unidad}</td>
              </tr>
            ))}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}

function groupPartidas(partidas: MaterialLine[]) {
  const grouped = partidas.reduce<Record<string, MaterialLine[]>>(
    (acc, line) => {
      if (!acc[line.grupo]) acc[line.grupo] = [];
      acc[line.grupo].push(line);
      return acc;
    },
    {}
  );

  return Object.entries(grouped);
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-neutral-500">
        {title}
      </p>

      <p className="mt-1 break-words text-sm font-bold text-white">
        {value || "—"}
      </p>
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-neutral-800 pb-2">
      <span className="text-sm text-neutral-400">{label}</span>
      <span className="text-right text-sm font-bold text-white">{value}</span>
    </div>
  );
}

function MiniMetric({ title, value }: { title: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
      <p className="text-xs text-neutral-500">{title}</p>
      <p className="mt-1 break-words text-sm font-bold text-white">{value}</p>
    </div>
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
          href="/cotizaciones"
          className="mt-8 inline-flex rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black uppercase tracking-wide text-neutral-950 transition hover:bg-yellow-300"
        >
          Volver al historial
        </Link>
      </div>
    </main>
  );
}

function getRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function getUnknownArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
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

function getString(
  row: Record<string, unknown> | null | undefined,
  keys: string[]
) {
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

function getNumber(
  row: Record<string, unknown> | null | undefined,
  keys: string[]
) {
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

function getDisplay(value: unknown) {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return "—";
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

function fixed(value: number) {
  return new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}