import type { Caratula, FormState, Iluminacion, TipoCaja } from "./types";

export const MODULOS_POR_TIRA = 20;

export const WATTS_MODULO_NORMAL = 0.72;
export const WATTS_MODULO_ULTRA = 1.5;
export const WATTS_MODULO_MICRO = 0.2;

export const TIPO_CAJA_OPTIONS: TipoCaja[] = [
  "Recta",
  "Suajada",
  "Doble vista",
  "Bandera",
  "Paleta",
];

export const CARATULA_OPTIONS: Caratula[] = [
  "Lona backlight impresa",
  "Lona backlight rotulada",
  "Acrílico rotulado con vinil de corte",
  "Acrílico rotulado con impresión de vinil",
  "Policarbonato",
  "Otro",
];

export const ILUMINACION_OPTIONS: Iluminacion[] = [
  "Lámparas LED",
  "Módulos LED normales",
  "Módulos LED ultra brillantes",
  "Micro LEDs",
  "Sin iluminación",
];

export const DEFAULT_FORM: FormState = {
  clientId: "",
  cliente: "Cliente nuevo",
  clienteTelefono: "",
  clienteEmail: "",
  clienteRfc: "",
  clienteDireccion: "",

  vendedor: "",
  proyecto: "Caja de luz",

  tipoCaja: "Recta",
  cantidad: "1",
  anchoM: "1",
  altoM: "1",

  usarCantoAutomatico: true,
  cantoCmManual: "22",
  vistas: "1",

  caratula: "Lona backlight impresa",
  iluminacion: "Lámparas LED",

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

export function getCantoRule({
  tipoCaja,
  iluminacion,
}: {
  tipoCaja: TipoCaja;
  iluminacion: Iluminacion;
}) {
  if (iluminacion === "Sin iluminación") {
    return {
      cantoCm: 12,
      desarrolloLaminaCm: 20,
    };
  }

  if (tipoCaja === "Suajada") {
    return {
      cantoCm: 22,
      desarrolloLaminaCm: 30,
    };
  }

  if (tipoCaja === "Bandera" || tipoCaja === "Paleta") {
    return {
      cantoCm: 25,
      desarrolloLaminaCm: 35,
    };
  }

  return {
    cantoCm: 22,
    desarrolloLaminaCm: 30,
  };
}

export function getTubularRule({
  tipoCaja,
  areaBaseM2,
}: {
  tipoCaja: TipoCaja;
  areaBaseM2: number;
}) {
  if (tipoCaja === "Bandera" || tipoCaja === "Paleta" || areaBaseM2 > 6) {
    return {
      sku: "TUBULAR_ZINTRO_1_1_2",
      label: 'Tubular zintro 1 1/2" x 1 1/2" tramo 6 m',
      varillaSoldaduraPorInsercion: 0.08,
    };
  }

  if (areaBaseM2 > 3) {
    return {
      sku: "TUBULAR_ZINTRO_1",
      label: 'Tubular zintro 1" x 1" tramo 6 m',
      varillaSoldaduraPorInsercion: 0.06,
    };
  }

  return {
    sku: "TUBULAR_ZINTRO_3_4",
    label: 'Tubular zintro 3/4" x 3/4" tramo 6 m',
    varillaSoldaduraPorInsercion: 0.05,
  };
}

export function getLampRule(altoM: number) {
  if (altoM <= 1) {
    return {
      sku: "LAMPARA_LED_9W_60CM",
      label: "Lámpara LED 9 W 0.60 m",
      largoM: 0.6,
    };
  }

  return {
    sku: "LAMPARA_LED_18W_120CM",
    label: "Lámpara LED 18 W 1.20 m",
    largoM: 1.2,
  };
}

export function getAlturaInstalacionRule(alturaCondicion: string) {
  const value = String(alturaCondicion ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (value.includes("descolgada")) {
    return {
      label: alturaCondicion || "Descolgada",
      porcentajeExtra: 80,
    };
  }

  if (value.includes("azotea")) {
    return {
      label: alturaCondicion || "Azotea",
      porcentajeExtra: 50,
    };
  }

  if (value.includes("techo")) {
    return {
      label: alturaCondicion || "Techo",
      porcentajeExtra: 40,
    };
  }

  if (value.includes("alta")) {
    return {
      label: alturaCondicion || "Altura alta",
      porcentajeExtra: 35,
    };
  }

  return {
    label: alturaCondicion || "Pared / fachada baja",
    porcentajeExtra: 0,
  };
}