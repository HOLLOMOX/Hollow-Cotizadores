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
    <div className="mt-8 space-y-6">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
        <div className="text-center">
          <h2 className="text-lg font-bold tracking-wide text-white">
            PANTERA PUBLICIDAD | COTIZADOR MAESTRO
          </h2>

          <p className="mt-1 text-sm font-semibold text-yellow-400">
            CAJAS DE LUZ · CAPTURA BÁSICA PARA VENDEDORES
          </p>

          <p className="mt-3 rounded-xl bg-yellow-100 px-4 py-2 text-xs font-semibold italic text-neutral-900">
            Rol actual: {role}. Los costos visibles dependen de los permisos
            asignados.
          </p>
        </div>
      </div>

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
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900 xl:col-span-4">
          <SectionHeader
            number="01"
            title="Datos y configuración del proyecto"
          />

          <div className="space-y-5 p-5">
            <FieldGroup title="Datos generales">
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
            </FieldGroup>

            <FieldGroup title="Medidas">
              <SelectField
                label="Tipo de caja"
                value={form.tipoCaja}
                options={TIPOS_CAJA}
                onChange={(value) =>
                  updateField("tipoCaja", value as FormState["tipoCaja"])
                }
              />

              <NumberField
                label="Cantidad de piezas"
                suffix="pzas"
                value={form.cantidad}
                onChange={(value) => updateField("cantidad", value)}
              />

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

              <NumberField
                label="Vistas"
                suffix="caras"
                value={form.vistas}
                onChange={(value) => updateField("vistas", value)}
              />

              <CheckboxField
                label="Canto automático"
                checked={form.usarCantoAutomatico}
                onChange={(value) => updateField("usarCantoAutomatico", value)}
              />

              {!form.usarCantoAutomatico && (
                <NumberField
                  label="Canto manual"
                  suffix="cm"
                  value={form.cantoCmManual}
                  onChange={(value) => updateField("cantoCmManual", value)}
                />
              )}
            </FieldGroup>

            <FieldGroup title="Carátula e iluminación">
              <SelectField
                label="Carátula"
                value={form.caratula}
                options={CARATULAS}
                onChange={(value) =>
                  updateField("caratula", value as FormState["caratula"])
                }
              />

              <InfoBox>
                La carátula se calcula automáticamente según la opción
                seleccionada. Solo “Otro” usa costo manual.
              </InfoBox>

              {form.caratula === "Otro" && (
                <NumberField
                  label="Costo carátula manual"
                  suffix="$/m²"
                  value={form.costoCaratulaM2}
                  onChange={(value) => updateField("costoCaratulaM2", value)}
                />
              )}

              <SelectField
                label="Iluminación"
                value={form.iluminacion}
                options={ILUMINACIONES}
                onChange={(value) =>
                  updateField("iluminacion", value as FormState["iluminacion"])
                }
              />
            </FieldGroup>

            <FieldGroup title="Instalación, traslado y diseño">
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

              <SelectField
                label="Zona de traslado"
                value={form.traslado}
                options={transportZoneOptions}
                getOptionLabel={(code) => {
                  const zone = transportZones.find((item) => item.code === code);
                  return zone?.display_name || zone?.label || code;
                }}
                onChange={(value) => updateField("traslado", value)}
              />

              <SelectField
                label="Tipo de traslado"
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
                    Trabajo: {money(selectedTransportZone.work_cost)} · Entrega:{" "}
                    {money(selectedTransportZone.delivery_cost)}
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

              <SelectField
                label="Diseño gráfico"
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
                        No se agregará costo de diseño a la cotización.
                      </>
                    )}
                  </>
                ) : (
                  "No se encontró información de esta opción de diseño."
                )}
              </InfoBox>
            </FieldGroup>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900 xl:col-span-4">
          <SectionHeader title="Adicionales y configuración automática" />

          <div className="space-y-5 p-5">
            <FieldGroup title="Adicionales del proyecto">
              <NumberField
                label="Material extra"
                suffix="$"
                value={form.materialExtra}
                onChange={(value) => updateField("materialExtra", value)}
              />

              <NumberField
                label="Andamios"
                suffix="servicios"
                value={form.andamios}
                onChange={(value) => updateField("andamios", value)}
              />

              <NumberField
                label="Núm. de descolgadas"
                suffix="servicios"
                value={form.numeroDescolgadas}
                onChange={(value) => updateField("numeroDescolgadas", value)}
              />

              <InfoBox>
                Andamios y descolgadas se cobran desde catálogo de costos. La
                altura puede aumentar automáticamente la mano de obra de
                instalación.
              </InfoBox>

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
            </FieldGroup>

            <FieldGroup title="Personas y tiempos">
              <CheckboxField
                label="Tiempos automáticos"
                checked={form.usarTiemposAutomaticos}
                onChange={(value) =>
                  updateField("usarTiemposAutomaticos", value)
                }
              />

              <NumberField
                label="Personas fabricación"
                suffix="personas"
                value={form.personasFabricacion}
                onChange={(value) => updateField("personasFabricacion", value)}
              />

              <NumberField
                label="Personas instalación"
                suffix="personas"
                value={form.personasInstalacion}
                onChange={(value) => updateField("personasInstalacion", value)}
              />

              {!form.usarTiemposAutomaticos && (
                <>
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
                </>
              )}

              <InfoBox>
                La mano de obra se calcula por hora-hombre: horas × personas ×
                costo por hora desde catálogo.
              </InfoBox>
            </FieldGroup>

            <FieldGroup title="Configuración de carátula">
              <CaratulaInfo caratula={form.caratula} />
            </FieldGroup>

            {form.iluminacion === "Lámparas LED" && (
              <FieldGroup title="Configuración de lámpara">
                <NumberField
                  label="Separación de lámparas"
                  suffix="m"
                  value={form.separacionLamparasM}
                  onChange={(value) => updateField("separacionLamparasM", value)}
                />

                <NumberField
                  label="Watts por lámpara"
                  suffix="W"
                  value={form.wattsPorLampara}
                  onChange={(value) => updateField("wattsPorLampara", value)}
                />

                <InfoBox>
                  Lámparas LED no usan fuente. Se cargan directo como pieza.
                </InfoBox>
              </FieldGroup>
            )}

            {form.iluminacion === "Módulos LED normales" && (
              <FieldGroup title="Cálculo LED normal">
                <NumberField
                  label="Tiras normales por m²"
                  suffix="tiras/m²"
                  value={form.tirasPorM2Normal}
                  onChange={(value) => updateField("tirasPorM2Normal", value)}
                />

                <InfoBox>
                  Cada tira trae 20 módulos. Cada módulo normal consume 0.72 W.
                </InfoBox>
              </FieldGroup>
            )}

            {form.iluminacion === "Módulos LED ultra brillantes" && (
              <FieldGroup title="Cálculo LED ultrabrillante">
                <NumberField
                  label="Tiras ultra por m²"
                  suffix="tiras/m²"
                  value={form.tirasPorM2Ultra}
                  onChange={(value) => updateField("tirasPorM2Ultra", value)}
                />

                <InfoBox>
                  Cada tira trae 20 módulos. Cada módulo ultrabrillante consume
                  1.5 W.
                </InfoBox>
              </FieldGroup>
            )}

            {form.iluminacion === "Micro LEDs" && (
              <FieldGroup title="Cálculo micro LED">
                <NumberField
                  label="Tiras micro por m²"
                  suffix="tiras/m²"
                  value={form.tirasPorM2Micro}
                  onChange={(value) => updateField("tirasPorM2Micro", value)}
                />

                <InfoBox>
                  Cada tira trae 20 módulos. Cada micro LED consume 0.2 W.
                </InfoBox>
              </FieldGroup>
            )}

            <FieldGroup title="Precio">
              <NumberField
                label="Margen"
                suffix="%"
                value={form.margen}
                onChange={(value) => updateField("margen", value)}
              />

              <NumberField
                label="IVA"
                suffix="%"
                value={form.ivaPorcentaje}
                onChange={(value) => updateField("ivaPorcentaje", value)}
              />
            </FieldGroup>

            <FieldGroup title="Observaciones">
              <textarea
                value={form.observaciones}
                onChange={(event) =>
                  updateField("observaciones", event.target.value)
                }
                className="min-h-24 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-white"
                placeholder="Texto libre para aclaraciones internas o de cliente..."
              />
            </FieldGroup>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900 xl:col-span-4">
          <SectionHeader number="02" title="Resultado para cotizar" />

          <div className="space-y-5 p-5">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
              <p className="text-center text-xs font-semibold uppercase tracking-wide text-yellow-400">
                Resumen según permisos del rol
              </p>

              <div className="mt-5 space-y-3">
                <ResultRow
                  label="Tiempo real de fabricación"
                  value={`${result.tiempos.fabricacionHoras} h`}
                />

                <ResultRow
                  label="Tiempo real de instalación"
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
                      label="Precio a cotizar S/IVA"
                      value={money(result.costos.precioSinIva)}
                    />

                    <ResultRow label="IVA" value={money(result.costos.iva)} />
                  </>
                )}

                {canViewUtility && (
                  <ResultRow
                    label="Utilidad"
                    value={money(result.costos.utilidad)}
                  />
                )}

                {canViewUtility && (
                  <ResultRow
                    label="Margen interno"
                    value={`${fixed(result.costos.margenPorcentaje)}%`}
                  />
                )}
              </div>

              {canViewSalePrice && (
                <div className="mt-5 rounded-xl bg-red-700 px-4 py-4 text-white">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-bold uppercase">
                      Total con IVA
                    </span>

                    <span className="text-2xl font-black">
                      {money(result.costos.totalConIva)}
                    </span>
                  </div>
                </div>
              )}

              {!canViewSalePrice && (
                <div className="mt-5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-4 text-yellow-100">
                  <p className="text-sm font-bold uppercase">
                    Vista sin precios de venta
                  </p>

                  <p className="mt-1 text-xs leading-5">
                    Este rol no tiene permiso para ver precio final, costos,
                    utilidad ni margen.
                  </p>
                </div>
              )}
            </div>

            {canViewInternalCosts && (
              <ValidationCard
                title="Estado del precio"
                value={result.validations.precio}
              />
            )}

            {!isGuest && (
              <>
                <ValidationCard
                  title="Validación de materiales"
                  value={result.validations.material}
                />

                <ValidationCard
                  title="Validación de servicios especiales"
                  value={result.validations.servicios}
                />

                <ValidationCard
                  title="Validación de impresión"
                  value={result.validations.impresion}
                />
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <MiniMetric
                title="Área frente"
                value={`${fixed(result.medidas.areaFrenteM2)} m²`}
              />

              <MiniMetric
                title="Canto"
                value={`${fixed(result.medidas.cantoCm)} cm`}
              />

              <MiniMetric
                title="Lámina total"
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

              <MiniMetric
                title="Fuente"
                value={result.iluminacion.fuente.label}
              />
            </div>
          </div>
        </section>
      </div>

      {canViewProductionMaterials && (
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900">
          <SectionHeader
            title={
              canViewProductPrices
                ? "Detalle de costos internos"
                : "Detalle de materiales para producción"
            }
          />

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
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm font-semibold leading-6 text-yellow-100">
            Tu rol no tiene permiso para ver materiales, SKUs, cantidades ni
            precios internos.
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900">
        <SectionHeader title="Cotización para copiar" />

        <div className="p-5">
          <div className="rounded-2xl border border-neutral-700 bg-neutral-950 p-4">
            <p className="text-sm leading-7 text-neutral-200">
              {result.textoCotizacion}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleCopyText}
              className="rounded-2xl border border-neutral-700 bg-neutral-950 px-5 py-3 text-sm font-black uppercase tracking-wide text-neutral-200 transition hover:border-yellow-400 hover:text-yellow-300"
            >
              Copiar texto
            </button>

            <button
              type="button"
              onClick={handleResetForm}
              className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-black uppercase tracking-wide text-red-300 transition hover:border-red-400 hover:bg-red-500/20"
            >
              Limpiar formulario
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {canViewSalePrice && (
              <>
                <MiniMetric
                  title="Precio S/IVA"
                  value={money(result.costos.precioSinIva)}
                />

                <MiniMetric title="IVA" value={money(result.costos.iva)} />

                <MiniMetric
                  title="Total C/IVA"
                  value={money(result.costos.totalConIva)}
                />
              </>
            )}

            {canViewUtility && (
              <MiniMetric
                title="Utilidad"
                value={money(result.costos.utilidad)}
              />
            )}

            {!canViewSalePrice && (
              <MiniMetric title="Precios" value="Ocultos para este rol" />
            )}
          </div>

          <div className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-black text-white">
                  Guardar cotización
                </p>

                <p className="mt-1 text-xs leading-5 text-neutral-500">
                  Guarda esta cotización como borrador en Supabase para
                  consultarla después.
                </p>

                {lastQuoteNumber && (
                  <p className="mt-2 text-xs font-bold text-yellow-300">
                    Última cotización guardada: {lastQuoteNumber}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleSaveQuote}
                disabled={isSaving}
                className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black uppercase tracking-wide text-neutral-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Guardando..." : "Guardar cotización"}
              </button>
            </div>

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
        </div>
      </section>
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
                key={`${line.grupo}-${line.concepto}-${index}`}
                className="border-b border-neutral-800"
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
            <tr className="bg-neutral-800/60">
              <td
                colSpan={5}
                className="px-3 py-2 text-xs font-bold uppercase text-yellow-300"
              >
                {group}
              </td>
            </tr>

            {lines.map((line, index) => (
              <tr
                key={`${line.grupo}-${line.concepto}-${index}`}
                className="border-b border-neutral-800"
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
    <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-100">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-300">
        {title}
      </p>

      <p className="mt-2 text-sm leading-6">{text}</p>
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

function SectionHeader({
  number,
  title,
}: {
  number?: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-t-2xl bg-neutral-800 px-5 py-3">
      {number && (
        <span className="rounded bg-neutral-950 px-2 py-1 text-xs font-bold text-yellow-400">
          {number}
        </span>
      )}

      <h3 className="text-sm font-bold uppercase tracking-wide text-white">
        {title}
      </h3>
    </div>
  );
}

function FieldGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
      <h4 className="mb-4 text-xs font-bold uppercase tracking-wide text-yellow-400">
        {title}
      </h4>

      <div className="grid gap-3">{children}</div>
    </div>
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
        className="rounded-xl border border-neutral-700 bg-yellow-50 px-3 py-2 text-sm font-semibold text-neutral-950 outline-none focus:border-yellow-400"
      />
    </label>
  );
}

function NumberField({
  label,
  suffix,
  value,
  onChange,
}: {
  label: string;
  suffix?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-neutral-400">{label}</span>

      <div className="flex overflow-hidden rounded-xl border border-neutral-700 bg-yellow-50 focus-within:border-yellow-400">
        <input
          value={value}
          type="number"
          step="0.01"
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm font-semibold text-neutral-950 outline-none"
        />

        {suffix && (
          <span className="flex items-center bg-yellow-100 px-3 text-xs font-bold text-neutral-700">
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
        className="rounded-xl border border-neutral-700 bg-yellow-50 px-3 py-2 text-sm font-semibold text-neutral-950 outline-none focus:border-yellow-400"
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
    <label className="flex items-center gap-3 rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-200">
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
    <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs italic leading-5 text-yellow-100">
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

function ValidationCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-800">
      <div className="bg-neutral-800 px-4 py-2 text-right text-xs font-bold uppercase text-white">
        {title}
      </div>

      <div className="bg-green-100 px-4 py-4 text-center text-sm font-bold uppercase text-green-800">
        {value}
      </div>
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