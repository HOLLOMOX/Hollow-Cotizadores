import type {
  DesignOption,
  FormState,
  FuenteResult,
  InstallationCondition,
  MaterialLine,
  QuoteResult,
  TransportZone,
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

function normalizeCondition(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getInstallationRuleFromCatalog({
  alturaCondicion,
  installationConditions,
}: {
  alturaCondicion: string;
  installationConditions: InstallationCondition[];
}) {
  const normalizedSelected = normalizeCondition(alturaCondicion);

  const matched = installationConditions.find((condition) => {
    const normalizedLabel = normalizeCondition(condition.label);
    const normalizedCode = normalizeCondition(condition.code);

    return (
      normalizedLabel === normalizedSelected ||
      normalizedCode === normalizedSelected
    );
  });

  if (matched) {
    return {
      porcentajeExtra: Number(matched.percent_extra ?? 0),
      label: matched.label,
    };
  }

  return getAlturaInstalacionRule(alturaCondicion);
}

function getTransportZoneFromCatalog({
  traslado,
  transportZones,
}: {
  traslado: string;
  transportZones: TransportZone[];
}) {
  const normalizedSelected = normalizeCondition(traslado);

  const matched = transportZones.find((zone) => {
    const normalizedCode = normalizeCondition(zone.code);
    const normalizedLabel = normalizeCondition(zone.label);
    const normalizedDisplayName = normalizeCondition(zone.display_name ?? "");

    return (
      normalizedCode === normalizedSelected ||
      normalizedLabel === normalizedSelected ||
      normalizedDisplayName === normalizedSelected
    );
  });

  return matched ?? null;
}

function getDesignOptionFromCatalog({
  disenoGrafico,
  designOptions,
}: {
  disenoGrafico: string;
  designOptions: DesignOption[];
}) {
  const normalizedSelected = normalizeCondition(disenoGrafico);

  const matched = designOptions.find((design) => {
    const normalizedCode = normalizeCondition(design.code);
    const normalizedLabel = normalizeCondition(design.label);

    return (
      normalizedCode === normalizedSelected ||
      normalizedLabel === normalizedSelected
    );
  });

  return matched ?? null;
}

function getCajaClienteText({
  tipoCaja,
  vistas,
}: {
  tipoCaja: string;
  vistas: number;
}) {
  const vistaTexto = vistas >= 2 ? "doble vista" : "una vista";

  if (tipoCaja === "Suajada") {
    return `caja de luz suajada ${vistaTexto}`;
  }

  if (tipoCaja === "Doble vista") {
    return "caja de luz doble vista";
  }

  if (tipoCaja === "Bandera") {
    return `caja de luz tipo bandera ${vistaTexto}`;
  }

  if (tipoCaja === "Paleta") {
    return `caja de luz tipo paleta ${vistaTexto}`;
  }

  return `caja de luz ${vistaTexto}`;
}

function getIluminacionClienteText(iluminacion: string) {
  if (iluminacion === "Lámparas LED") {
    return "lámparas LED";
  }

  if (iluminacion === "Módulos LED normales") {
    return "LEDs luminosidad normal";
  }

  if (iluminacion === "Módulos LED ultra brillantes") {
    return "LEDs ultrabrillantes";
  }

  if (iluminacion === "Micro LEDs") {
    return "micro LEDs";
  }

  return "sin iluminación";
}

function getMedidasClienteText(anchoM: number, altoM: number) {
  const anchoCm = Math.round(anchoM * 100);
  const altoCm = Math.round(altoM * 100);

  const ambasMedidasMenoresAUnMetro = anchoM < 1 && altoM < 1;

  if (ambasMedidasMenoresAUnMetro) {
    return `${anchoCm} X ${altoCm} CM`;
  }

  return `${anchoM.toFixed(2)} X ${altoM.toFixed(2)} M`;
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
  const esTecho = condicion.includes("techo");

  const esPared =
    condicion.includes("pared") ||
    condicion.includes("muro") ||
    condicion.includes("fachada");

  const esEspecial =
    form.tipoCaja === "Bandera" ||
    form.tipoCaja === "Paleta" ||
    form.tipoCaja === "Doble vista";

  if (esAzotea || esTecho || esPared || esEspecial) {
    const anguloSku =
      esAzotea || esTecho ? "ANGULO_ACERO_1" : "ANGULO_ACERO_1_1_2";

    const anguloLabel =
      esAzotea || esTecho
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
  costMap: Map<string, number>,
  installationConditions: InstallationCondition[] = [],
  transportZones: TransportZone[] = [],
  designOptions: DesignOption[] = []
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

  const alturaInstalacionRule = getInstallationRuleFromCatalog({
    alturaCondicion: form.alturaCondicion,
    installationConditions,
  });

  const selectedTransportZone = getTransportZoneFromCatalog({
    traslado: form.traslado,
    transportZones,
  });

  const trasladoTipo = form.trasladoTipo ?? "TRABAJO";

  const trasladoCosto =
    trasladoTipo === "ENTREGA"
      ? selectedTransportZone?.delivery_cost ?? 0
      : selectedTransportZone?.work_cost ?? 0;

  const trasladoLabel =
    selectedTransportZone?.display_name ||
    selectedTransportZone?.label ||
    form.traslado;

  const selectedDesignOption = getDesignOptionFromCatalog({
    disenoGrafico: form.disenoGrafico,
    designOptions,
  });

  const designLabel =
    selectedDesignOption?.label ||
    (form.disenoGrafico === "NO_DISENO"
      ? "NO LLEVA DISEÑO"
      : form.disenoGrafico);

  const designPrice = selectedDesignOption?.price ?? 0;

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

    const porcentajeExtraInstalacion = Number(
      alturaInstalacionRule.porcentajeExtra ?? 0
    );

    const costoExtraPorCondicion =
      costoBaseInstalacion * (porcentajeExtraInstalacion / 100);

    addLine({
      lines,
      grupo: "Mano de obra",
      concepto: "Mano de obra instalación base",
      sku: "MO_INSTALACION_HORA",
      cantidad: horasHombreInstalacion,
      unidad: "HORA-HOMBRE",
      costoUnitario: costoHoraInstalacion,
    });

    if (porcentajeExtraInstalacion > 0) {
      addLine({
        lines,
        grupo: "Mano de obra",
        concepto: `Incremento mano de obra instalación por ${alturaInstalacionRule.label} (${porcentajeExtraInstalacion}%)`,
        sku: "AJUSTE_MO_INSTALACION_ALTURA",
        cantidad: 1,
        unidad: "AJUSTE",
        costoUnitario: costoExtraPorCondicion,
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

  addLine({
    lines,
    grupo: "Traslado",
    concepto: `Traslado ${trasladoTipo.toLowerCase()} — ${trasladoLabel}`,
    sku: selectedTransportZone?.code
      ? `TRASLADO_${selectedTransportZone.code}`
      : "TRASLADO_MANUAL",
    cantidad: 1,
    unidad: "SERVICIO",
    costoUnitario: trasladoCosto,
  });

  if (designPrice > 0) {
    addLine({
      lines,
      grupo: "Diseño gráfico",
      concepto: designLabel,
      sku: selectedDesignOption?.code ?? "DISENO_MANUAL",
      cantidad: 1,
      unidad: "SERVICIO",
      costoUnitario: designPrice,
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

  const tipoCajaCliente = getCajaClienteText({
    tipoCaja: form.tipoCaja,
    vistas,
  });

  const medidasCliente = getMedidasClienteText(anchoM, altoM);
  const iluminacionCliente = getIluminacionClienteText(form.iluminacion);

  const cantidadCliente = cantidad > 1 ? `${cantidad} piezas de ` : "";

  const instalacionCliente =
    form.incluyeInstalacion === "SI"
      ? `Incluye instalación: ${alturaInstalacionRule.label}.`
      : "No incluye instalación.";

  const trasladoCliente = `Traslado: ${trasladoLabel} (${trasladoTipo.toLowerCase()}).`;

  const disenoCliente =
    designPrice > 0
      ? `Diseño gráfico: ${designLabel}.`
      : "No lleva diseño gráfico.";

  const observacionesCliente = form.observaciones
    ? `Observaciones: ${form.observaciones}.`
    : "";

  const textoCotizacion = cleanText(
    [
      `Fabricación de ${cantidadCliente}${tipoCajaCliente} con ${form.caratula}, medidas: ${medidasCliente}, fondo ${cantoCm.toFixed(
        0
      )} cm - iluminación: ${iluminacionCliente}.`,
      instalacionCliente,
      trasladoCliente,
      disenoCliente,
      observacionesCliente,
    ]
      .filter(Boolean)
      .join(" ")
  ).toUpperCase();

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
}