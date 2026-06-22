import type {
  FormState,
  FuenteResult,
  MaterialLine,
  QuoteResult,
} from "./types";
import {
  MODULOS_POR_TIRA,
  WATTS_MODULO_MICRO,
  WATTS_MODULO_NORMAL,
  WATTS_MODULO_ULTRA,
  getCantoRule,
  getLampRule,
  getTubularRule,
} from "./rules";
import { toNumber } from "./format";

function cost(costMap: Map<string, number>, sku: string) {
  return costMap.get(sku) ?? 0;
}

function fuentePorConsumo(consumo: number): FuenteResult {
  if (consumo <= 0) {
    return { label: "Sin fuente", qty30: 0, qty60: 0, qty100: 0 };
  }

  if (consumo <= 21) {
    return { label: "1 × Fuente 30 W", qty30: 1, qty60: 0, qty100: 0 };
  }

  if (consumo <= 42) {
    return { label: "1 × Fuente 60 W", qty30: 0, qty60: 1, qty100: 0 };
  }

  const qty100 = Math.ceil(consumo / 70);

  return {
    label: `${qty100} × Fuente 100 W`,
    qty30: 0,
    qty60: 0,
    qty100,
  };
}

function addLine({
  lines,
  grupo,
  concepto,
  sku,
  cantidad,
  unidad,
  costoUnitario,
}: {
  lines: MaterialLine[];
  grupo: string;
  concepto: string;
  sku?: string;
  cantidad: number;
  unidad: string;
  costoUnitario: number;
}) {
  lines.push({
    grupo,
    concepto,
    sku,
    cantidad,
    unidad,
    costoUnitario,
    total: cantidad * costoUnitario,
  });
}

function getPrecioState(margen: number) {
  if (margen >= 35) return "MARGEN SALUDABLE PARA NEGOCIAR";
  if (margen >= 25) return "MARGEN ACEPTABLE, REVISAR DESCUENTOS";
  return "MARGEN BAJO, REVISAR COSTOS O PRECIO";
}

function getFabricationHours(areaFrenteM2: number, personas: number) {
  const base =
    areaFrenteM2 <= 1
      ? 8
      : areaFrenteM2 <= 6
        ? 18
        : 24 + (areaFrenteM2 - 6) * 2;

  return Math.ceil(base / Math.max(personas, 1));
}

function getInstallationHours({
  incluyeInstalacion,
  areaFrenteM2,
  personas,
}: {
  incluyeInstalacion: string;
  areaFrenteM2: number;
  personas: number;
}) {
  if (incluyeInstalacion !== "SI") return 0;

  const base = Math.max(4, areaFrenteM2 * 1.5);
  return Math.ceil(base / Math.max(personas, 1));
}

export function calculateCajaLuz(
  form: FormState,
  costMap: Map<string, number>
): QuoteResult {
  const anchoM = toNumber(form.anchoM);
  const altoM = toNumber(form.altoM);
  const cantidad = Math.max(toNumber(form.cantidad), 1);

  const vistas =
    form.tipoCaja === "Doble vista"
      ? 2
      : Math.max(toNumber(form.vistas, 1), 1);

  const areaBaseM2 = anchoM * altoM;
  const areaFrenteM2 = areaBaseM2 * cantidad * vistas;
  const areaRespaldoM2 = areaBaseM2 * cantidad;
  const perimetroMl = 2 * (anchoM + altoM) * cantidad;

  const cantoRule = getCantoRule({
    tipoCaja: form.tipoCaja,
    iluminacion: form.iluminacion,
  });

  const cantoCm = form.usarCantoAutomatico
    ? cantoRule.cantoCm
    : toNumber(form.cantoCmManual);

  const desarrolloLaminaCm = form.usarCantoAutomatico
    ? cantoRule.desarrolloLaminaCm
    : cantoCm + 8;

  const desarrolloLaminaM = desarrolloLaminaCm / 100;
  const areaCantoM2 = perimetroMl * desarrolloLaminaM;
  const areaTotalLaminaM2 = areaRespaldoM2 + areaCantoM2;

  const lines: MaterialLine[] = [];

  addLine({
    lines,
    grupo: "Carátula",
    concepto: form.caratula,
    cantidad: areaFrenteM2,
    unidad: "m²",
    costoUnitario: toNumber(form.costoCaratulaM2),
  });

  addLine({
    lines,
    grupo: "Lámina",
    concepto: "Lámina respaldo galvanizada cal. 26",
    sku: "LAMINA_GALV_CAL26",
    cantidad: areaRespaldoM2,
    unidad: "m²",
    costoUnitario: cost(costMap, "LAMINA_GALV_CAL26"),
  });

  addLine({
    lines,
    grupo: "Lámina",
    concepto: "Lámina canto galvanizada cal. 26",
    sku: "LAMINA_GALV_CAL26",
    cantidad: areaCantoM2,
    unidad: "m²",
    costoUnitario: cost(costMap, "LAMINA_GALV_CAL26"),
  });

  const tubular = getTubularRule({
    tipoCaja: form.tipoCaja,
    areaBaseM2,
  });

  const refuerzosVerticalesPorCaja = Math.max(Math.ceil(anchoM / 1) - 1, 0);
  const refuerzosHorizontalesPorCaja = Math.max(Math.ceil(altoM / 1) - 1, 0);

  const refuerzoVerticalMl = refuerzosVerticalesPorCaja * altoM * cantidad;
  const refuerzoHorizontalMl = refuerzosHorizontalesPorCaja * anchoM * cantidad;
  const refuerzosMl = refuerzoVerticalMl + refuerzoHorizontalMl;

  const tubularMl = perimetroMl + refuerzosMl;
  const tramosTubular = Math.ceil(tubularMl / 6);

  addLine({
    lines,
    grupo: "Estructura",
    concepto: tubular.label,
    sku: tubular.sku,
    cantidad: tramosTubular,
    unidad: "TRAMO 6M",
    costoUnitario: cost(costMap, tubular.sku),
  });

  const inserciones =
    4 * cantidad +
    refuerzosVerticalesPorCaja * 2 * cantidad +
    refuerzosHorizontalesPorCaja * 2 * cantidad;

  const varillasSoldadura = Math.ceil(
    inserciones * tubular.varillaSoldaduraPorInsercion
  );

  addLine({
    lines,
    grupo: "Estructura",
    concepto: "Soldadura 6013",
    sku: "SOLDADURA_6013",
    cantidad: varillasSoldadura,
    unidad: "VARILLA",
    costoUnitario: cost(costMap, "SOLDADURA_6013"),
  });

  let iluminacionLabel = "Sin iluminación";
  let iluminacionCantidad = 0;
  let iluminacionUnidad = "PIEZA";
  let modulosTotales = 0;
  let wattsPorModulo = 0;
  let consumoW = 0;
  let usaFuente = false;

  if (form.iluminacion === "Lámparas LED") {
    const lamp = getLampRule(altoM);
    const separacion = Math.max(toNumber(form.separacionLamparasM), 0.01);

    const lamparasPorLinea = Math.max(Math.ceil(anchoM / separacion), 1);
    const lineasVerticales = Math.max(Math.ceil(altoM / lamp.largoM), 1);

    iluminacionLabel = lamp.label;
    iluminacionCantidad = lamparasPorLinea * lineasVerticales * cantidad * vistas;
    iluminacionUnidad = "PIEZA";
    consumoW = iluminacionCantidad * toNumber(form.wattsPorLampara);
    usaFuente = false;

    addLine({
      lines,
      grupo: "Iluminación",
      concepto: lamp.label,
      sku: lamp.sku,
      cantidad: iluminacionCantidad,
      unidad: "PIEZA",
      costoUnitario: cost(costMap, lamp.sku),
    });
  }

  if (form.iluminacion === "Módulos LED normales") {
    iluminacionLabel = "Tiras de módulos LED normales";
    iluminacionCantidad = Math.ceil(
      areaFrenteM2 * toNumber(form.tirasPorM2Normal)
    );
    iluminacionUnidad = "TIRA C/20";
    wattsPorModulo = WATTS_MODULO_NORMAL;
    modulosTotales = iluminacionCantidad * MODULOS_POR_TIRA;
    consumoW = modulosTotales * wattsPorModulo;
    usaFuente = true;

    addLine({
      lines,
      grupo: "Iluminación",
      concepto: iluminacionLabel,
      sku: "TIRA_LED_NORMAL",
      cantidad: iluminacionCantidad,
      unidad: "TIRA C/20",
      costoUnitario: cost(costMap, "TIRA_LED_NORMAL"),
    });
  }

  if (form.iluminacion === "Módulos LED ultra brillantes") {
    iluminacionLabel = "Tiras de módulos LED ultra brillantes";
    iluminacionCantidad = Math.ceil(
      areaFrenteM2 * toNumber(form.tirasPorM2Ultra)
    );
    iluminacionUnidad = "TIRA C/20";
    wattsPorModulo = WATTS_MODULO_ULTRA;
    modulosTotales = iluminacionCantidad * MODULOS_POR_TIRA;
    consumoW = modulosTotales * wattsPorModulo;
    usaFuente = true;

    addLine({
      lines,
      grupo: "Iluminación",
      concepto: iluminacionLabel,
      sku: "TIRA_LED_ULTRA",
      cantidad: iluminacionCantidad,
      unidad: "TIRA C/20",
      costoUnitario: cost(costMap, "TIRA_LED_ULTRA"),
    });
  }

  if (form.iluminacion === "Micro LEDs") {
    iluminacionLabel = "Tiras de micro LED";
    iluminacionCantidad = Math.ceil(
      areaFrenteM2 * toNumber(form.tirasPorM2Micro)
    );
    iluminacionUnidad = "TIRA C/20";
    wattsPorModulo = WATTS_MODULO_MICRO;
    modulosTotales = iluminacionCantidad * MODULOS_POR_TIRA;
    consumoW = modulosTotales * wattsPorModulo;
    usaFuente = true;

    addLine({
      lines,
      grupo: "Iluminación",
      concepto: iluminacionLabel,
      sku: "TIRA_MICRO_LED",
      cantidad: iluminacionCantidad,
      unidad: "TIRA C/20",
      costoUnitario: cost(costMap, "TIRA_MICRO_LED"),
    });
  }

  const fuente = usaFuente
    ? fuentePorConsumo(consumoW)
    : { label: "No aplica", qty30: 0, qty60: 0, qty100: 0 };

  if (usaFuente) {
    if (fuente.qty30 > 0) {
      addLine({
        lines,
        grupo: "Iluminación",
        concepto: "Fuente 30 W",
        sku: "FUENTE_30W",
        cantidad: fuente.qty30,
        unidad: "PIEZA",
        costoUnitario: cost(costMap, "FUENTE_30W"),
      });
    }

    if (fuente.qty60 > 0) {
      addLine({
        lines,
        grupo: "Iluminación",
        concepto: "Fuente 60 W",
        sku: "FUENTE_60W",
        cantidad: fuente.qty60,
        unidad: "PIEZA",
        costoUnitario: cost(costMap, "FUENTE_60W"),
      });
    }

    if (fuente.qty100 > 0) {
      addLine({
        lines,
        grupo: "Iluminación",
        concepto: "Fuente 100 W",
        sku: "FUENTE_100W",
        cantidad: fuente.qty100,
        unidad: "PIEZA",
        costoUnitario: cost(costMap, "FUENTE_100W"),
      });
    }
  }

  addLine({
    lines,
    grupo: "Mano de obra",
    concepto: "Mano de obra fabricación",
    cantidad: areaFrenteM2,
    unidad: "m²",
    costoUnitario: toNumber(form.manoObraM2),
  });

  if (form.incluyeInstalacion === "SI") {
    addLine({
      lines,
      grupo: "Servicios",
      concepto: "Instalación",
      cantidad: 1,
      unidad: "SERVICIO",
      costoUnitario: toNumber(form.instalacion),
    });
  }

  addLine({
    lines,
    grupo: "Adicionales",
    concepto: "Material extra",
    cantidad: 1,
    unidad: "LOTE",
    costoUnitario: toNumber(form.materialExtra),
  });

  addLine({
    lines,
    grupo: "Adicionales",
    concepto: "Andamios",
    cantidad: 1,
    unidad: "SERVICIO",
    costoUnitario: toNumber(form.andamios),
  });

  addLine({
    lines,
    grupo: "Adicionales",
    concepto: "Extras",
    cantidad: 1,
    unidad: "LOTE",
    costoUnitario: toNumber(form.extras),
  });

  const costoDirecto = lines.reduce((sum, line) => sum + line.total, 0);

  const margenPorcentaje = toNumber(form.margen);
  const precioSinIva =
    margenPorcentaje >= 100
      ? costoDirecto
      : costoDirecto / (1 - margenPorcentaje / 100);

  const iva = precioSinIva * (toNumber(form.ivaPorcentaje) / 100);
  const totalConIva = precioSinIva + iva;
  const utilidad = precioSinIva - costoDirecto;

  const fabricacionHoras = getFabricationHours(
    areaFrenteM2,
    Math.max(toNumber(form.personasFabricacion), 1)
  );

  const instalacionHoras = getInstallationHours({
    incluyeInstalacion: form.incluyeInstalacion,
    areaFrenteM2,
    personas: Math.max(toNumber(form.personasInstalacion), 1),
  });

  const missingCost = lines.some(
    (line) => line.cantidad > 0 && line.total === 0 && line.grupo !== "Adicionales"
  );

  const validations = {
    material: missingCost
      ? "REVISAR COSTOS EN CATÁLOGO"
      : "SELECCIONES COHERENTES",
    servicios:
      form.incluyeInstalacion === "SI" && instalacionHoras <= 0
        ? "REVISAR INSTALACIÓN"
        : "PRECIOS ESPECIALES COMPLETOS",
    impresion: form.caratula.includes("impresa")
      ? "IMPRESIÓN CONFIGURADA"
      : "NO REQUIERE IMPRESIÓN",
    precio: getPrecioState(margenPorcentaje),
  };

  const textoCotizacion = [
    `COTIZACIÓN — MEDIDAS ${anchoM.toFixed(2)} X ${altoM.toFixed(
      2
    )} M, FONDO ${cantoCm.toFixed(0)} CM, ${vistas} VISTA(S).`,
    `CARÁTULA: ${form.caratula.toUpperCase()}.`,
    `ILUMINACIÓN: ${form.iluminacion.toUpperCase()}.`,
    form.incluyeInstalacion === "SI"
      ? `INCLUYE INSTALACIÓN ${form.alturaCondicion.toUpperCase()}.`
      : "NO INCLUYE INSTALACIÓN.",
    `TRASLADO: ${form.traslado.toUpperCase()}.`,
    `DISEÑO: ${form.disenoGrafico.toUpperCase()}.`,
    form.observaciones ? `OBSERVACIONES: ${form.observaciones}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    medidas: {
      anchoM,
      altoM,
      cantidad,
      vistas,
      areaBaseM2,
      areaFrenteM2,
      areaRespaldoM2,
      perimetroMl,
      cantoCm,
      desarrolloLaminaCm,
    },
    lamina: {
      areaCantoM2,
      areaTotalM2: areaTotalLaminaM2,
    },
    estructura: {
      tubularLabel: tubular.label,
      tubularSku: tubular.sku,
      tubularMl,
      tramosTubular,
      refuerzosMl,
      inserciones,
      varillasSoldadura,
    },
    iluminacion: {
      label: iluminacionLabel,
      cantidad: iluminacionCantidad,
      unidad: iluminacionUnidad,
      modulosTotales,
      wattsPorModulo,
      consumoW,
      usaFuente,
      fuente,
    },
    tiempos: {
      fabricacionHoras,
      instalacionHoras,
    },
    costos: {
      costoDirecto,
      precioSinIva,
      iva,
      totalConIva,
      utilidad,
      margenPorcentaje,
    },
    validations,
    partidas: lines,
    textoCotizacion,
  };
}