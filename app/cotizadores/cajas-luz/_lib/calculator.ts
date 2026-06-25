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
  getAlturaInstalacionRule,
  getCantoRule,
  getLampRule,
  getTubularRule,
} from "./rules";
import { toNumber } from "./format";

const BASES_POR_LAMPARA = 2;
const TORNILLOS_POR_BASE = 1;
const TUERCAS_POR_BASE = 1;

const MAX_COLORES_VINIL_ROTULADO = 4;
const ML_VINIL_POR_COLOR_ROTULADO = 1;

const TIRAS_POR_TUBO_GUNTHER = 2;

const SEPARACION_PIJA_RECTA_M = 0.15;
const SEPARACION_PIJA_SUAJADA_M = 0.1;

const RENDIMIENTO_LIJA_M2 = 4;
const RENDIMIENTO_THINNER_M2_POR_LITRO = 10;
const RENDIMIENTO_PRIMER_M2_POR_LITRO = 8;
const RENDIMIENTO_PINTURA_M2_POR_LITRO = 8;

function cost(costMap: Map<string, number>, sku: string) {
  return costMap.get(sku) ?? 0;
}

function fuentePorConsumo(consumo: number): FuenteResult {
  if (consumo <= 0) {
    return {
      label: "Sin fuente",
      qty30: 0,
      qty60: 0,
      qty100: 0,
    };
  }

  if (consumo <= 21) {
    return {
      label: "1 × Fuente 30 W",
      qty30: 1,
      qty60: 0,
      qty100: 0,
    };
  }

  if (consumo <= 42) {
    return {
      label: "1 × Fuente 60 W",
      qty30: 0,
      qty60: 1,
      qty100: 0,
    };
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
  if (cantidad <= 0) return;

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

function addCaratulaLines({
  lines,
  form,
  costMap,
  areaFrenteM2,
}: {
  lines: MaterialLine[];
  form: FormState;
  costMap: Map<string, number>;
  areaFrenteM2: number;
}) {
  if (form.caratula === "Lona backlight impresa") {
    addLine({
      lines,
      grupo: "Carátula",
      concepto: "Lona backlight",
      sku: "LONA_BACKLIGHT",
      cantidad: areaFrenteM2,
      unidad: "m²",
      costoUnitario: cost(costMap, "LONA_BACKLIGHT"),
    });

    addLine({
      lines,
      grupo: "Carátula",
      concepto: "Impresión lona backlight alta resolución HP",
      sku: "IMPRESION_LONA_HP",
      cantidad: areaFrenteM2,
      unidad: "m²",
      costoUnitario: cost(costMap, "IMPRESION_LONA_HP"),
    });

    return;
  }

  if (form.caratula === "Lona backlight rotulada") {
    const mlVinilTotal =
      MAX_COLORES_VINIL_ROTULADO * ML_VINIL_POR_COLOR_ROTULADO;

    addLine({
      lines,
      grupo: "Carátula",
      concepto: "Lona backlight",
      sku: "LONA_BACKLIGHT",
      cantidad: areaFrenteM2,
      unidad: "m²",
      costoUnitario: cost(costMap, "LONA_BACKLIGHT"),
    });

    addLine({
      lines,
      grupo: "Carátula",
      concepto: "Vinil de corte estándar hasta 4 colores",
      sku: "VINIL_CORTE_COLOR_ML",
      cantidad: mlVinilTotal,
      unidad: "ML",
      costoUnitario: cost(costMap, "VINIL_CORTE_COLOR_ML"),
    });

    addLine({
      lines,
      grupo: "Carátula",
      concepto: "Mano de obra rotulado vinil",
      sku: "ROTULADO_VINIL",
      cantidad: areaFrenteM2,
      unidad: "m²",
      costoUnitario: cost(costMap, "ROTULADO_VINIL"),
    });

    return;
  }

  if (form.caratula === "Acrílico rotulado con vinil de corte") {
    addLine({
      lines,
      grupo: "Carátula",
      concepto: "Acrílico blanco lechoso",
      sku: "ACRILICO_BLANCO_LECHOSO",
      cantidad: areaFrenteM2,
      unidad: "m²",
      costoUnitario: cost(costMap, "ACRILICO_BLANCO_LECHOSO"),
    });

    addLine({
      lines,
      grupo: "Carátula",
      concepto: "Vinil de corte translúcido",
      sku: "VINIL_CORTE_TRANSLUCIDO",
      cantidad: areaFrenteM2,
      unidad: "m²",
      costoUnitario: cost(costMap, "VINIL_CORTE_TRANSLUCIDO"),
    });

    addLine({
      lines,
      grupo: "Carátula",
      concepto: "Mano de obra rotulado vinil",
      sku: "ROTULADO_VINIL",
      cantidad: areaFrenteM2,
      unidad: "m²",
      costoUnitario: cost(costMap, "ROTULADO_VINIL"),
    });

    return;
  }

  if (form.caratula === "Acrílico rotulado con impresión de vinil") {
    addLine({
      lines,
      grupo: "Carátula",
      concepto: "Acrílico blanco lechoso",
      sku: "ACRILICO_BLANCO_LECHOSO",
      cantidad: areaFrenteM2,
      unidad: "m²",
      costoUnitario: cost(costMap, "ACRILICO_BLANCO_LECHOSO"),
    });

    addLine({
      lines,
      grupo: "Carátula",
      concepto: "Vinil impreso",
      sku: "VINIL_IMPRESO_M2",
      cantidad: areaFrenteM2,
      unidad: "m²",
      costoUnitario: cost(costMap, "VINIL_IMPRESO_M2"),
    });

    addLine({
      lines,
      grupo: "Carátula",
      concepto: "Mano de obra rotulado vinil impreso",
      sku: "ROTULADO_VINIL",
      cantidad: areaFrenteM2,
      unidad: "m²",
      costoUnitario: cost(costMap, "ROTULADO_VINIL"),
    });

    return;
  }

  if (form.caratula === "Policarbonato") {
    addLine({
      lines,
      grupo: "Carátula",
      concepto: "Policarbonato",
      sku: "POLICARBONATO",
      cantidad: areaFrenteM2,
      unidad: "m²",
      costoUnitario: cost(costMap, "POLICARBONATO"),
    });

    return;
  }

  addLine({
    lines,
    grupo: "Carátula",
    concepto: "Carátula especial / otro",
    cantidad: areaFrenteM2,
    unidad: "m²",
    costoUnitario: toNumber(form.costoCaratulaM2),
  });
}

function addHerrajesConsumiblesLines({
  lines,
  form,
  costMap,
  perimetroMl,
  areaTotalLaminaM2,
  iluminacionCantidad,
  iluminacionUnidad,
}: {
  lines: MaterialLine[];
  form: FormState;
  costMap: Map<string, number>;
  perimetroMl: number;
  areaTotalLaminaM2: number;
  iluminacionCantidad: number;
  iluminacionUnidad: string;
}) {
  const separacionPija =
    form.tipoCaja === "Suajada"
      ? SEPARACION_PIJA_SUAJADA_M
      : SEPARACION_PIJA_RECTA_M;

  const pijasCanto = Math.ceil(perimetroMl / separacionPija);

  addLine({
    lines,
    grupo: "Herrajes",
    concepto: "Pija Tek 1/2 para canto",
    sku: "PIJA_TEK_1_2",
    cantidad: pijasCanto,
    unidad: "PIEZA",
    costoUnitario: cost(costMap, "PIJA_TEK_1_2"),
  });

  if (form.iluminacion === "Lámparas LED" && iluminacionCantidad > 0) {
    const bases = iluminacionCantidad * BASES_POR_LAMPARA;
    const tornillos = bases * TORNILLOS_POR_BASE;
    const tuercas = bases * TUERCAS_POR_BASE;

    addLine({
      lines,
      grupo: "Herrajes",
      concepto: "Base para lámpara LED T8",
      sku: "BASE_LAMPARA_T8",
      cantidad: bases,
      unidad: "PIEZA",
      costoUnitario: cost(costMap, "BASE_LAMPARA_T8"),
    });

    addLine({
      lines,
      grupo: "Herrajes",
      concepto: "Tornillo 5/32 x 1",
      sku: "TORNILLO_5_32_X1",
      cantidad: tornillos,
      unidad: "PIEZA",
      costoUnitario: cost(costMap, "TORNILLO_5_32_X1"),
    });

    addLine({
      lines,
      grupo: "Herrajes",
      concepto: "Tuerca 5/32",
      sku: "TUERCA_5_32",
      cantidad: tuercas,
      unidad: "PIEZA",
      costoUnitario: cost(costMap, "TUERCA_5_32"),
    });
  }

  const usaModulos =
    form.iluminacion === "Módulos LED normales" ||
    form.iluminacion === "Módulos LED ultra brillantes" ||
    form.iluminacion === "Micro LEDs";

  if (usaModulos && iluminacionCantidad > 0) {
    const tubosGunther = Math.ceil(
      iluminacionCantidad / TIRAS_POR_TUBO_GUNTHER
    );

    addLine({
      lines,
      grupo: "Consumibles",
      concepto: "Pegamento Gunther",
      sku: "GUNTHER",
      cantidad: tubosGunther,
      unidad: "TUBO",
      costoUnitario: cost(costMap, "GUNTHER"),
    });
  }

  if (form.iluminacion !== "Sin iluminación") {
    const cable14Ml = Math.ceil(perimetroMl + 2);

    const cable18Ml =
      iluminacionUnidad === "PIEZA"
        ? Math.ceil(iluminacionCantidad * 0.5)
        : Math.ceil(iluminacionCantidad * 0.3);

    addLine({
      lines,
      grupo: "Eléctrico",
      concepto: "Cable 14 dúplex",
      sku: "CABLE_14_DUPLEX",
      cantidad: cable14Ml,
      unidad: "ML",
      costoUnitario: cost(costMap, "CABLE_14_DUPLEX"),
    });

    addLine({
      lines,
      grupo: "Eléctrico",
      concepto: "Cable calibre 18",
      sku: "CABLE_18",
      cantidad: cable18Ml,
      unidad: "ML",
      costoUnitario: cost(costMap, "CABLE_18"),
    });
  }

  const lijas = Math.max(1, Math.ceil(areaTotalLaminaM2 / RENDIMIENTO_LIJA_M2));

  const thinnerLitros = Math.max(
    1,
    Math.ceil(areaTotalLaminaM2 / RENDIMIENTO_THINNER_M2_POR_LITRO)
  );

  const estopaKg = Math.max(0.25, thinnerLitros * 0.25);

  const primerLitros = Math.max(
    1,
    Math.ceil(areaTotalLaminaM2 / RENDIMIENTO_PRIMER_M2_POR_LITRO)
  );

  const pinturaLitros = Math.max(
    1,
    Math.ceil(areaTotalLaminaM2 / RENDIMIENTO_PINTURA_M2_POR_LITRO)
  );

  addLine({
    lines,
    grupo: "Acabado",
    concepto: "Lija 100/120",
    sku: "LIJA_100_120",
    cantidad: lijas,
    unidad: "PIEZA",
    costoUnitario: cost(costMap, "LIJA_100_120"),
  });

  addLine({
    lines,
    grupo: "Acabado",
    concepto: "Thinner",
    sku: "THINNER",
    cantidad: thinnerLitros,
    unidad: "LITRO",
    costoUnitario: cost(costMap, "THINNER"),
  });

  addLine({
    lines,
    grupo: "Acabado",
    concepto: "Estopa",
    sku: "ESTOPA",
    cantidad: estopaKg,
    unidad: "KG",
    costoUnitario: cost(costMap, "ESTOPA"),
  });

  addLine({
    lines,
    grupo: "Acabado",
    concepto: "Primer anticorrosivo",
    sku: "PRIMER_ANTICORROSIVO",
    cantidad: primerLitros,
    unidad: "LITRO",
    costoUnitario: cost(costMap, "PRIMER_ANTICORROSIVO"),
  });

  addLine({
    lines,
    grupo: "Acabado",
    concepto: "Pintura esmalte",
    sku: "PINTURA_ESMALTE",
    cantidad: pinturaLitros,
    unidad: "LITRO",
    costoUnitario: cost(costMap, "PINTURA_ESMALTE"),
  });
}

function getTuboAlmaRule(areaBaseM2: number) {
  if (areaBaseM2 <= 3) {
    return {
      sku: "TUBO_ALMA_2",
      label: 'Tubo cédula alma 2"',
    };
  }

  if (areaBaseM2 <= 7) {
    return {
      sku: "TUBO_ALMA_3",
      label: 'Tubo cédula alma 3"',
    };
  }

  return {
    sku: "TUBO_ALMA_4",
    label: 'Tubo cédula alma 4"',
  };
}

function addSoportesInstalacionLines({
  lines,
  form,
  costMap,
  cantidad,
  areaBaseM2,
  perimetroMl,
}: {
  lines: MaterialLine[];
  form: FormState;
  costMap: Map<string, number>;
  cantidad: number;
  areaBaseM2: number;
  perimetroMl: number;
}) {
  if (form.incluyeInstalacion !== "SI") return;

  const condicion = form.alturaCondicion.toLowerCase();

  const esAzotea = condicion.includes("azotea");

  const esPared =
    condicion.includes("pared") ||
    condicion.includes("muro") ||
    condicion.includes("fachada");

  const esEspecial =
    form.tipoCaja === "Bandera" ||
    form.tipoCaja === "Paleta" ||
    form.tipoCaja === "Doble vista";

  if (esAzotea || esPared || esEspecial) {
    const anguloSku = esAzotea ? "ANGULO_ACERO_1" : "ANGULO_ACERO_1_1_2";

    const anguloLabel = esAzotea
      ? 'Ángulo de acero 1"'
      : 'Ángulo de acero 1 1/2"';

    const anguloMl = Math.ceil(Math.max(perimetroMl * 0.5, cantidad * 2));
    const puntosFijacion = Math.max(4 * cantidad, Math.ceil(anguloMl / 0.5));

    addLine({
      lines,
      grupo: "Soportes instalación",
      concepto: anguloLabel,
      sku: anguloSku,
      cantidad: anguloMl,
      unidad: "ML",
      costoUnitario: cost(costMap, anguloSku),
    });

    addLine({
      lines,
      grupo: "Soportes instalación",
      concepto: "Taquete TX 3/8 x 3",
      sku: "TAQUETE_TX_3_8",
      cantidad: puntosFijacion,
      unidad: "PIEZA",
      costoUnitario: cost(costMap, "TAQUETE_TX_3_8"),
    });

    addLine({
      lines,
      grupo: "Soportes instalación",
      concepto: 'Pija taladrante 2"',
      sku: "PIJA_TALADRANTE_2",
      cantidad: puntosFijacion,
      unidad: "PIEZA",
      costoUnitario: cost(costMap, "PIJA_TALADRANTE_2"),
    });
  }

  if (form.tipoCaja === "Bandera" || form.tipoCaja === "Paleta") {
    const tuboAlma = getTuboAlmaRule(areaBaseM2);

    const piezasTuboAlma = cantidad;
    const placas = form.tipoCaja === "Paleta" ? 2 * cantidad : cantidad;
    const tornilleriaPlaca = 4 * cantidad;

    addLine({
      lines,
      grupo: "Tubo alma",
      concepto: tuboAlma.label,
      sku: tuboAlma.sku,
      cantidad: piezasTuboAlma,
      unidad: "PIEZA",
      costoUnitario: cost(costMap, tuboAlma.sku),
    });

    addLine({
      lines,
      grupo: "Tubo alma",
      concepto: "Placa de acero para tubo alma",
      sku: "PLACA_ACERO_TUBO_ALMA",
      cantidad: placas,
      unidad: "PIEZA",
      costoUnitario: cost(costMap, "PLACA_ACERO_TUBO_ALMA"),
    });

    addLine({
      lines,
      grupo: "Tubo alma",
      concepto: "Tornillo 1/2 grado 5",
      sku: "TORNILLO_GRADO5_1_2",
      cantidad: tornilleriaPlaca,
      unidad: "PIEZA",
      costoUnitario: cost(costMap, "TORNILLO_GRADO5_1_2"),
    });

    addLine({
      lines,
      grupo: "Tubo alma",
      concepto: "Tuerca 1/2",
      sku: "TUERCA_1_2",
      cantidad: tornilleriaPlaca,
      unidad: "PIEZA",
      costoUnitario: cost(costMap, "TUERCA_1_2"),
    });

    addLine({
      lines,
      grupo: "Tubo alma",
      concepto: "Rondana 1/2",
      sku: "RONDANA_1_2",
      cantidad: tornilleriaPlaca,
      unidad: "PIEZA",
      costoUnitario: cost(costMap, "RONDANA_1_2"),
    });

    addLine({
      lines,
      grupo: "Tubo alma",
      concepto: "Rondana de presión 1/2",
      sku: "RONDANA_PRESION_1_2",
      cantidad: tornilleriaPlaca,
      unidad: "PIEZA",
      costoUnitario: cost(costMap, "RONDANA_PRESION_1_2"),
    });
  }
}

function getPrecioState(margen: number) {
  if (margen >= 35) return "MARGEN SALUDABLE PARA NEGOCIAR";
  if (margen >= 25) return "MARGEN ACEPTABLE, REVISAR DESCUENTOS";
  return "MARGEN BAJO, REVISAR COSTOS O PRECIO";
}

function getFabricationHours(areaFrenteM2: number) {
  if (areaFrenteM2 <= 1) return 8;
  if (areaFrenteM2 <= 6) return 18;

  return Math.ceil(24 + (areaFrenteM2 - 6) * 2);
}

function getInstallationHours({
  incluyeInstalacion,
  areaFrenteM2,
}: {
  incluyeInstalacion: string;
  areaFrenteM2: number;
}) {
  if (incluyeInstalacion !== "SI") return 0;

  return Math.ceil(Math.max(4, areaFrenteM2 * 1.5));
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

  const personasFabricacion = Math.max(toNumber(form.personasFabricacion), 1);
  const personasInstalacion = Math.max(toNumber(form.personasInstalacion), 1);

  const fabricacionHoras = form.usarTiemposAutomaticos
    ? getFabricationHours(areaFrenteM2)
    : Math.max(toNumber(form.horasFabricacionManual), 0);

  const instalacionHoras =
    form.incluyeInstalacion === "SI"
      ? form.usarTiemposAutomaticos
        ? getInstallationHours({
            incluyeInstalacion: form.incluyeInstalacion,
            areaFrenteM2,
          })
        : Math.max(toNumber(form.horasInstalacionManual), 0)
      : 0;

  const horasHombreFabricacion = fabricacionHoras * personasFabricacion;
  const horasHombreInstalacion = instalacionHoras * personasInstalacion;

  const alturaInstalacionRule = getAlturaInstalacionRule(
    form.alturaCondicion
  );

  const lines: MaterialLine[] = [];

  addCaratulaLines({
    lines,
    form,
    costMap,
    areaFrenteM2,
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
    iluminacionCantidad =
      lamparasPorLinea * lineasVerticales * cantidad * vistas;
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
    modulosTotales = iluminacionCantidad * MODULOS_POR_TIRA;
    wattsPorModulo = WATTS_MODULO_NORMAL;
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
    modulosTotales = iluminacionCantidad * MODULOS_POR_TIRA;
    wattsPorModulo = WATTS_MODULO_ULTRA;
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
    modulosTotales = iluminacionCantidad * MODULOS_POR_TIRA;
    wattsPorModulo = WATTS_MODULO_MICRO;
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
    : {
        label: "No aplica",
        qty30: 0,
        qty60: 0,
        qty100: 0,
      };

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

  addHerrajesConsumiblesLines({
    lines,
    form,
    costMap,
    perimetroMl,
    areaTotalLaminaM2,
    iluminacionCantidad,
    iluminacionUnidad,
  });

  addSoportesInstalacionLines({
    lines,
    form,
    costMap,
    cantidad,
    areaBaseM2,
    perimetroMl,
  });

  addLine({
    lines,
    grupo: "Mano de obra",
    concepto: "Mano de obra fabricación",
    sku: "MO_FABRICACION_HORA",
    cantidad: horasHombreFabricacion,
    unidad: "HORA-HOMBRE",
    costoUnitario: cost(costMap, "MO_FABRICACION_HORA"),
  });

  if (form.incluyeInstalacion === "SI") {
    const costoHoraInstalacion = cost(costMap, "MO_INSTALACION_HORA");
    const costoBaseInstalacion =
      horasHombreInstalacion * costoHoraInstalacion;

    addLine({
      lines,
      grupo: "Mano de obra",
      concepto: "Mano de obra instalación",
      sku: "MO_INSTALACION_HORA",
      cantidad: horasHombreInstalacion,
      unidad: "HORA-HOMBRE",
      costoUnitario: costoHoraInstalacion,
    });

    if (alturaInstalacionRule.porcentajeExtra > 0) {
      addLine({
        lines,
        grupo: "Instalación",
        concepto: `Incremento por ${alturaInstalacionRule.label} (${alturaInstalacionRule.porcentajeExtra}%)`,
        sku: "AJUSTE_ALTURA_INSTALACION",
        cantidad: 1,
        unidad: "AJUSTE",
        costoUnitario:
          costoBaseInstalacion *
          (alturaInstalacionRule.porcentajeExtra / 100),
      });
    }

    addLine({
      lines,
      grupo: "Instalación",
      concepto: "Andamio para instalación",
      sku: "ANDAMIO_SERVICIO",
      cantidad: Math.max(toNumber(form.andamios), 0),
      unidad: "SERVICIO",
      costoUnitario: cost(costMap, "ANDAMIO_SERVICIO"),
    });

    addLine({
      lines,
      grupo: "Instalación",
      concepto: "Descolgada para instalación",
      sku: "DESCOLGADA_SERVICIO",
      cantidad: Math.max(toNumber(form.numeroDescolgadas), 0),
      unidad: "SERVICIO",
      costoUnitario: cost(costMap, "DESCOLGADA_SERVICIO"),
    });
  }

  if (form.incluyeInstalacion === "SI" && toNumber(form.instalacion) > 0) {
    addLine({
      lines,
      grupo: "Servicios",
      concepto: "Servicio instalación extra",
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

  const missingCost = lines.some(
    (line) =>
      line.cantidad > 0 && line.total === 0 && line.grupo !== "Adicionales"
  );

  const validations = {
    material: missingCost
      ? "REVISAR COSTOS EN CATÁLOGO"
      : "SELECCIONES COHERENTES",
    servicios:
      form.incluyeInstalacion === "SI" && horasHombreInstalacion <= 0
        ? "REVISAR MANO DE OBRA INSTALACIÓN"
        : "PRECIOS ESPECIALES COMPLETOS",
    impresion:
      form.caratula === "Lona backlight impresa" ||
      form.caratula === "Acrílico rotulado con impresión de vinil"
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
      horasHombreFabricacion,
      horasHombreInstalacion,
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
}"use client";

import {
  Fragment,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import type { CostRow, FormState } from "./_lib/types";
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
  saveAction,
  userRole,
}: {
  costRows: CostRow[];
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

  const costMap = useMemo(() => {
    const map = new Map<string, number>();

    costRows.forEach((item) => {
      map.set(item.sku, Number(item.cost || 0));
    });

    return map;
  }, [costRows]);

  const result = useMemo(() => {
    return calculateCajaLuz(form, costMap);
  }, [form, costMap]);

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

            <FieldGroup title="Instalación y traslado">
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
                options={ALTURA_CONDICIONES}
                onChange={(value) => updateField("alturaCondicion", value)}
              />

              <TextField
                label="Traslado"
                value={form.traslado}
                onChange={(value) => updateField("traslado", value)}
              />

              <TextField
                label="Diseño gráfico"
                value={form.disenoGrafico}
                onChange={(value) => updateField("disenoGrafico", value)}
              />
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
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
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
          <option key={option}>{option}</option>
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
}"use client";

import {
  Fragment,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import type { CostRow, FormState } from "./_lib/types";
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
  saveAction,
  userRole,
}: {
  costRows: CostRow[];
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

  const costMap = useMemo(() => {
    const map = new Map<string, number>();

    costRows.forEach((item) => {
      map.set(item.sku, Number(item.cost || 0));
    });

    return map;
  }, [costRows]);

  const result = useMemo(() => {
    return calculateCajaLuz(form, costMap);
  }, [form, costMap]);

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

            <FieldGroup title="Instalación y traslado">
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
                options={ALTURA_CONDICIONES}
                onChange={(value) => updateField("alturaCondicion", value)}
              />

              <TextField
                label="Traslado"
                value={form.traslado}
                onChange={(value) => updateField("traslado", value)}
              />

              <TextField
                label="Diseño gráfico"
                value={form.disenoGrafico}
                onChange={(value) => updateField("disenoGrafico", value)}
              />
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
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
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
          <option key={option}>{option}</option>
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