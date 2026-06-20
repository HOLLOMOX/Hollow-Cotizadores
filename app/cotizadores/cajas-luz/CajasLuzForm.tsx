"use client";

import { useMemo, useState } from "react";

type CostRow = {
  sku: string;
  name: string;
  unit: string;
  cost: number;
  sale_price: number | null;
};

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

function fuentePorConsumo(consumo: number) {
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

  // MEDIDAS EN METROS
  const [ancho, setAncho] = useState("1");
  const [alto, setAlto] = useState("1");
  const [profundidad, setProfundidad] = useState("0.12");
  const [cantidad, setCantidad] = useState("1");

  const [tipoCaja, setTipoCaja] = useState("Una vista");
  const [frente, setFrente] = useState("Lona backlight");
  const [iluminacion, setIluminacion] = useState("LED blanco");

  const [costoFrenteM2, setCostoFrenteM2] = useState("0");
  const [costoEstructuraMl, setCostoEstructuraMl] = useState("0");
  const [costoLateralesM2, setCostoLateralesM2] = useState("0");
  const [manoObraM2, setManoObraM2] = useState("0");

  const [tirasLed, setTirasLed] = useState("1");
  const [wattsPorTira, setWattsPorTira] = useState("14.4");

  const [instalacion, setInstalacion] = useState("0");
  const [extras, setExtras] = useState("0");
  const [margen, setMargen] = useState("40");

  const ledCostoTira = costMap.get("LED_GRANDE_C20") ?? 0;
  const fuente30 = costMap.get("FUENTE_30W") ?? 0;
  const fuente60 = costMap.get("FUENTE_60W") ?? 0;
  const fuente100 = costMap.get("FUENTE_100W") ?? 0;

  const calc = useMemo(() => {
    // Ya no dividimos entre 100 porque el usuario captura en metros
    const anchoM = n(ancho);
    const altoM = n(alto);
    const profundidadM = n(profundidad);
    const qty = Math.max(n(cantidad), 1);

    const vistas = tipoCaja === "Doble vista" ? 2 : 1;

    const areaFrente = anchoM * altoM * qty * vistas;
    const perimetro = 2 * (anchoM + altoM) * qty;
    const areaLaterales = perimetro * profundidadM;

    const costoFrente = areaFrente * n(costoFrenteM2);
    const costoEstructura = perimetro * n(costoEstructuraMl);
    const costoLaterales = areaLaterales * n(costoLateralesM2);
    const costoManoObra = areaFrente * n(manoObraM2);

    const tiras = Math.max(Math.ceil(n(tirasLed)), 0);
    const consumo = tiras * n(wattsPorTira);
    const fuente = fuentePorConsumo(consumo);

    const costoLed = tiras * ledCostoTira;

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
      costoLed +
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
      tiras,
      consumo,
      fuente,
      costoFrente,
      costoEstructura,
      costoLaterales,
      costoLed,
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
    profundidad,
    cantidad,
    tipoCaja,
    costoFrenteM2,
    costoEstructuraMl,
    costoLateralesM2,
    manoObraM2,
    tirasLed,
    wattsPorTira,
    instalacion,
    extras,
    margen,
    ledCostoTira,
    fuente30,
    fuente60,
    fuente100,
  ]);

  const partidas = [
    ["Frente " + frente, calc.areaFrente, "m²", calc.costoFrente],
    ["Estructura / perímetro", calc.perimetro, "ml", calc.costoEstructura],
    ["Laterales / profundidad", calc.areaLaterales, "m²", calc.costoLaterales],
    ["LED " + iluminacion, calc.tiras, "TIRA C/20", calc.costoLed],
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

          <Input label="Ancho m" value={ancho} setValue={setAncho} type="number" />
          <Input label="Alto m" value={alto} setValue={setAlto} type="number" />
          <Input
            label="Profundidad m"
            value={profundidad}
            setValue={setProfundidad}
            type="number"
          />
          <Input label="Cantidad" value={cantidad} setValue={setCantidad} type="number" />

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
            options={["LED blanco", "LED rojo", "LED azul", "Sin iluminación"]}
          />

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
            label="Tiras LED C/20"
            value={tirasLed}
            setValue={setTirasLed}
            type="number"
          />

          <Input
            label="Watts por tira"
            value={wattsPorTira}
            setValue={setWattsPorTira}
            type="number"
          />

          <Input
            label="Instalación"
            value={instalacion}
            setValue={setInstalacion}
            type="number"
          />

          <Input label="Extras" value={extras} setValue={setExtras} type="number" />

          <Input label="Margen %" value={margen} setValue={setMargen} type="number" />
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
          <Card title="Área frente" value={`${calc.areaFrente.toFixed(2)} m²`} />
          <Card title="Perímetro" value={`${calc.perimetro.toFixed(2)} ml`} />
          <Card title="Área laterales" value={`${calc.areaLaterales.toFixed(2)} m²`} />
          <Card title="Fuente" value={calc.fuente.label} />
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Card title="Consumo" value={`${calc.consumo.toFixed(1)} W`} />
          <Card title="Tiras LED" value={`${calc.tiras} C/20`} />
          <Card title="Vistas" value={`${calc.vistas}`} />
          <Card title="Tipo" value={tipoCaja} />
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-800">
          <div className="grid grid-cols-12 bg-neutral-950 px-4 py-3 text-xs uppercase tracking-wider text-neutral-500">
            <div className="col-span-6">Concepto</div>
            <div className="col-span-2 text-right">Cantidad</div>
            <div className="col-span-2">Unidad</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          <div className="divide-y divide-neutral-800">
            {partidas.map(([concepto, cantidad, unidad, total]) => (
              <div key={concepto} className="grid grid-cols-12 px-4 py-3 text-sm">
                <div className="col-span-6">{concepto}</div>

                <div className="col-span-2 text-right">
                  {Number(cantidad).toFixed(2)}
                </div>

                <div className="col-span-2 text-neutral-400">{unidad}</div>

                <div className="col-span-2 text-right">{money(Number(total))}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <Card title="Costo total" value={money(calc.costoTotal)} />
          <Card title="Utilidad" value={money(calc.utilidad)} />
          <Card title="Margen" value={`${calc.margenNum.toFixed(2)}%`} />
        </div>

        <p className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          Esta versión aún no guarda la cotización. Primero validamos fórmulas,
          materiales y costos reales.
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