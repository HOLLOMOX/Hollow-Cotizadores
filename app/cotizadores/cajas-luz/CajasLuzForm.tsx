"use client";

import {
  Fragment,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import type {
  CostRow,
  DesignOption,
  FormState,
  InstallationCondition,
  TransportZone,
} from "./_lib/types";
import type { SaveQuotePayload, SaveQuoteResponse } from "./actions";
import {
  ALTURA_CONDICIONES,
  CARATULAS,
  DEFAULT_FORM,
  ILUMINACIONES,
  TIPOS_CAJA,
} from "./_lib/rules";
import { calculateCajaLuz } from "./_lib/calculator";
import { fixed, money } from "./_lib/format";

export default function CajasLuzForm({
  costRows,
  installationConditions,
  transportZones,
  designOptions,
  saveAction,
  userRole,
}: {
  costRows: CostRow[];
  installationConditions: InstallationCondition[];
  transportZones: TransportZone[];
  designOptions: DesignOption[];
  saveAction?: (payload: SaveQuotePayload) => Promise<SaveQuoteResponse>;
  userRole: string;
}) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  const [isSaving, startSaving] = useTransition();
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [lastQuoteNumber, setLastQuoteNumber] = useState("");

  const role = userRole || "invitado";

  const canViewInternalCosts = role === "admin" || role === "vendedor";
  const canViewProductPrices = role === "admin" || role === "vendedor";
  const canViewUtility = role === "admin" || role === "vendedor";

  const canEditMargin = role === "admin";
  const canEditIva = role === "admin";
  const canViewMarginInput = role === "admin" || role === "vendedor";

  const canViewProductionMaterials =
    role === "admin" || role === "vendedor" || role === "produccion";

  const canViewSalePrice =
    role === "admin" || role === "vendedor" || role === "invitado";

  const isProductionOnly = role === "produccion";
  const isGuest = role === "invitado";

  const installationConditionOptions =
    installationConditions.length > 0
      ? installationConditions.map((condition) => condition.label)
      : ALTURA_CONDICIONES;

  const transportZoneOptions =
    transportZones.length > 0
      ? transportZones.map((zone) => zone.code)
      : ["ZONA_A", "ZONA_B", "ZONA_C", "ZONA_D", "ZONA_E"];

  const designOptionOptions =
    designOptions.length > 0
      ? designOptions.map((design) => design.code)
      : [
          "NO_DISENO",
          "DISENO_15_MIN",
          "DISENO_30_MIN",
          "DISENO_45_MIN",
          "DISENO_60_MIN",
          "DISENO_90_MIN",
          "DISENO_120_MIN",
          "DISENO_150_MIN",
          "DISENO_180_MIN",
          "DISENO_240_MIN",
        ];

  const selectedTransportZone = transportZones.find(
    (zone) => zone.code === form.traslado
  );

  const selectedTransportCost =
    form.trasladoTipo === "ENTREGA"
      ? selectedTransportZone?.delivery_cost ?? 0
      : selectedTransportZone?.work_cost ?? 0;

  const selectedDesignOption = designOptions.find(
    (design) => design.code === form.disenoGrafico
  );

  const selectedDesignCost = selectedDesignOption?.price ?? 0;

  const costMap = useMemo(() => {
    const map = new Map<string, number>();

    costRows.forEach((item) => {
      map.set(item.sku, Number(item.cost || 0));
    });

    return map;
  }, [costRows]);

  const result = useMemo(() => {
    return calculateCajaLuz(
      form,
      costMap,
      installationConditions,
      transportZones,
      designOptions
    );
  }, [form, costMap, installationConditions, transportZones, designOptions]);

  function updateField<K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleSaveQuote() {
    if (!saveAction) {
      setSaveError("No está configurada la acción para guardar cotizaciones.");
      return;
    }

    setSaveMessage("");
    setSaveError("");

    startSaving(async () => {
      const response = await saveAction({
        form,
        result,
      });

      if (!response.ok) {
        setSaveError(response.message);
        return;
      }

      setLastQuoteNumber(response.quoteNumber);
      setSaveMessage(response.message);
    });
  }

  function handleResetForm() {
    setForm(DEFAULT_FORM);
    setSaveMessage("");
    setSaveError("");
    setLastQuoteNumber("");
  }

  async function handleCopyText() {
    try {
      await navigator.clipboard.writeText(result.textoCotizacion);
      setSaveMessage("Texto copiado correctamente.");
      setSaveError("");
    } catch {
      setSaveError("No se pudo copiar el texto.");
      setSaveMessage("");
    }
  }

  const groupedPartidas = result.partidas.reduce<
    Record<string, typeof result.partidas>
  >((groups, line) => {
    if (!groups[line.grupo]) {
      groups[line.grupo] = [];
    }

    groups[line.grupo].push(line);
    return groups;
  }, {});

  const groupedEntries = Object.entries(groupedPartidas) as Array<
    [string, typeof result.partidas]
  >;

  return (
    <div className="space-y-6">
      <HeroHeader
        role={role}
        cliente={form.cliente}
        proyecto={form.proyecto}
        total={result.costos.totalConIva}
        canViewSalePrice={canViewSalePrice}
      />

      {isGuest && (
        <PermissionNotice
          title="Vista invitado"
          text="Solo puedes ver el precio final y el texto para cliente. No se muestran materiales, SKUs, costos internos ni precios de productos."
        />
      )}

      {isProductionOnly && (
        <PermissionNotice
          title="Vista producción"
          text="Puedes ver materiales, SKUs, cantidades y datos técnicos. No se muestran precios, costos internos, utilidad ni margen."
        />
      )}

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <PanelCard
            eyebrow="Configuración"
            title="Datos principales del proyecto"
            description="Captura cliente, medidas, tipo de caja, carátula e iluminación."
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <FieldBlock title="Datos generales">
                <TextField
                  label="Cliente"
                  value={form.cliente}
                  onChange={(value) => updateField("cliente", value)}
                />

                <TextField
                  label="Vendedor"
                  value={form.vendedor}
                  onChange={(value) => updateField("vendedor", value)}
                />

                <TextField
                  label="Proyecto"
                  value={form.proyecto}
                  onChange={(value) => updateField("proyecto", value)}
                />
              </FieldBlock>

              <FieldBlock title="Medidas y tipo de caja">
                <SelectField
                  label="Tipo de caja"
                  value={form.tipoCaja}
                  options={TIPOS_CAJA}
                  onChange={(value) =>
                    updateField("tipoCaja", value as FormState["tipoCaja"])
                  }
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <NumberField
                    label="Cantidad"
                    suffix="pzas"
                    value={form.cantidad}
                    onChange={(value) => updateField("cantidad", value)}
                  />

                  <NumberField
                    label="Vistas"
                    suffix="caras"
                    value={form.vistas}
                    onChange={(value) => updateField("vistas", value)}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <NumberField
                    label="Ancho"
                    suffix="m"
                    value={form.anchoM}
                    onChange={(value) => updateField("anchoM", value)}
                  />

                  <NumberField
                    label="Alto"
                    suffix="m"
                    value={form.altoM}
                    onChange={(value) => updateField("altoM", value)}
                  />
                </div>

                <CheckboxField
                  label="Canto automático"
                  checked={form.usarCantoAutomatico}
                  onChange={(value) =>
                    updateField("usarCantoAutomatico", value)
                  }
                />

                {!form.usarCantoAutomatico && (
                  <NumberField
                    label="Canto manual"
                    suffix="cm"
                    value={form.cantoCmManual}
                    onChange={(value) => updateField("cantoCmManual", value)}
                  />
                )}
              </FieldBlock>
            </div>
          </PanelCard>

          <PanelCard
            eyebrow="Materiales"
            title="Carátula e iluminación"
            description="Selecciona el acabado frontal y el sistema de iluminación."
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <FieldBlock title="Carátula">
                <SelectField
                  label="Tipo de carátula"
                  value={form.caratula}
                  options={CARATULAS}
                  onChange={(value) =>
                    updateField("caratula", value as FormState["caratula"])
                  }
                />

                <CaratulaInfo caratula={form.caratula} />

                {form.caratula === "Otro" && (
                  <NumberField
                    label="Costo carátula manual"
                    suffix="$/m²"
                    value={form.costoCaratulaM2}
                    onChange={(value) => updateField("costoCaratulaM2", value)}
                  />
                )}
              </FieldBlock>

              <FieldBlock title="Iluminación">
                <SelectField
                  label="Iluminación"
                  value={form.iluminacion}
                  options={ILUMINACIONES}
                  onChange={(value) =>
                    updateField(
                      "iluminacion",
                      value as FormState["iluminacion"]
                    )
                  }
                />

                {form.iluminacion === "Lámparas LED" && (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <NumberField
                        label="Separación"
                        suffix="m"
                        value={form.separacionLamparasM}
                        onChange={(value) =>
                          updateField("separacionLamparasM", value)
                        }
                      />

                      <NumberField
                        label="Watts por lámpara"
                        suffix="W"
                        value={form.wattsPorLampara}
                        onChange={(value) =>
                          updateField("wattsPorLampara", value)
                        }
                      />
                    </div>

                    <InfoBox>
                      Lámparas LED no usan fuente. Se cargan directo como pieza.
                    </InfoBox>
                  </>
                )}

                {form.iluminacion === "Módulos LED normales" && (
                  <>
                    <NumberField
                      label="Tiras normales por m²"
                      suffix="tiras/m²"
                      value={form.tirasPorM2Normal}
                      onChange={(value) =>
                        updateField("tirasPorM2Normal", value)
                      }
                    />

                    <InfoBox>
                      Cada tira trae 20 módulos. Cada módulo normal consume 0.72
                      W.
                    </InfoBox>
                  </>
                )}

                {form.iluminacion === "Módulos LED ultra brillantes" && (
                  <>
                    <NumberField
                      label="Tiras ultra por m²"
                      suffix="tiras/m²"
                      value={form.tirasPorM2Ultra}
                      onChange={(value) =>
                        updateField("tirasPorM2Ultra", value)
                      }
                    />

                    <InfoBox>
                      Cada tira trae 20 módulos. Cada módulo ultrabrillante
                      consume 1.5 W.
                    </InfoBox>
                  </>
                )}

                {form.iluminacion === "Micro LEDs" && (
                  <>
                    <NumberField
                      label="Tiras micro por m²"
                      suffix="tiras/m²"
                      value={form.tirasPorM2Micro}
                      onChange={(value) =>
                        updateField("tirasPorM2Micro", value)
                      }
                    />

                    <InfoBox>
                      Cada tira trae 20 módulos. Cada micro LED consume 0.2 W.
                    </InfoBox>
                  </>
                )}
              </FieldBlock>
            </div>
          </PanelCard>

          <PanelCard
            eyebrow="Servicios"
            title="Instalación, traslado y diseño"
            description="Define instalación, zona de traslado y si el proyecto requiere diseño gráfico."
          >
            <div className="grid gap-5 lg:grid-cols-3">
              <FieldBlock title="Instalación">
                <SelectField
                  label="Incluye instalación"
                  value={form.incluyeInstalacion}
                  options={["SI", "NO"]}
                  onChange={(value) =>
                    updateField(
                      "incluyeInstalacion",
                      value as FormState["incluyeInstalacion"]
                    )
                  }
                />

                <SelectField
                  label="Altura / condición"
                  value={form.alturaCondicion}
                  options={installationConditionOptions}
                  onChange={(value) => updateField("alturaCondicion", value)}
                />

                <InfoBox>
                  La condición seleccionada puede aumentar automáticamente la
                  mano de obra de instalación.
                </InfoBox>
              </FieldBlock>

              <FieldBlock title="Traslado">
                <SelectField
                  label="Zona"
                  value={form.traslado}
                  options={transportZoneOptions}
                  getOptionLabel={(code) => {
                    const zone = transportZones.find(
                      (item) => item.code === code
                    );
                    return zone?.display_name || zone?.label || code;
                  }}
                  onChange={(value) => updateField("traslado", value)}
                />

                <SelectField
                  label="Tipo"
                  value={form.trasladoTipo}
                  options={["TRABAJO", "ENTREGA"]}
                  onChange={(value) =>
                    updateField(
                      "trasladoTipo",
                      value as FormState["trasladoTipo"]
                    )
                  }
                />

                <InfoBox>
                  {selectedTransportZone ? (
                    <>
                      <strong>
                        {selectedTransportZone.display_name ||
                          selectedTransportZone.label}
                      </strong>
                      <br />
                      Trabajo: {money(selectedTransportZone.work_cost)} ·
                      Entrega: {money(selectedTransportZone.delivery_cost)}
                      <br />
                      Costo aplicado: {money(selectedTransportCost)}
                      {selectedTransportZone.coverage_text && (
                        <>
                          <br />
                          Cobertura: {selectedTransportZone.coverage_text}
                        </>
                      )}
                    </>
                  ) : (
                    "No se encontró información de esta zona de traslado."
                  )}
                </InfoBox>
              </FieldBlock>

              <FieldBlock title="Diseño gráfico">
                <SelectField
                  label="Diseño"
                  value={form.disenoGrafico}
                  options={designOptionOptions}
                  getOptionLabel={(code) => {
                    const design = designOptions.find(
                      (item) => item.code === code
                    );

                    if (!design) return code;

                    return design.price > 0
                      ? `${design.label} — ${money(design.price)}`
                      : design.label;
                  }}
                  onChange={(value) => updateField("disenoGrafico", value)}
                />

                <InfoBox>
                  {selectedDesignOption ? (
                    <>
                      <strong>{selectedDesignOption.label}</strong>
                      <br />
                      Minutos: {selectedDesignOption.minutes}
                      <br />
                      Costo aplicado: {money(selectedDesignCost)}
                      {selectedDesignOption.price <= 0 && (
                        <>
                          <br />
                          No se agregará costo de diseño.
                        </>
                      )}
                    </>
                  ) : (
                    "No se encontró información de esta opción de diseño."
                  )}
                </InfoBox>
              </FieldBlock>
            </div>
          </PanelCard>

          <PanelCard
            eyebrow="Producción"
            title="Adicionales, personal y tiempos"
            description="Agrega servicios especiales, andamios, descolgadas y horas de trabajo."
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <FieldBlock title="Adicionales">
                <NumberField
                  label="Material extra"
                  suffix="$"
                  value={form.materialExtra}
                  onChange={(value) => updateField("materialExtra", value)}
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <NumberField
                    label="Andamios"
                    suffix="servicios"
                    value={form.andamios}
                    onChange={(value) => updateField("andamios", value)}
                  />

                  <NumberField
                    label="Descolgadas"
                    suffix="servicios"
                    value={form.numeroDescolgadas}
                    onChange={(value) =>
                      updateField("numeroDescolgadas", value)
                    }
                  />
                </div>

                <NumberField
                  label="Servicio instalación extra"
                  suffix="$"
                  value={form.instalacion}
                  onChange={(value) => updateField("instalacion", value)}
                />

                <NumberField
                  label="Extras"
                  suffix="$"
                  value={form.extras}
                  onChange={(value) => updateField("extras", value)}
                />
              </FieldBlock>

              <FieldBlock title="Personas y tiempos">
                <CheckboxField
                  label="Tiempos automáticos"
                  checked={form.usarTiemposAutomaticos}
                  onChange={(value) =>
                    updateField("usarTiemposAutomaticos", value)
                  }
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <NumberField
                    label="Personas fabricación"
                    suffix="personas"
                    value={form.personasFabricacion}
                    onChange={(value) =>
                      updateField("personasFabricacion", value)
                    }
                  />

                  <NumberField
                    label="Personas instalación"
                    suffix="personas"
                    value={form.personasInstalacion}
                    onChange={(value) =>
                      updateField("personasInstalacion", value)
                    }
                  />
                </div>

                {!form.usarTiemposAutomaticos && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <NumberField
                      label="Horas fabricación"
                      suffix="h"
                      value={form.horasFabricacionManual}
                      onChange={(value) =>
                        updateField("horasFabricacionManual", value)
                      }
                    />

                    <NumberField
                      label="Horas instalación"
                      suffix="h"
                      value={form.horasInstalacionManual}
                      onChange={(value) =>
                        updateField("horasInstalacionManual", value)
                      }
                    />
                  </div>
                )}

                <InfoBox>
                  La mano de obra se calcula por hora-hombre: horas × personas ×
                  costo por hora desde catálogo.
                </InfoBox>
              </FieldBlock>
            </div>
          </PanelCard>

          <PanelCard
            eyebrow="Control"
            title="Precio y observaciones"
            description="El margen solo puede modificarlo el administrador."
          >
            <div className="grid gap-5 lg:grid-cols-2">
              {canViewMarginInput && (
                <FieldBlock title="Margen e IVA">
                  <NumberField
                    label={canEditMargin ? "Margen" : "Margen bloqueado"}
                    suffix="%"
                    value={form.margen}
                    disabled={!canEditMargin}
                    onChange={(value) => {
                      if (!canEditMargin) return;
                      updateField("margen", value);
                    }}
                  />

                  <NumberField
                    label={canEditIva ? "IVA" : "IVA bloqueado"}
                    suffix="%"
                    value={form.ivaPorcentaje}
                    disabled={!canEditIva}
                    onChange={(value) => {
                      if (!canEditIva) return;
                      updateField("ivaPorcentaje", value);
                    }}
                  />

                  <InfoBox>
                    {canEditMargin
                      ? "Como administrador puedes modificar margen e IVA."
                      : "Margen e IVA bloqueados. Solo un administrador puede modificarlos."}
                  </InfoBox>
                </FieldBlock>
              )}

              <FieldBlock title="Observaciones">
                <textarea
                  value={form.observaciones}
                  onChange={(event) =>
                    updateField("observaciones", event.target.value)
                  }
                  className="min-h-32 w-full rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-yellow-400"
                  placeholder="Texto libre para aclaraciones internas o de cliente..."
                />
              </FieldBlock>
            </div>
          </PanelCard>
        </div>

        <aside className="xl:col-span-4">
          <div className="sticky top-6 space-y-5">
            <SummaryCard
              result={result}
              canViewSalePrice={canViewSalePrice}
              canViewInternalCosts={canViewInternalCosts}
              canViewUtility={canViewUtility}
            />

            {!isGuest && (
              <ValidationSummary
                canViewInternalCosts={canViewInternalCosts}
                result={result}
              />
            )}

            <QuoteCopyCard
              text={result.textoCotizacion}
              onCopy={handleCopyText}
              onReset={handleResetForm}
              onSave={handleSaveQuote}
              isSaving={isSaving}
              saveMessage={saveMessage}
              saveError={saveError}
              lastQuoteNumber={lastQuoteNumber}
            />

            <TechnicalSummary result={result} />
          </div>
        </aside>
      </div>

      {canViewProductionMaterials && (
        <section className="rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl shadow-black/20">
          <div className="border-b border-neutral-800 px-5 py-4">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-400">
              {canViewProductPrices
                ? "Costos internos"
                : "Producción"}
            </p>

            <h3 className="mt-1 text-lg font-black text-white">
              {canViewProductPrices
                ? "Detalle de costos internos"
                : "Detalle de materiales para producción"}
            </h3>
          </div>

          <div className="overflow-x-auto p-5">
            {canViewProductPrices ? (
              <InternalCostTable groupedEntries={groupedEntries} />
            ) : (
              <ProductionMaterialTable groupedEntries={groupedEntries} />
            )}
          </div>
        </section>
      )}

      {!canViewProductionMaterials && (
        <section className="rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-5">
          <p className="text-sm font-semibold leading-6 text-yellow-100">
            Tu rol no tiene permiso para ver materiales, SKUs, cantidades ni
            precios internos.
          </p>
        </section>
      )}
    </div>
  );
}

function HeroHeader({
  role,
  cliente,
  proyecto,
  total,
  canViewSalePrice,
}: {
  role: string;
  cliente: string;
  proyecto: string;
  total: number;
  canViewSalePrice: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-900 to-yellow-500/10 shadow-2xl shadow-black/20">
      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-yellow-400/40 bg-yellow-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-yellow-300">
              Hollow Cotizadores
            </span>

            <span className="rounded-full border border-neutral-700 bg-neutral-950 px-3 py-1 text-xs font-bold uppercase text-neutral-300">
              Rol: {role}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-black tracking-tight text-white md:text-4xl">
            Cotizador de cajas de luz
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">
            Captura técnica, costos internos, instalación, traslado y texto
            listo para enviar al cliente.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <HeroMini label="Cliente" value={cliente || "Sin cliente"} />
            <HeroMini label="Proyecto" value={proyecto || "Sin proyecto"} />
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-5 text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
            Total estimado
          </p>

          <p className="mt-2 text-3xl font-black text-white">
            {canViewSalePrice ? money(total) : "Oculto"}
          </p>

          <p className="mt-1 text-xs text-neutral-500">
            {canViewSalePrice ? "IVA incluido" : "Sin permiso de precio"}
          </p>
        </div>
      </div>
    </div>
  );
}

function HeroMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-bold text-white">{value}</p>
    </div>
  );
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
    <section className="rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl shadow-black/20">
      <div className="border-b border-neutral-800 px-5 py-4">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-yellow-400">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-xl font-black text-white">{title}</h2>

        <p className="mt-1 text-sm leading-6 text-neutral-500">
          {description}
        </p>
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

function FieldBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-4">
      <h3 className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-yellow-400">
        {title}
      </h3>

      <div className="grid gap-3">{children}</div>
    </div>
  );
}

function SummaryCard({
  result,
  canViewSalePrice,
  canViewInternalCosts,
  canViewUtility,
}: {
  result: ReturnType<typeof calculateCajaLuz>;
  canViewSalePrice: boolean;
  canViewInternalCosts: boolean;
  canViewUtility: boolean;
}) {
  return (
    <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5 shadow-2xl shadow-black/20">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-400">
        Resumen
      </p>

      <h3 className="mt-1 text-lg font-black text-white">
        Resultado de cotización
      </h3>

      <div className="mt-5 space-y-3">
        <ResultRow
          label="Fabricación"
          value={`${result.tiempos.fabricacionHoras} h`}
        />

        <ResultRow
          label="Instalación"
          value={`${result.tiempos.instalacionHoras} h`}
        />

        <ResultRow
          label="Horas-hombre fabricación"
          value={`${result.tiempos.horasHombreFabricacion} h`}
        />

        <ResultRow
          label="Horas-hombre instalación"
          value={`${result.tiempos.horasHombreInstalacion} h`}
        />

        {canViewInternalCosts && (
          <ResultRow
            label="Costo directo"
            value={money(result.costos.costoDirecto)}
          />
        )}

        {canViewSalePrice && (
          <>
            <ResultRow
              label="Precio S/IVA"
              value={money(result.costos.precioSinIva)}
            />

            <ResultRow label="IVA" value={money(result.costos.iva)} />
          </>
        )}

        {canViewUtility && (
          <>
            <ResultRow
              label="Utilidad"
              value={money(result.costos.utilidad)}
            />

            <ResultRow
              label="Margen interno"
              value={`${fixed(result.costos.margenPorcentaje)}%`}
            />
          </>
        )}
      </div>

      {canViewSalePrice ? (
        <div className="mt-5 rounded-3xl bg-yellow-400 p-5 text-neutral-950">
          <p className="text-xs font-black uppercase tracking-[0.2em]">
            Total con IVA
          </p>

          <p className="mt-2 text-3xl font-black">
            {money(result.costos.totalConIva)}
          </p>
        </div>
      ) : (
        <div className="mt-5 rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-100">
          <p className="text-sm font-bold uppercase">Vista sin precios</p>
          <p className="mt-1 text-xs leading-5">
            Este rol no tiene permiso para ver precio final, costos, utilidad ni
            margen.
          </p>
        </div>
      )}
    </div>
  );
}

function ValidationSummary({
  canViewInternalCosts,
  result,
}: {
  canViewInternalCosts: boolean;
  result: ReturnType<typeof calculateCajaLuz>;
}) {
  return (
    <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-400">
        Validaciones
      </p>

      <div className="mt-4 grid gap-3">
        {canViewInternalCosts && (
          <StatusPill title="Precio" value={result.validations.precio} />
        )}

        <StatusPill title="Materiales" value={result.validations.material} />
        <StatusPill title="Servicios" value={result.validations.servicios} />
        <StatusPill title="Impresión" value={result.validations.impresion} />
      </div>
    </div>
  );
}

function QuoteCopyCard({
  text,
  onCopy,
  onReset,
  onSave,
  isSaving,
  saveMessage,
  saveError,
  lastQuoteNumber,
}: {
  text: string;
  onCopy: () => void;
  onReset: () => void;
  onSave: () => void;
  isSaving: boolean;
  saveMessage: string;
  saveError: string;
  lastQuoteNumber: string;
}) {
  return (
    <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-400">
        Texto para cliente
      </p>

      <h3 className="mt-1 text-lg font-black text-white">
        Cotización para copiar
      </h3>

      <div className="mt-4 rounded-3xl border border-neutral-800 bg-neutral-950 p-4">
        <p className="whitespace-pre-wrap text-sm leading-7 text-neutral-200">
          {text}
        </p>
      </div>

      <div className="mt-4 grid gap-3">
        <button
          type="button"
          onClick={onCopy}
          className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black uppercase tracking-wide text-neutral-950 transition hover:bg-yellow-300"
        >
          Copiar texto
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="rounded-2xl border border-neutral-700 bg-neutral-950 px-5 py-3 text-sm font-black uppercase tracking-wide text-neutral-200 transition hover:border-yellow-400 hover:text-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Guardando..." : "Guardar cotización"}
        </button>

        <button
          type="button"
          onClick={onReset}
          className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-black uppercase tracking-wide text-red-300 transition hover:border-red-400 hover:bg-red-500/20"
        >
          Limpiar formulario
        </button>
      </div>

      {lastQuoteNumber && (
        <p className="mt-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-xs font-bold text-yellow-200">
          Última cotización guardada: {lastQuoteNumber}
        </p>
      )}

      {saveMessage && (
        <div className="mt-4 rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-200">
          {saveMessage}
        </div>
      )}

      {saveError && (
        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
          {saveError}
        </div>
      )}
    </div>
  );
}

function TechnicalSummary({
  result,
}: {
  result: ReturnType<typeof calculateCajaLuz>;
}) {
  return (
    <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-400">
        Técnico
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <MiniMetric
          title="Área frente"
          value={`${fixed(result.medidas.areaFrenteM2)} m²`}
        />

        <MiniMetric
          title="Canto"
          value={`${fixed(result.medidas.cantoCm)} cm`}
        />

        <MiniMetric
          title="Lámina"
          value={`${fixed(result.lamina.areaTotalM2)} m²`}
        />

        <MiniMetric
          title="Tubular"
          value={`${result.estructura.tramosTubular} tramos`}
        />

        <MiniMetric
          title="Iluminación"
          value={`${result.iluminacion.cantidad} ${result.iluminacion.unidad}`}
        />

        <MiniMetric title="Fuente" value={result.iluminacion.fuente.label} />
      </div>
    </div>
  );
}

function InternalCostTable({
  groupedEntries,
}: {
  groupedEntries: Array<
    [string, ReturnType<typeof calculateCajaLuz>["partidas"]]
  >;
}) {
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
        {groupedEntries.map(([group, lines]) => (
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

function ProductionMaterialTable({
  groupedEntries,
}: {
  groupedEntries: Array<
    [string, ReturnType<typeof calculateCajaLuz>["partidas"]]
  >;
}) {
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
        {groupedEntries.map(([group, lines]) => (
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

function PermissionNotice({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-100">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-300">
        {title}
      </p>

      <p className="mt-2 text-sm leading-6">{text}</p>
    </div>
  );
}

function StatusPill({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-neutral-500">
        {title}
      </p>

      <p className="mt-1 text-xs font-black uppercase leading-5 text-green-300">
        {value}
      </p>
    </div>
  );
}

function CaratulaInfo({ caratula }: { caratula: string }) {
  const descriptions: Record<string, string> = {
    "Lona backlight impresa":
      "Usa LONA_BACKLIGHT + IMPRESION_LONA_HP.",
    "Lona backlight rotulada":
      "Usa LONA_BACKLIGHT por m² + VINIL_CORTE_COLOR_ML estándar hasta 4 colores, 1 ML por color + ROTULADO_VINIL.",
    "Acrílico rotulado con vinil de corte":
      "Usa ACRILICO_BLANCO_LECHOSO + VINIL_CORTE_TRANSLUCIDO + ROTULADO_VINIL.",
    "Acrílico rotulado con impresión de vinil":
      "Usa ACRILICO_BLANCO_LECHOSO + VINIL_IMPRESO_M2 + ROTULADO_VINIL.",
    Policarbonato: "Usa POLICARBONATO.",
    Otro: "Usa costo manual de carátula por m².",
  };

  return (
    <InfoBox>
      {descriptions[caratula] || "Configuración no definida."}
    </InfoBox>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-neutral-400">{label}</span>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-neutral-700 bg-yellow-50 px-4 py-3 text-sm font-semibold text-neutral-950 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
      />
    </label>
  );
}

function NumberField({
  label,
  suffix,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  suffix?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-neutral-400">{label}</span>

      <div
        className={`flex overflow-hidden rounded-2xl border transition ${
          disabled
            ? "border-neutral-800 bg-neutral-800 opacity-70"
            : "border-neutral-700 bg-yellow-50 focus-within:border-yellow-400 focus-within:ring-2 focus-within:ring-yellow-400/20"
        }`}
      >
        <input
          value={value}
          type="number"
          step="0.01"
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={`min-w-0 flex-1 px-4 py-3 text-sm font-semibold outline-none ${
            disabled
              ? "cursor-not-allowed bg-neutral-800 text-neutral-400"
              : "bg-transparent text-neutral-950"
          }`}
        />

        {suffix && (
          <span
            className={`flex items-center px-3 text-xs font-bold ${
              disabled
                ? "bg-neutral-900 text-neutral-500"
                : "bg-yellow-100 text-neutral-700"
            }`}
          >
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
  options,
  onChange,
  getOptionLabel,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  getOptionLabel?: (value: string) => string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-neutral-400">{label}</span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-neutral-700 bg-yellow-50 px-4 py-3 text-sm font-semibold text-neutral-950 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {getOptionLabel ? getOptionLabel(option) : option}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-neutral-200 transition hover:border-neutral-600">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4"
      />

      {label}
    </label>
  );
}

function InfoBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs italic leading-5 text-yellow-100">
      {children}
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-neutral-800 pb-2">
      <span className="text-sm text-neutral-400">{label}</span>
      <span className="text-sm font-bold text-white">{value}</span>
    </div>
  );
}

function MiniMetric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
      <p className="text-xs text-neutral-500">{title}</p>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
    </div>
  );
}