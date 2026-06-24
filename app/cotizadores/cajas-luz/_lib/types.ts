export type CostRow = {
  sku: string;
  name: string;
  unit: string;
  cost: number;
  sale_price: number | null;
};

export type TipoCaja =
  | "Una vista"
  | "Doble vista"
  | "Bandera"
  | "Paleta"
  | "Suajada";

export type Caratula =
  | "Lona backlight impresa"
  | "Lona backlight rotulada"
  | "Acrílico rotulado"
  | "Acrílico impreso"
  | "Policarbonato"
  | "Otro";

export type Iluminacion =
  | "Lámparas LED"
  | "Módulos LED normales"
  | "Módulos LED ultra brillantes"
  | "Micro LEDs"
  | "Sin iluminación";

export type SiNo = "SI" | "NO";

export type FormState = {
  cliente: string;
  vendedor: string;
  proyecto: string;

  tipoCaja: TipoCaja;
  cantidad: string;
  anchoM: string;
  altoM: string;

  usarCantoAutomatico: boolean;
  cantoCmManual: string;

  vistas: string;
  caratula: Caratula;
  iluminacion: Iluminacion;

  incluyeInstalacion: SiNo;
  alturaCondicion: string;
  traslado: string;
  disenoGrafico: string;

  personasFabricacion: string;
  personasInstalacion: string;

  usarTiemposAutomaticos: boolean;
  horasFabricacionManual: string;
  horasInstalacionManual: string;

  materialExtra: string;
  andamios: string;
  numeroDescolgadas: string;

  separacionLamparasM: string;
  wattsPorLampara: string;

  tirasPorM2Normal: string;
  tirasPorM2Ultra: string;
  tirasPorM2Micro: string;

  costoCaratulaM2: string;

  instalacion: string;
  extras: string;

  margen: string;
  ivaPorcentaje: string;

  observaciones: string;
};

export type FuenteResult = {
  label: string;
  qty30: number;
  qty60: number;
  qty100: number;
};

export type MaterialLine = {
  grupo: string;
  concepto: string;
  sku?: string;
  cantidad: number;
  unidad: string;
  costoUnitario: number;
  total: number;
};

export type ValidationResult = {
  material: string;
  servicios: string;
  impresion: string;
  precio: string;
};

export type QuoteResult = {
  medidas: {
    anchoM: number;
    altoM: number;
    cantidad: number;
    vistas: number;
    areaBaseM2: number;
    areaFrenteM2: number;
    areaRespaldoM2: number;
    perimetroMl: number;
    cantoCm: number;
    desarrolloLaminaCm: number;
  };

  lamina: {
    areaCantoM2: number;
    areaTotalM2: number;
  };

  estructura: {
    tubularLabel: string;
    tubularSku: string;
    tubularMl: number;
    tramosTubular: number;
    refuerzosMl: number;
    inserciones: number;
    varillasSoldadura: number;
  };

  iluminacion: {
    label: string;
    cantidad: number;
    unidad: string;
    modulosTotales: number;
    wattsPorModulo: number;
    consumoW: number;
    usaFuente: boolean;
    fuente: FuenteResult;
  };

  tiempos: {
    fabricacionHoras: number;
    instalacionHoras: number;
    horasHombreFabricacion: number;
    horasHombreInstalacion: number;
  };

  costos: {
    costoDirecto: number;
    precioSinIva: number;
    iva: number;
    totalConIva: number;
    utilidad: number;
    margenPorcentaje: number;
  };

  validations: ValidationResult;
  partidas: MaterialLine[];
  textoCotizacion: string;
};