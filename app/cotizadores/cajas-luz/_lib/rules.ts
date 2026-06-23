import type {
  Caratula,
  FormState,
  Iluminacion,
  TipoCaja,
} from "./types";

export const MODULOS_POR_TIRA = 20;

export const WATTS_MODULO_NORMAL = 0.72;
export const WATTS_MODULO_ULTRA = 1.5;
export const WATTS_MODULO_MICRO = 0.2;

export const TIPOS_CAJA: TipoCaja[] = [
  "Una vista",
  "Doble vista",
  "Bandera",
  "Paleta",
  "Suajada",
];

export const CARATULAS: Caratula[] = [
  "Lona backlight impresa",
  "Lona backlight rotulada",
  "Acrílico rotulado",
  "Acrílico impreso",
  "Policarbonato",
  "Otro",
];

export const ILUMINACIONES: Iluminacion[] = [
  "Lámparas LED",
  "Módulos LED normales",
  "Módulos LED ultra brillantes",
  "Micro LEDs",
  "Sin iluminación",
];

export const ALTURA_CONDICIONES = [
  "A nivel de piso",
  "Pared / fachada",
  "Muro",
  "Azotea",
  "Altura con escalera",
  "Altura con andamio",
  "Sin condición especial",
] as const;

export const DEFAULT_FORM: FormState = {
  cliente: "Cliente nuevo",
  vendedor: "",
  proyecto: "Caja de luz",

  tipoCaja: "Una vista",
  cantidad: "1",
  anchoM: "3",
  altoM: "1",

  usarCantoAutomatico: true,
  cantoCmManual: "20",

  vistas: "1",
  caratula: "Lona backlight impresa",
  iluminacion: "Lámparas LED",

  incluyeInstalacion: "SI",
  alturaCondicion: "A nivel de piso",
  traslado: "Zona A",
  disenoGrafico: "15 min. de diseño gráfico",

  personasFabricacion: "1",
  personasInstalacion: "2",

  materialExtra: "0",
  andamios: "0",
  numeroDescolgadas: "0",

  separacionLamparasM: "0.30",
  wattsPorLampara: "18",

  tirasPorM2Normal: "12",
  tirasPorM2Ultra: "12",
  tirasPorM2Micro: "20",

  costoCaratulaM2: "0",
  manoObraM2: "0",

  instalacion: "0",
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
  if (
    tipoCaja === "Doble vista" ||
    tipoCaja === "Bandera" ||
    tipoCaja === "Paleta"
  ) {
    return {
      cantoCm: 40,
      desarrolloLaminaCm: 48,
      label: "Doble vista / bandera / paleta",
    };
  }

  if (iluminacion === "Lámparas LED") {
    return {
      cantoCm: 22,
      desarrolloLaminaCm: 30,
      label: "Caja con lámparas LED",
    };
  }

  if (
    iluminacion === "Módulos LED normales" ||
    iluminacion === "Módulos LED ultra brillantes" ||
    iluminacion === "Micro LEDs"
  ) {
    return {
      cantoCm: 10,
      desarrolloLaminaCm: 18,
      label: "Caja con módulos LED",
    };
  }

  return {
    cantoCm: 10,
    desarrolloLaminaCm: 18,
    label: "Caja sin iluminación",
  };
}

export function getTubularRule({
  tipoCaja,
  areaBaseM2,
}: {
  tipoCaja: TipoCaja;
  areaBaseM2: number;
}) {
  if (
    tipoCaja === "Bandera" ||
    tipoCaja === "Paleta" ||
    tipoCaja === "Doble vista" ||
    areaBaseM2 > 6
  ) {
    return {
      sku: "TUBULAR_1X1",
      label: "Tubular 1 x 1",
      varillaSoldaduraPorInsercion: 0.5,
    };
  }

  if (tipoCaja === "Suajada" || areaBaseM2 < 1) {
    return {
      sku: "TUBULAR_1_2",
      label: "Tubular 1/2 x 1/2",
      varillaSoldaduraPorInsercion: 1 / 3,
    };
  }

  return {
    sku: "TUBULAR_3_4",
    label: "Tubular 3/4 x 3/4",
    varillaSoldaduraPorInsercion: 1 / 3,
  };
}

export function getLampRule(altoM: number) {
  if (altoM < 1.2) {
    return {
      sku: "LAMPARA_LED_60CM",
      label: "Lámpara LED 60 cm",
      largoM: 0.6,
    };
  }

  return {
    sku: "LAMPARA_LED_120CM",
    label: "Lámpara LED 120 cm",
    largoM: 1.2,
  };
}