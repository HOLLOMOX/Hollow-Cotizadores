"use client";

import { useMemo, useState } from "react";

type CostCatalogRow = {
  sku: string;
  name: string;
  unit: string;
  cost: number;
  sale_price: number | null;
};

type SourceResult = {
  label: string;
  qty30: number;
  qty60: number;
  qty100: number;
};

function money(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number.isFinite(value) ? value : 0);
}

function numberValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getSourceByConsumption(consumptionW: number): SourceResult {
  if (consumptionW <= 0) {
    return { label: "Sin fuente", qty30: 0, qty60: 0, qty100: 0 };
  }

  if (consumptionW <= 21) {
    return { label: "1 × Fuente 30 W", qty30: 1, qty60: 0, qty100: 0 };
  }

  if (consumptionW <= 42) {
    return { label: "1 × Fuente 60 W", qty30: 0, qty60: 1, qty100: 0 };
  }

  const qty100 = Math.ceil(consumptionW / 70);

  return {
    label: `${qty100} × Fuente 100 W`,
    qty30: 0,
    qty60: 0,
    qty100,
  };
}

export default function CajasLuzCalculator({
  costRows,
}: {
  costRows: CostCatalogRow[];
}) {
  const costMap = useMemo(() => {
    const map = new Map<string, number>();

    costRows.forEach((row) => {
      map.set(row.sku, Number(row.cost || 0));
    });

    return map;
  }, [costRows]);

  const [clientName, setClientName] = useState("");
  const [projectName, setProjectName] = useState("Caja de luz");

  const [widthCm, setWidthCm] = useState("100");
  const [heightCm, setHeightCm] = useState("100");
  const [depthCm, setDepthCm] = useState("12");
  const [quantity, setQuantity] = useState("1");

  const [frontType, setFrontType] = useState("Lona backlight");

  const [frontCostM2, setFrontCostM2] = useState("0");
  const [profileCostMl, setProfileCostMl] = useState("0");
  const [sideCostM2, setSideCostM2] = useState("0");
  const [laborCostM2, setLaborCostM2] = useState("0");
  const [installCost, setInstallCost] = useState("0");
  const [extrasCost, setExtrasCost] = useState("0");

  const [ledStrips, setLedStrips] = useState("1");
  const [wattsPerStrip, setWattsPerStrip] = useState("14.4");
  const [marginPercent, setMarginPercent] = useState("40");

  const ledCostPerStrip = costMap.get("LED_GRANDE_C20") ?? 0;
  const source30Cost = costMap.get("FUENTE_30W") ?? 0;
  const source60Cost = costMap.get("FUENTE_60W") ?? 0;
  const source100Cost = costMap.get("FUENTE_100W") ?? 0;

  const calc = useMemo(() => {
    const width = numberValue(widthCm);
    const height = numberValue(heightCm);
    const depth = numberValue(depthCm);
    const qty = Math.max(numberValue(quantity), 1);

    const areaM2 = (width / 100) * (height / 100) * qty;
    const perimeterM = 2 * (width / 100 + height / 100) * qty;
    const sideAreaM2 = perimeterM * (depth / 100);

    const frontCost = areaM2 * numberValue(frontCostM2);
    const profileCost = perimeterM * numberValue(profileCostMl);
    const sideCost = sideAreaM2 * numberValue(sideCostM2);
    const laborCost = areaM2 * numberValue(laborCostM2);

    const strips = Math.max(Math.ceil(numberValue(ledStrips)), 0);
    const consumptionW = strips * numberValue(wattsPerStrip);
    const source = getSourceByConsumption(consumptionW);

    const ledCost = strips * ledCostPerStrip;

    const sourceCost =
      source.qty30 * source30Cost +
      source.qty60 * source60Cost +
      source.qty100 * source100Cost;

    const install = numberValue(installCost);
    const extras = numberValue(extrasCost);

    const totalCost =
      frontCost +
      profileCost +
      sideCost +
      laborCost +
      ledCost +
      sourceCost +
      install +
      extras;

    const margin = numberValue(marginPercent);

    const salePrice =
      margin >= 100 ? totalCost : totalCost / (1 - margin / 100);

    const profit = salePrice - totalCost;

    return {
      areaM2,
      perimeterM,
      sideAreaM2,
      frontCost,
      profileCost,
      sideCost,
      laborCost,
      strips,
      consumptionW,
      source,
      ledCost,
      sourceCost,
      install,
      extras,
      totalCost,
      margin,
      salePrice,
      profit,
    };
  }, [
    widthCm,
    heightCm,
    depthCm,
    quantity,
    frontCostM2,
    profileCostMl,
    sideCostM2,
    laborCostM2,
    ledStrips,
    wattsPerStrip,
    marginPercent,
    ledCostPerStrip,
    source30Cost,
    source60Cost,
    source100Cost,
    installCost,
    extrasCost,
  ]);

  const materials = [
    {
      concept: `Frente ${frontType}`,
      quantity: calc.areaM2,
      unit: "m²",
      unitCost: numberValue(frontCostM2),
      total: calc.frontCost,
    },
    {
      concept: "Perfil / estructura perimetral",
      quantity: calc.perimeterM,
      unit: "ml",
      unitCost: numberValue(profileCostMl),
      total: calc.profileCost,
    },
    {
      concept: "Laterales / profundidad",
      quantity: calc.sideAreaM2,
      unit: "m²",
      unitCost: numberValue(sideCostM2),
      total: calc.sideCost,
    },
    {
      concept: "LED grande 1.5 × 7 cm",
      quantity: calc.strips,
      unit: "TIRA C/20",
      unitCost: ledCostPerStrip,
      total: calc.ledCost,
    },
    {
      concept: calc.source.label,
      quantity: calc.source.qty30 + calc.source.qty60 + calc.source.qty100,
      unit: "PIEZA",
      unitCost: 0,
      total: calc.sourceCost,
    },
    {
      concept: "Mano de obra",
      quantity: calc.areaM2,
      unit: "m²",
      unitCost: numberValue(laborCostM2),
      total: calc.laborCost,
    },
    {
      concept: "Instalación",
      quantity: 1,
      unit: "SERVICIO",
      unitCost: calc.install,
      total: calc.install,
    },
    {
      concept: "Extras",
      quantity: 1,
      unit: "LOTE",
      unitCost: calc.extras,
      total: calc.extras,
    },
  ];

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-12">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 lg:col-span-5">
        <h2 className="text-xl font-medium">Datos del proyecto</h2>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-neutral-300">
            Cliente
            <input
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-white"
              placeholder="Cliente"
            />
          </label>

          <label className="text-sm text-neutral-300">
            Proyecto
            <input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-white"
            />
          </label>

          <label className="text-sm text-neutral-300">
            Ancho cm
            <input
              value={widthCm}
              onChange={(event) => setWidthCm(event.target.value)}
              type="number"
              className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-white"
            />
          </label>

          <label className="text-sm text-neutral-300">
            Alto cm
            <input
              value={heightCm}
              onChange={(event) => setHeightCm(event.target.value)}
              type="number"
              className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-white"
            />
          </label>

          <label className="text-sm text-neutral-300">
            Profundidad cm
            <input
              value={depthCm}
              onChange={(event) => setDepthCm(event.target.value)}
              type="number"
              className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-white"
            />
          </label>

          <label className="text-sm text-neutral-300">
            Cantidad
            <input
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              type="number"
              className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-white"
            />
          </label>

          <label className="text-sm text-neutral-300 md:col-span-2">
            Tipo de frente
            <select
              value={frontType}
              onChange={(event) => setFrontType(event.target.value)}
              className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-white"
            >
              <option>Lona backlight</option>
              <option>Acrílico blanco lechoso</option>
              <option>Policarbonato</option>
              <option>Otro</option>
            </select>
          </label>
        </div>

        <h2 className="mt-8 text-xl font-medium">Costos base</h2>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-neutral-300">
            Frente costo m²
            <input
              value={frontCostM2}
              onChange={(event) => setFrontCostM2(event.target.value)}
              type="number"
              step="0.01"
              className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-white"
            />
          </label>

          <label className="text-sm text-neutral-300">
            Perfil costo ml
            <input
              value={profileCostMl}
              onChange={(event) => setProfileCostMl(event.target.value)}
              type="number"
              step="0.01"
              className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-white"
            />
          </label>

          <label className="text-sm text-neutral-300">
            Laterales costo m²
            <input
              value={sideCostM2}
              onChange={(event) => setSideCostM2(event.target.value)}
              type="number"
              step="0.01"
              className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-white"
            />
          </label>

          <label className="text-sm text-neutral-300">
            Mano de obra m²
            <input
              value={laborCostM2}
              onChange={(event) => setLaborCostM2(event.target.value)}
              type="number"
              step="0.01"
              className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-white"
            />
          </label>

          <label className="text-sm text-neutral-300">
            Tiras LED C/20
            <input
              value={ledStrips}
              onChange={(event) => setLedStrips(event.target.value)}
              type="number"
              step="1"
              className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-white"
            />
          </label>

          <label className="text-sm text-neutral-300">
            Watts por tira
            <input
              value={wattsPerStrip}
              onChange={(event) => setWattsPerStrip(event.target.value)}
              type="number"
              step="0.01"
              className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-white"
            />
          </label>

          <label className="text-sm text-neutral-300">
            Instalación
            <input
              value={installCost}
              onChange={(event) => setInstallCost(event.target.value)}
              type="number"
              step="0.01"
              className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-white"
            />
          </label>

          <label className="text-sm text-neutral-300">
            Extras
            <input
              value={extrasCost}
              onChange={(event) => setExtrasCost(event.target.value)}
              type="number"
              step="0.01"
              className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-white"
            />
          </label>

          <label className="text-sm text-neutral-300 md:col-span-2">
            Margen %
            <input
              value={marginPercent}
              onChange={(event) => setMarginPercent(event.target.value)}
              type="number"
              step="0.01"
              className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-white"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 lg:col-span-7">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h2 className="text-xl font-medium">Resultado</h2>
            <p className="mt-1 text-sm text-neutral-400">
              {clientName || "Sin cliente"} · {projectName}
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-right">
            <p className="text-sm text-neutral-500">Precio sugerido</p>
            <p className="mt-1 text-3xl font-semibold">
              {money(calc.salePrice)}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
            <p className="text-xs text-neutral-500">Área</p>
            <p className="mt-1 text-lg font-medium">
              {calc.areaM2.toFixed(2)} m²
            </p>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
            <p className="text-xs text-neutral-500">Perímetro</p>
            <p className="mt-1 text-lg font-medium">
              {calc.perimeterM.toFixed(2)} ml
            </p>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
            <p className="text-xs text-neutral-500">Consumo LED</p>
            <p className="mt-1 text-lg font-medium">
              {calc.consumptionW.toFixed(1)} W
            </p>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
            <p className="text-xs text-neutral-500">Fuente</p>
            <p className="mt-1 text-lg font-medium">{calc.source.label}</p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-800">
          <div className="grid grid-cols-12 bg-neutral-950 px-4 py-3 text-xs uppercase tracking-wider text-neutral-500">
            <div className="col-span-5">Concepto</div>
            <div className="col-span-2 text-right">Cantidad</div>
            <div className="col-span-2">Unidad</div>
            <div className="col-span-1 text-right">Costo</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          <div className="divide-y divide-neutral-800">
            {materials.map((item) => (
              <div
                key={item.concept}
                className="grid grid-cols-12 px-4 py-3 text-sm"
              >
                <div className="col-span-5">{item.concept}</div>

                <div className="col-span-2 text-right">
                  {item.quantity.toFixed(2)}
                </div>

                <div className="col-span-2 text-neutral-400">{item.unit}</div>

                <div className="col-span-1 text-right text-neutral-400">
                  {item.unitCost ? money(item.unitCost) : "-"}
                </div>

                <div className="col-span-2 text-right">
                  {money(item.total)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
            <p className="text-xs text-neutral-500">Costo total</p>
            <p className="mt-1 text-xl font-medium">{money(calc.totalCost)}</p>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
            <p className="text-xs text-neutral-500">Utilidad estimada</p>
            <p className="mt-1 text-xl font-medium">{money(calc.profit)}</p>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
            <p className="text-xs text-neutral-500">Margen</p>
            <p className="mt-1 text-xl font-medium">
              {calc.margin.toFixed(2)}%
            </p>
          </div>
        </div>

        <p className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          Esta versión todavía no guarda la cotización. Primero sirve para
          validar fórmulas, materiales y precios reales.
        </p>
      </section>
    </div>
  );
}