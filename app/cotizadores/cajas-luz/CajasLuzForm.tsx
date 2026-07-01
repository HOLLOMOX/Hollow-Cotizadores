"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import type { ReactNode } from "react";
import ClientPicker from "./ClientPicker";
import { calculateCajaLuz } from "./_lib/calculator";
import type {
  CostItem,
  DesignOption,
  FormState,
  InstallationCondition,
  MaterialLine,
  QuoteResult,
  SaveQuotePayload,
  TransportZone,
} from "./_lib/types";

type SaveActionResponse =
  | {
      ok?: boolean;
      id?: string;
      quoteId?: string;
      error?: string;
      message?: string;
    }
  | void;

type CajasLuzFormProps = {
  costItems?: CostItem[];
  costs?: CostItem[];
  costRows?: CostItem[];

  installationConditions?: InstallationCondition[];
  transportZones?: TransportZone[];
  designOptions?: DesignOption[];

  saveCajaLuzQuote?: (payload: SaveQuotePayload) => Promise<SaveActionResponse>;
  saveAction?: (payload: SaveQuotePayload) => Promise<SaveActionResponse>;

  userRole?: string;
};

const defaultForm: FormState = {
  clientId: "",
  cliente: "",
  clienteTelefono: "",
  clienteEmail: "",
  clienteRfc: "",
  clienteDireccion: "",

  proyecto: "",
  vendedor: "",

  tipoCaja: "Recta",
  caratula: "Lona backlight impresa",
  iluminacion: "Lámparas LED",

  anchoM: "1",
  altoM: "1",
  cantidad: "1",
  vistas: "1",

  usarCantoAutomatico: true,
  cantoCmManual: "22",

  usarTiemposAutomaticos: true,
  personasFabricacion: "1",
  personasInstalacion: "2",
  horasFabricacionManual: "8",
  horasInstalacionManual: "2",

  incluyeInstalacion: "SI",
  alturaCondicion: "Pared / fachada baja",
  andamios: "0",
  numeroDescolgadas: "0",
  instalacion: "0",

  traslado: "",
  trasladoTipo: "TRABAJO",

  disenoGrafico: "NO_DISENO",

  separacionLamparasM: "0.30",
  wattsPorLampara: "9",
  tirasPorM2Normal: "3",
  tirasPorM2Ultra: "3",
  tirasPorM2Micro: "4",

  costoCaratulaM2: "0",
  materialExtra: "0",
  extras: "0",

  margen: "40",
  ivaPorcentaje: "16",

  observaciones: "",
};

const tipoCajaOptions = ["Recta", "Suajada", "Doble vista", "Bandera", "Paleta"];

const caratulaOptions = [
  "Lona backlight impresa",
  "Lona backlight rotulada",
  "Acrílico rotulado con vinil de corte",
  "Acrílico rotulado con impresión de vinil",
  "Policarbonato",
  "Otro",
];

const iluminacionOptions = [
  "Lámparas LED",
  "Módulos LED normales",
  "Módulos LED ultra brillantes",
  "Micro LEDs",
  "Sin iluminación",
];

export default function CajasLuzForm({
  costItems,
  costs,
  costRows,
  installationConditions = [],
  transportZones = [],
  designOptions = [],
  saveCajaLuzQuote,
  saveAction,
}: CajasLuzFormProps) {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, startSaving] = useTransition();

  const catalog = costItems ?? costs ?? costRows ?? [];
  const saveQuoteAction = saveCajaLuzQuote ?? saveAction;

  const costMap = useMemo(() => {
    const map = new Map<string, number>();

    for (const item of catalog) {
      if (!item?.sku) continue;

      const value = Number(item.cost ?? 0);
      map.set(item.sku, Number.isFinite(value) ? value : 0);
    }

    return map;
  }, [catalog]);

  const result = useMemo(() => {
    return calculateCajaLuz(
      form,
      costMap,
      installationConditions,
      transportZones,
      designOptions
    );
  }, [form, costMap, installationConditions, transportZones, designOptions]);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function updateText(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }) as FormState);
  }

  async function copyQuoteText() {
    try {
      await navigator.clipboard.writeText(result.textoCotizacion);
      setSaveMessage("Texto de cotización copiado.");
      setSaveError("");
    } catch {
      setSaveError("No se pudo copiar el texto.");
      setSaveMessage("");
    }
  }

  function saveQuote() {
    setSaveMessage("");
    setSaveError("");

    if (!saveQuoteAction) {
      setSaveError("No está configurada la acción para guardar cotización.");
      return;
    }

    startSaving(async () => {
      try {
        const payload: SaveQuotePayload = {
          clientId: form.clientId || null,
          cliente: form.cliente || "Sin cliente",
          proyecto: form.proyecto || "Sin proyecto",
          vendedor: form.vendedor || "",
          form,
          result,
          textoCotizacion: result.textoCotizacion,
        };

        const response = await saveQuoteAction(payload);

        if (response && "error" in response && response.error) {
          setSaveError(response.error);
          return;
        }

        setSaveMessage("Cotización guardada correctamente.");
      } catch (error) {
        setSaveError(
          error instanceof Error
            ? error.message
            : "No se pudo guardar la cotización."
        );
      }
    });
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <HeaderCard />

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_460px]">
          <div className="space-y-6">
            <Panel
              eyebrow="Datos generales"
              title="Cliente y proyecto"
              description="Selecciona un cliente registrado o crea uno nuevo sin salir del cotizador."
            >
              <div className="grid gap-4">
                <ClientPicker
                  selectedClientId={form.clientId}
                  clientName={form.cliente}
                  onChange={(clientData) => {
                    setForm((prev) => ({
                      ...prev,
                      clientId: clientData.clientId,
                      cliente: clientData.clientName,
                      clienteTelefono:
                        clientData.phone ?? prev.clienteTelefono ?? "",
                      clienteEmail:
                        clientData.email ?? prev.clienteEmail ?? "",
                      clienteRfc: clientData.rfc ?? prev.clienteRfc ?? "",
                      clienteDireccion:
                        clientData.address ?? prev.clienteDireccion ?? "",
                    }));
                  }}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label="Proyecto"
                    value={form.proyecto}
                    onChange={(value) => updateText("proyecto", value)}
                    placeholder="Ej. Caja de luz fachada"
                  />

                  <TextField
                    label="Vendedor"
                    value={form.vendedor}
                    onChange={(value) => updateText("vendedor", value)}
                    placeholder="Nombre del vendedor"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label="Teléfono cliente"
                    value={form.clienteTelefono}
                    onChange={(value) => updateText("clienteTelefono", value)}
                    placeholder="Opcional"
                  />

                  <TextField
                    label="Correo cliente"
                    value={form.clienteEmail}
                    onChange={(value) => updateText("clienteEmail", value)}
                    placeholder="Opcional"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label="RFC"
                    value={form.clienteRfc}
                    onChange={(value) => updateText("clienteRfc", value)}
                    placeholder="Opcional"
                  />

                  <TextField
                    label="Dirección"
                    value={form.clienteDireccion}
                    onChange={(value) => updateText("clienteDireccion", value)}
                    placeholder="Opcional"
                  />
                </div>
              </div>
            </Panel>

            <Panel
              eyebrow="Producto"
              title="Configuración de caja de luz"
              description="Define tipo de caja, carátula, medidas e iluminación."
            >
              <div className="grid gap-4 md:grid-cols-3">
                <SelectField
                  label="Tipo de caja"
                  value={form.tipoCaja}
                  onChange={(value) => updateText("tipoCaja", value)}
                  options={tipoCajaOptions}
                />

                <SelectField
                  label="Carátula"
                  value={form.caratula}
                  onChange={(value) => updateText("caratula", value)}
                  options={caratulaOptions}
                />

                <SelectField
                  label="Iluminación"
                  value={form.iluminacion}
                  onChange={(value) => updateText("iluminacion", value)}
                  options={iluminacionOptions}
                />
              </div>

              <CaratulaInfo caratula={form.caratula} />
            </Panel>

            <Panel eyebrow="Medidas" title="Dimensiones">
              <div className="grid gap-4 md:grid-cols-4">
                <NumberField
                  label="Ancho"
                  value={form.anchoM}
                  onChange={(value) => updateText("anchoM", value)}
                  step="0.01"
                  min="0"
                  suffix="m"
                />

                <NumberField
                  label="Alto"
                  value={form.altoM}
                  onChange={(value) => updateText("altoM", value)}
                  step="0.01"
                  min="0"
                  suffix="m"
                />

                <NumberField
                  label="Cantidad"
                  value={form.cantidad}
                  onChange={(value) => updateText("cantidad", value)}
                  step="1"
                  min="1"
                  suffix="pza"
                />

                <NumberField
                  label="Vistas"
                  value={form.vistas}
                  onChange={(value) => updateText("vistas", value)}
                  step="1"
                  min="1"
                  suffix="vista"
                />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <CheckField
                  label="Usar canto automático"
                  checked={form.usarCantoAutomatico}
                  onChange={(value) => updateForm("usarCantoAutomatico", value)}
                />

                {!form.usarCantoAutomatico && (
                  <NumberField
                    label="Canto manual"
                    value={form.cantoCmManual}
                    onChange={(value) => updateText("cantoCmManual", value)}
                    step="1"
                    min="0"
                    suffix="cm"
                  />
                )}
              </div>
            </Panel>

            <Panel
              eyebrow="Instalación"
              title="Servicios, traslado y diseño"
              description="La instalación se calcula por horas-hombre y puede subir por condición."
            >
              <div className="grid gap-4 md:grid-cols-3">
                <SelectField
                  label="Incluye instalación"
                  value={form.incluyeInstalacion}
                  onChange={(value) => updateText("incluyeInstalacion", value)}
                  options={["SI", "NO"]}
                />

                <SelectField
                  label="Condición / altura"
                  value={form.alturaCondicion}
                  onChange={(value) => updateText("alturaCondicion", value)}
                  options={
                    installationConditions.length > 0
                      ? installationConditions.map((item) => item.label)
                      : [
                          "Pared / fachada baja",
                          "Azotea",
                          "Techo",
                          "Descolgada",
                        ]
                  }
                />

                <SelectField
                  label="Tipo de traslado"
                  value={form.trasladoTipo}
                  onChange={(value) => updateText("trasladoTipo", value)}
                  options={["TRABAJO", "ENTREGA"]}
                />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <SelectField
                  label="Zona de traslado"
                  value={form.traslado}
                  onChange={(value) => updateText("traslado", value)}
                  options={[
                    "",
                    ...transportZones.map(
                      (zone) => zone.display_name || zone.label || zone.code
                    ),
                  ]}
                  optionLabels={{
                    "": "Sin traslado / seleccionar zona",
                  }}
                />

                <SelectField
                  label="Diseño gráfico"
                  value={form.disenoGrafico}
                  onChange={(value) => updateText("disenoGrafico", value)}
                  options={[
                    "NO_DISENO",
                    ...designOptions.map((design) => design.code),
                  ]}
                  optionLabels={{
                    NO_DISENO: "No lleva diseño",
                    ...Object.fromEntries(
                      designOptions.map((design) => [
                        design.code,
                        `${design.label} ${
                          Number(design.price) > 0
                            ? `- ${money(Number(design.price))}`
                            : ""
                        }`,
                      ])
                    ),
                  }}
                />

                <NumberField
                  label="Instalación extra"
                  value={form.instalacion}
                  onChange={(value) => updateText("instalacion", value)}
                  step="1"
                  min="0"
                  suffix="$"
                />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <NumberField
                  label="Andamios"
                  value={form.andamios}
                  onChange={(value) => updateText("andamios", value)}
                  step="1"
                  min="0"
                  suffix="serv."
                />

                <NumberField
                  label="Descolgadas"
                  value={form.numeroDescolgadas}
                  onChange={(value) => updateText("numeroDescolgadas", value)}
                  step="1"
                  min="0"
                  suffix="serv."
                />
              </div>
            </Panel>

            <Panel
              eyebrow="Tiempos y reglas"
              title="Mano de obra e iluminación"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <CheckField
                  label="Usar tiempos automáticos"
                  checked={form.usarTiemposAutomaticos}
                  onChange={(value) =>
                    updateForm("usarTiemposAutomaticos", value)
                  }
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <NumberField
                    label="Personas fabricación"
                    value={form.personasFabricacion}
                    onChange={(value) =>
                      updateText("personasFabricacion", value)
                    }
                    step="1"
                    min="1"
                  />

                  <NumberField
                    label="Personas instalación"
                    value={form.personasInstalacion}
                    onChange={(value) =>
                      updateText("personasInstalacion", value)
                    }
                    step="1"
                    min="1"
                  />
                </div>
              </div>

              {!form.usarTiemposAutomaticos && (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <NumberField
                    label="Horas fabricación manual"
                    value={form.horasFabricacionManual}
                    onChange={(value) =>
                      updateText("horasFabricacionManual", value)
                    }
                    step="1"
                    min="0"
                    suffix="h"
                  />

                  <NumberField
                    label="Horas instalación manual"
                    value={form.horasInstalacionManual}
                    onChange={(value) =>
                      updateText("horasInstalacionManual", value)
                    }
                    step="1"
                    min="0"
                    suffix="h"
                  />
                </div>
              )}

              <div className="mt-4 grid gap-4 md:grid-cols-4">
                <NumberField
                  label="Watts por lámpara"
                  value={form.wattsPorLampara}
                  onChange={(value) => updateText("wattsPorLampara", value)}
                  step="1"
                  min="0"
                  suffix="W"
                />

                <NumberField
                  label="Tiras normal m²"
                  value={form.tirasPorM2Normal}
                  onChange={(value) => updateText("tirasPorM2Normal", value)}
                  step="1"
                  min="0"
                />

                <NumberField
                  label="Tiras ultra m²"
                  value={form.tirasPorM2Ultra}
                  onChange={(value) => updateText("tirasPorM2Ultra", value)}
                  step="1"
                  min="0"
                />

                <NumberField
                  label="Tiras micro m²"
                  value={form.tirasPorM2Micro}
                  onChange={(value) => updateText("tirasPorM2Micro", value)}
                  step="1"
                  min="0"
                />
              </div>
            </Panel>

            <Panel eyebrow="Precio" title="Margen, extras y observaciones">
              <div className="grid gap-4 md:grid-cols-4">
                <NumberField
                  label="Margen"
                  value={form.margen}
                  onChange={(value) => updateText("margen", value)}
                  step="1"
                  min="0"
                  suffix="%"
                />

                <NumberField
                  label="IVA"
                  value={form.ivaPorcentaje}
                  onChange={(value) => updateText("ivaPorcentaje", value)}
                  step="1"
                  min="0"
                  suffix="%"
                />

                <NumberField
                  label="Material extra"
                  value={form.materialExtra}
                  onChange={(value) => updateText("materialExtra", value)}
                  step="1"
                  min="0"
                  suffix="$"
                />

                <NumberField
                  label="Extras"
                  value={form.extras}
                  onChange={(value) => updateText("extras", value)}
                  step="1"
                  min="0"
                  suffix="$"
                />
              </div>

              <label className="mt-4 block">
                <span className="text-xs font-black uppercase tracking-wide text-neutral-500">
                  Observaciones
                </span>

                <textarea
                  value={form.observaciones}
                  onChange={(event) =>
                    updateText("observaciones", event.target.value)
                  }
                  rows={3}
                  className="mt-2 w-full resize-none rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-yellow-400"
                  placeholder="Notas para la cotización..."
                />
              </label>
            </Panel>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <ResultSummary result={result} />

            <Panel
              eyebrow="Texto para cliente"
              title="Cotización para copiar"
              description="Texto automático según la configuración seleccionada."
            >
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-sm font-bold leading-6 text-neutral-200">
                {result.textoCotizacion || "Sin texto generado"}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={copyQuoteText}
                  className="rounded-2xl border border-neutral-700 bg-neutral-950 px-5 py-3 text-sm font-black uppercase tracking-wide text-neutral-200 transition hover:border-yellow-400 hover:text-yellow-300"
                >
                  Copiar texto
                </button>

                <button
                  type="button"
                  onClick={saveQuote}
                  disabled={isSaving}
                  className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black uppercase tracking-wide text-neutral-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Guardando..." : "Guardar"}
                </button>
              </div>

              {saveMessage && (
                <div className="mt-4 rounded-2xl border border-green-500/30 bg-green-500/10 p-3 text-sm font-bold text-green-200">
                  {saveMessage}
                </div>
              )}

              {saveError && (
                <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-200">
                  {saveError}
                </div>
              )}
            </Panel>
          </aside>
        </section>

        <Panel
          eyebrow="Materiales"
          title="Partidas calculadas"
          description="Materiales, mano de obra, servicios y costos internos calculados."
        >
          <MaterialsTable partidas={result.partidas} />
        </Panel>
      </div>
    </main>
  );
}

function HeaderCard() {
  return (
    <section className="rounded-3xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-900 to-yellow-500/10 p-5 shadow-2xl shadow-black/20 md:p-6">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-400">
        Hollow Cotizadores
      </p>

      <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
        Cotizador de cajas de luz
      </h1>

      <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-400">
        Calcula materiales, mano de obra, instalación, traslado, margen y texto
        comercial para copiar al cliente.
      </p>
    </section>
  );
}

function Panel({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5 shadow-2xl shadow-black/20">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-400">
        {eyebrow}
      </p>

      <h2 className="mt-1 text-xl font-black">{title}</h2>

      {description && (
        <p className="mt-1 text-sm leading-6 text-neutral-400">
          {description}
        </p>
      )}

      <div className="mt-5">{children}</div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-neutral-500">
        {label}
      </span>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 min-h-12 w-full rounded-2xl border border-neutral-700 bg-neutral-950 px-4 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-yellow-400"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step,
  min,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  step: string;
  min?: string;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-neutral-500">
        {label}
      </span>

      <div className="mt-2 flex min-h-12 overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-950 focus-within:border-yellow-400">
        <input
          type="number"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          step={step}
          min={min}
          className="w-full bg-transparent px-4 text-sm text-white outline-none"
        />

        {suffix && (
          <span className="flex items-center border-l border-neutral-800 px-3 text-xs font-black uppercase text-neutral-500">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  optionLabels = {},
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  optionLabels?: Record<string, string>;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-neutral-500">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-12 w-full rounded-2xl border border-neutral-700 bg-neutral-950 px-4 text-sm font-bold text-white outline-none transition focus:border-yellow-400"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabels[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-neutral-700 bg-neutral-950 px-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4"
      />

      <span className="text-sm font-bold text-neutral-200">{label}</span>
    </label>
  );
}

function CaratulaInfo({ caratula }: { caratula: string }) {
  const descriptions: Record<string, string> = {
    "Lona backlight impresa":
      "Usa solo IMPRESION_LONA_HP por m². No agrega lona blanca ni vinil de corte.",
    "Lona backlight rotulada":
      "Usa LONA_BACKLIGHT blanca/sin impresión + vinil de corte hasta 4 colores + rotulado.",
    "Acrílico rotulado con vinil de corte":
      "Usa acrílico blanco lechoso + vinil de corte translúcido + rotulado.",
    "Acrílico rotulado con impresión de vinil":
      "Usa acrílico blanco lechoso + vinil impreso + rotulado.",
    Policarbonato: "Usa policarbonato por m².",
    Otro: "Usa costo manual de carátula especial.",
  };

  return (
    <div className="mt-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm leading-6 text-yellow-100">
      {descriptions[caratula] ?? "Configura los materiales de carátula."}
    </div>
  );
}

function ResultSummary({ result }: { result: QuoteResult }) {
  return (
    <Panel
      eyebrow="Resultado"
      title="Resumen de cotización"
      description="Importes y datos técnicos principales."
    >
      <div className="grid gap-3">
        <BigTotal label="Total con IVA" value={money(result.costos.totalConIva)} />

        <ResultRow label="Precio sin IVA" value={money(result.costos.precioSinIva)} />
        <ResultRow label="IVA" value={money(result.costos.iva)} />
        <ResultRow label="Costo directo" value={money(result.costos.costoDirecto)} />
        <ResultRow label="Utilidad" value={money(result.costos.utilidad)} />
        <ResultRow
          label="Margen"
          value={`${fixed(result.costos.margenPorcentaje)}%`}
        />

        <div className="my-2 border-t border-neutral-800" />

        <ResultRow
          label="Área frente"
          value={`${fixed(result.medidas.areaFrenteM2)} m²`}
        />
        <ResultRow
          label="Canto"
          value={`${fixed(result.medidas.cantoCm)} cm`}
        />
        <ResultRow
          label="Tiempo real fabricación"
          value={`${fixed(result.tiempos.fabricacionHoras)} h`}
        />
        <ResultRow
          label="Tiempo real instalación"
          value={`${fixed(result.tiempos.instalacionHoras)} h`}
        />
        <ResultRow
          label="HH fabricación"
          value={`${fixed(result.tiempos.horasHombreFabricacion)} HH`}
        />
        <ResultRow
          label="HH instalación"
          value={`${fixed(result.tiempos.horasHombreInstalacion)} HH`}
        />
        <ResultRow
          label="Iluminación"
          value={`${result.iluminacion.label} · ${fixed(
            result.iluminacion.cantidad
          )} ${result.iluminacion.unidad}`}
        />
        <ResultRow
          label="Tubular"
          value={`${result.estructura.tubularLabel} · ${fixed(
            result.estructura.tramosTubular
          )} tramo(s)`}
        />

        <div className="my-2 border-t border-neutral-800" />

        <StatusBadge label={result.validations.material} />
        <StatusBadge label={result.validations.servicios} />
        <StatusBadge label={result.validations.impresion} />
        <StatusBadge label={result.validations.precio} />
      </div>
    </Panel>
  );
}

function BigTotal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-yellow-400 p-5 text-neutral-950">
      <p className="text-xs font-black uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-2 break-words text-3xl font-black">{value}</p>
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

function StatusBadge({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-xs font-black uppercase tracking-wide text-neutral-300">
      {label}
    </div>
  );
}

function MaterialsTable({ partidas }: { partidas: MaterialLine[] }) {
  const grouped = groupPartidas(partidas);

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-800">
      <table className="w-full min-w-[1000px] border-collapse text-sm">
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
                  <td className="px-3 py-3 text-right font-bold text-white">
                    {money(line.total)}
                  </td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
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

function money(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number.isFinite(value) ? value : 0);
}

function fixed(value: number) {
  const number = Number(value);

  if (!Number.isFinite(number)) return "0";

  return number.toLocaleString("es-MX", {
    minimumFractionDigits: number % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}