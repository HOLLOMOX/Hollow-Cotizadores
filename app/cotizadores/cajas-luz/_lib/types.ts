export type TipoCaja =
  | "Recta"
  | "Suajada"
  | "Doble vista"
  | "Bandera"
  | "Paleta"
  | string;

export type Caratula =
  | "Lona backlight impresa"
  | "Lona backlight rotulada"
  | "Acrílico rotulado con vinil de corte"
  | "Acrílico rotulado con impresión de vinil"
  | "Policarbonato"
  | "Otro"
  | string;

export type Iluminacion =
  | "Lámparas LED"
  | "Módulos LED normales"
  | "Módulos LED ultra brillantes"
  | "Micro LEDs"
  | "Sin iluminación"
  | string;

export type CostItem = {
  id?: string;
  sku: string;
  name: string;
  category?: string | null;
  unit?: string | null;
  cost: number;
  active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

export type CostRow = CostItem;

export type MaterialLine = {
  grupo: string;
  concepto: string;
  sku?: string;
  cantidad: number;
  unidad: string;
  costoUnitario: number;
  total: number;
};

export type FuenteResult = {
  label: string;
  qty30: number;
  qty60: number;
  qty100: number;
};

export type InstallationCondition = {
  id?: string;
  code: string;
  label: string;
  percent_extra: number;
  active?: boolean | null;
  sort_order?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type TransportZone = {
  id?: string;
  code: string;
  label: string;
  display_name?: string | null;

  coverage_text?: string | null;

  work_cost: number;
  delivery_cost: number;

  work_discount_percent?: number | null;
  delivery_discount_percent?: number | null;

  active?: boolean | null;
  sort_order?: number | null;

  created_at?: string | null;
  updated_at?: string | null;
};

export type DesignOption = {
  id?: string;
  code: string;
  label: string;
  minutes?: number | null;
  price: number;
  active?: boolean | null;
  sort_order?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CotizadorClientOption = {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  rfc: string | null;
  address: string | null;
  notes: string | null;
};

export type FormState = {
  clientId: string;
  cliente: string;
  clienteTelefono: string;
  clienteEmail: string;
  clienteRfc: string;
  clienteDireccion: string;

  proyecto: string;
  vendedor: string;

  tipoCaja: TipoCaja;
  caratula: Caratula;
  iluminacion: Iluminacion;

  anchoM: string;
  altoM: string;
  cantidad: string;
  vistas: string;

  usarCantoAutomatico: boolean;
  cantoCmManual: string;

  usarTiemposAutomaticos: boolean;
  personasFabricacion: string;
  personasInstalacion: string;
  horasFabricacionManual: string;
  horasInstalacionManual: string;

  incluyeInstalacion: string;
  alturaCondicion: string;
  andamios: string;
  numeroDescolgadas: string;
  instalacion: string;

  traslado: string;
  trasladoTipo: string;

  disenoGrafico: string;

  separacionLamparasM: string;
  wattsPorLampara: string;
  tirasPorM2Normal: string;
  tirasPorM2Ultra: string;
  tirasPorM2Micro: string;

  costoCaratulaM2: string;
  materialExtra: string;
  extras: string;

  margen: string;
  ivaPorcentaje: string;

  observaciones: string;
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

  validations: {
    material: string;
    servicios: string;
    impresion: string;
    precio: string;
  };

  partidas: MaterialLine[];
  textoCotizacion: string;
};

export type SaveQuotePayload = {
  clientId?: string | null;
  cliente: string;
  proyecto: string;
  vendedor?: string;
  form: FormState;
  result: QuoteResult;
  textoCotizacion?: string;
};