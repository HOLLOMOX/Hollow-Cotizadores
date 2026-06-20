"use client";

import { useMemo, useState } from "react";

type CostRow = {
  sku: string;
  name: string;
  unit: string;
  cost: number;
  sale_price: number | null;
};

type FuenteResult = {
  label: string;
  qty30: number;
  qty60: number;
  qty100: number;
};

const MODULOS_POR_TIRA = 20;

const WATTS_MODULO_NORMAL = 0.72;
const WATTS_MODULO_ULTRA = 1.5;
const WATTS_MODULO_MICRO = 0.2;

function n(value: string) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function money(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number.isFinite(value) ? value : 0);
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

export default function CajasLuzForm({ costRows }: { costRows: CostRow[] }) {
  const costMap = useMemo(() => {
    const map = new Map<string, number>();

    costRows.forEach((item) => {
      map.set(item.sku, Number(item.cost || 0));
    });

    return map;
  }, [costRows]);

  const [cliente, setCliente] = useState("");
  const [proyecto, setProyecto] = useState("Caja de luz");

  // Medidas en metros
  const [ancho, setAncho] = useState("1");
  const [alto, setAlto] = useState("1");
  const [canto, setCanto] = useState("0.12");
  const [cantidad, setCantidad] = useState("1");

  const [tipoCaja, setTipoCaja] = useState("Una vista");
  const [frente, setFrente] = useState("Lona backlight");

  const [iluminacion, setIluminacion] = useState("Lámparas LED");

  const [costoFrenteM2, setCostoFrenteM2] = useState("0");
  const [costoEstructuraMl, setCostoEstructuraMl] = useState("0");
  const [costoLateralesM2, setCostoLateralesM2] = useState("0");
  const [manoObraM2, setManoObraM2] = useState("0");

  // Reglas editables para iluminación
  const [separacionLamparasM, setSeparacionLamparasM] = useState("0.30");
  const [wattsPorLampara, setWattsPorLampara] = useState("18");

  const [tirasPorM2Normal, setTirasPorM2Normal] = useState("12");
  const [tirasPorM2Ultra, setTirasPorM2Ultra] = useState("12");
  const [tirasPorM2Micro, setTirasPorM2Micro] = useState("20");

  const [instalacion, setInstalacion] = useState("0");
  const [extras, setExtras] = useState("0");
  const [margen, setMargen] = useState("40");

  const lampara60Costo = costMap.get("LAMPARA_LED_60CM") ?? 0;
  const lampara120Costo = costMap.get("LAMPARA_LED_120CM") ?? 0;

  const tiraNormalCosto = costMap.get("TIRA_LED_NORMAL") ?? 0;
  const tiraUltraCosto = costMap.get("TIRA_LED_ULTRA") ?? 0;
  const tiraMicroCosto = costMap.get("TIRA_MICRO_LED") ?? 0;

  const fuente30 = costMap.get("FUENTE_30W") ?? 0;
  const fuente60 = costMap.get("FUENTE_60W") ?? 0;
  const fuente100 = costMap.get("FUENTE_100W") ?? 0;

  const calc = useMemo(() => {
    const anchoM = n(ancho);
    const altoM = n(alto);
    const cantoM = n(canto);
    const qty = Math.max(n(cantidad), 1);

    const vistas = tipoCaja === "Doble vista" ? 2 : 1;

    const areaFrente = anchoM * altoM * qty * vistas;
    const perimetro = 2 * (anchoM + altoM) * qty;
    const areaLaterales = perimetro * cantoM;

    const costoFrente = areaFrente * n(costoFrenteM2);
    const costoEstructura = perimetro * n(costoEstructuraMl);
    const costoLaterales = areaLaterales * n(costoLateralesM2);
    const costoManoObra = areaFrente * n(manoObraM2);

    let iluminacionLabel = "Sin iluminación";
    let iluminacionCantidad = 0;
    let iluminacionUnidad = "PIEZA";
    let modulosTotales = 0;
    let wattsPorModulo = 0;
    let consumo = 0;
    let costoIluminacion = 0;

    if (iluminacion === "Lámparas LED") {
      const usaLampara120 = anchoM > 1.2;
      const largoLamparaM = usaLampara120 ? 1.2 : 0.6;
      const costoLampara = usaLampara120 ? lampara120Costo : lampara60Costo;
      const nombreLampara = usaLampara120
        ? "Lámpara LED 120 cm"
        : "Lámpara LED 60 cm";

      const lamparasPorLinea = Math.max(Math.ceil(anchoM / largoLamparaM), 1);
      const lineas = Math.max(
        Math.ceil(altoM / Math.max(n(separacionLamparasM), 0.01)),
        1
      );

      iluminacionCantidad = lamparasPorLinea * lineas * qty * vistas;
      iluminacionUnidad = "PIEZA";
      iluminacionLabel = nombreLampara;
      consumo = iluminacionCantidad * n(wattsPorLampara);
      costoIluminacion = iluminacionCantidad * costoLampara;
    }

    if (iluminacion === "Módulos LED normales") {
      iluminacionCantidad = Math.ceil(areaFrente * n(tirasPorM2Normal));
      iluminacionUnidad = "TIRA C/20";
      iluminacionLabel = "Tiras de módulos LED normales";
      wattsPorModulo = WATTS_MODULO_NORMAL;
      modulosTotales = iluminacionCantidad * MODULOS_POR_TIRA;
      consumo = modulosTotales * wattsPorModulo;
      costoIluminacion = iluminacionCantidad * tiraNormalCosto;
    }

    if (iluminacion === "Módulos LED ultra brillantes") {
      iluminacionCantidad = Math.ceil(areaFrente * n(tirasPorM2Ultra));
      iluminacionUnidad = "TIRA C/20";
      iluminacionLabel = "Tiras de módulos LED ultra brillantes";
      wattsPorModulo = WATTS_MODULO_ULTRA;
      modulosTotales = iluminacionCantidad * MODULOS_POR_TIRA;
      consumo = modulosTotales * wattsPorModulo;
      costoIluminacion = iluminacionCantidad * tiraUltraCosto;
    }

    if (iluminacion === "Micro LEDs") {
      iluminacionCantidad = Math.ceil(areaFrente * n(tirasPorM2Micro));
      iluminacionUnidad = "TIRA C/20";
      iluminacionLabel = "Tiras de micro LED";
      wattsPorModulo = WATTS_MODULO_MICRO;
      modulosTotales = iluminacionCantidad * MODULOS_POR_TIRA;
      consumo = modulosTotales * wattsPorModulo;
      costoIluminacion = iluminacionCantidad * tiraMicroCosto;
    }

    const fuente = fuentePorConsumo(consumo);

    const costoFuente =
      fuente.qty30 * fuente30 +
      fuente.qty60 * fuente60 +
      fuente.qty100 * fuente100;

    const costoInstalacion = n(instalacion);
    const costoExtras = n(extras);

    const costoTotal =
      costoFrente +
      costoEstructura +
      costoLaterales +
      costoIluminacion +
      costoFuente +
      costoManoObra +
      costoInstalacion +
      costoExtras;

    const margenNum = n(margen);

    const precioVenta =
      margenNum >= 100 ? costoTotal : costoTotal / (1 - margenNum / 100);

    const utilidad = precioVenta - costoTotal;

    return {
      vistas,
      areaFrente,
      perimetro,
      areaLaterales,
      iluminacionLabel,
      iluminacionCantidad,
      iluminacionUnidad,
      modulosTotales,
      wattsPorModulo,
      consumo,
      fuente,
      costoFrente,
      costoEstructura,
      costoLaterales,
      costoIluminacion,
      costoFuente,
      costoManoObra,
      costoInstalacion,
      costoExtras,
      costoTotal,
      precioVenta,
      utilidad,
      margenNum,
    };
  }, [
    ancho,
    alto,
    canto,
    cantidad,
    tipoCaja,
    iluminacion,
    costoFrenteM2,
    costoEstructuraMl,
    costoLateralesM2,
    manoObraM2,
    separacionLamparasM,
    wattsPorLampara,
    tirasPorM2Normal,
    tirasPorM2Ultra,
    tirasPorM2Micro,
    instalacion,
    extras,
    margen,
    lampara60Costo,
    lampara120Costo,
    tiraNormalCosto,
    tiraUltraCosto,
    tiraMicroCosto,
    fuente30,
    fuente60,
    fuente100,
  ]);

  const partidas = [
    ["Frente " + frente, calc.areaFrente, "m²", calc.costoFrente],
    ["Estructura / perímetro", calc.perimetro, "ml", calc.costoEstructura],
    ["Laterales / canto", calc.areaLaterales, "cm", calc.costoLaterales],
    [
      calc.iluminacionLabel,
      calc.iluminacionCantidad,
      calc.iluminacionUnidad,
      calc.costoIluminacion,
    ],
    [
      calc.fuente.label,
      calc.fuente.qty30 + calc.fuente.qty60 + calc.fuente.qty100,
      "PIEZA",
      calc.costoFuente,
    ],
    ["Mano de obra", calc.areaFrente, "m²", calc.costoManoObra],
    ["Instalación", 1, "SERVICIO", calc.costoInstalacion],
    ["Extras", 1, "LOTE", calc.costoExtras],
  ] as const;

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-12">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 lg:col-span-5">
        <h2 className="text-xl font-medium">Datos</h2>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Input label="Cliente" value={cliente} setValue={setCliente} />
          <Input label="Proyecto" value={proyecto} setValue={setProyecto} />

          <Input
            label="Ancho m"
            value={ancho}
            setValue={setAncho}
            type="number"
          />

          <Input
            label="Alto m"
            value={alto}
            setValue={setAlto}
            type="number"
          />

          <Input
            label="canto cm"
            value={canto}
            setValue={setCanto}
            type="number"
          />

          <Input
            label="Cantidad"
            value={cantidad}
            setValue={setCantidad}
            type="number"
          />

          <Select
            label="Tipo de caja"
            value={tipoCaja}
            setValue={setTipoCaja}
            options={["Una vista", "Doble vista"]}
          />

          <Select
            label="Frente"
            value={frente}
            setValue={setFrente}
            options={[
              "Lona backlight",
              "Acrílico blanco lechoso",
              "Policarbonato",
              "Otro",
            ]}
          />

          <Select
            label="Iluminación"
            value={iluminacion}
            setValue={setIluminacion}
            options={[
              "Lámparas LED",
              "Módulos LED normales",
              "Módulos LED ultra brillantes",
              "Micro LEDs",
              "Sin iluminación",
            ]}
          />

          {iluminacion === "Lámparas LED" && (
            <>
              <Input
                label="Separación lámparas m"
                value={separacionLamparasM}
                setValue={setSeparacionLamparasM}
                type="number"
              />

              <Input
                label="Watts por lámpara"
                value={wattsPorLampara}
                setValue={setWattsPorLampara}
                type="number"
              />
            </>
          )}

          {iluminacion === "Módulos LED normales" && (
            <Input
              label="Tiras normales por m²"
              value={tirasPorM2Normal}
              setValue={setTirasPorM2Normal}
              type="number"
            />
          )}

          {iluminacion === "Módulos LED ultra brillantes" && (
            <Input
              label="Tiras ultra por m²"
              value={tirasPorM2Ultra}
              setValue={setTirasPorM2Ultra}
              type="number"
            />
          )}

          {iluminacion === "Micro LEDs" && (
            <Input
              label="Tiras micro por m²"
              value={tirasPorM2Micro}
              setValue={setTirasPorM2Micro}
              type="number"
            />
          )}

          <Input
            label="Frente costo m²"
            value={costoFrenteM2}
            setValue={setCostoFrenteM2}
            type="number"
          />

          <Input
            label="Estructura costo ml"
            value={costoEstructuraMl}
            setValue={setCostoEstructuraMl}
            type="number"
          />

          <Input
            label="Laterales costo m²"
            value={costoLateralesM2}
            setValue={setCostoLateralesM2}
            type="number"
          />

          <Input
            label="Mano de obra m²"
            value={manoObraM2}
            setValue={setManoObraM2}
            type="number"
          />

          <Input
            label="Instalación"
            value={instalacion}
            setValue={setInstalacion}
            type="number"
          />

          <Input
            label="Extras"
            value={extras}
            setValue={setExtras}
            type="number"
          />

          <Input
            label="Margen %"
            value={margen}
            setValue={setMargen}
            type="number"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 lg:col-span-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-medium">Resultado</h2>
            <p className="mt-1 text-sm text-neutral-400">
              {cliente || "Sin cliente"} · {proyecto}
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-right">
            <p className="text-sm text-neutral-500">Precio sugerido</p>
            <p className="mt-1 text-3xl font-semibold">
              {money(calc.precioVenta)}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Card
            title="Área frente"
            value={`${calc.areaFrente.toFixed(2)} m²`}
          />
          <Card title="Perímetro" value={`${calc.perimetro.toFixed(2)} ml`} />
          <Card
            title="Área laterales"
            value={`${calc.areaLaterales.toFixed(2)} m²`}
          />
          <Card title="Fuente" value={calc.fuente.label} />
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Card title="Iluminación" value={calc.iluminacionLabel} />
          <Card
            title="Cantidad luz"
            value={`${calc.iluminacionCantidad} ${calc.iluminacionUnidad}`}
          />
          <Card title="Módulos" value={`${calc.modulosTotales} módulos`} />
          <Card title="Consumo" value={`${calc.consumo.toFixed(1)} W`} />
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Card
            title="Watts módulo"
            value={
              calc.wattsPorModulo > 0
                ? `${calc.wattsPorModulo} W`
                : "No aplica"
            }
          />
          <Card title="Vistas" value={`${calc.vistas}`} />
          <Card title="Tipo" value={tipoCaja} />
          <Card title="Margen" value={`${calc.margenNum.toFixed(2)}%`} />
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-800">
          <div className="grid grid-cols-12 bg-neutral-950 px-4 py-3 text-xs uppercase tracking-wider text-neutral-500">
            <div className="col-span-6">Concepto</div>
            <div className="col-span-2 text-right">Cantidad</div>
            <div className="col-span-2">Unidad</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          <div className="divide-y divide-neutral-800">
            {partidas.map(([concepto, cantidadPartida, unidad, total]) => (
              <div
                key={concepto}
                className="grid grid-cols-12 px-4 py-3 text-sm"
              >
                <div className="col-span-6">{concepto}</div>

                <div className="col-span-2 text-right">
                  {Number(cantidadPartida).toFixed(2)}
                </div>

                <div className="col-span-2 text-neutral-400">{unidad}</div>

                <div className="col-span-2 text-right">
                  {money(Number(total))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <Card title="Costo total" value={money(calc.costoTotal)} />
          <Card title="Utilidad" value={money(calc.utilidad)} />
          <Card title="Precio sugerido" value={money(calc.precioVenta)} />
        </div>

        <p className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          Paso 1: iluminación real agregada con consumo por módulo y 20 módulos
          por tira. Falta integrar lámina, tubular, soldadura, pijas, cable,
          pintura y tiempos de fabricación.
        </p>
      </section>
    </div>
  );
}

function Input({
  label,
  value,
  setValue,
  type = "text",
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="text-sm text-neutral-300">
      {label}
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        type={type}
        step={type === "number" ? "0.01" : undefined}
        className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-white"
      />
    </label>
  );
}

function Select({
  label,
  value,
  setValue,
  options,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="text-sm text-neutral-300">
      {label}
      <select
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-white"
      >
        {options.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </label>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <p className="text-xs text-neutral-500">{title}</p>
      <p className="mt-1 text-lg font-medium">{value}</p>
    </div>
  );
}