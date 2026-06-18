import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createCostItem, updateCostItem } from "./actions";

type CostItem = {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  cost: number;
  sale_price: number | null;
  active: boolean;
  notes: string | null;
};

export default async function CatalogoCostosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: items, error } = await supabase
    .from("cost_catalog")
    .select("id, sku, name, category, unit, cost, sale_price, active, notes")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="min-h-screen bg-neutral-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <a href="/" className="text-sm text-neutral-400 hover:text-white">
          ← Volver
        </a>

        <div className="mt-6">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-neutral-500">
            Hollow Cotizadores
          </p>

          <h1 className="text-3xl font-semibold">Catálogo de costos</h1>

          <p className="mt-2 text-sm text-neutral-400">
            Edita costos base de materiales, servicios y consumibles.
          </p>
        </div>

        <section className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-xl font-medium">Agregar material</h2>

          <form
            action={createCostItem}
            className="mt-5 grid gap-4 md:grid-cols-6"
          >
            <input
              name="sku"
              placeholder="SKU"
              className="rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-white"
            />

            <input
              name="name"
              placeholder="Nombre"
              className="rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-white md:col-span-2"
            />

            <input
              name="category"
              placeholder="Categoría"
              className="rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-white"
            />

            <input
              name="unit"
              placeholder="Unidad"
              className="rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-white"
            />

            <input
              name="cost"
              type="number"
              step="0.01"
              placeholder="Costo"
              className="rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-white"
            />

            <input
              name="notes"
              placeholder="Notas"
              className="rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-white md:col-span-5"
            />

            <button
              type="submit"
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-200"
            >
              Agregar
            </button>
          </form>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
          <div className="grid grid-cols-12 border-b border-neutral-800 bg-neutral-950 px-4 py-3 text-xs uppercase tracking-wider text-neutral-500">
            <div className="col-span-2">SKU</div>
            <div className="col-span-3">Material</div>
            <div className="col-span-1">Categoría</div>
            <div className="col-span-1">Unidad</div>
            <div className="col-span-1">Costo</div>
            <div className="col-span-1">Venta</div>
            <div className="col-span-2">Notas</div>
            <div className="col-span-1 text-right">Acción</div>
          </div>

          <div className="divide-y divide-neutral-800">
            {(items as CostItem[] | null)?.map((item) => (
              <form
                key={item.id}
                action={updateCostItem}
                className="grid grid-cols-12 items-center gap-3 px-4 py-3 text-sm"
              >
                <input type="hidden" name="id" value={item.id} />

                <div className="col-span-2 text-neutral-400">{item.sku}</div>

                <div className="col-span-3">
                  <p className="font-medium">{item.name}</p>
                </div>

                <div className="col-span-1 text-neutral-400">
                  {item.category}
                </div>

                <div className="col-span-1 text-neutral-400">{item.unit}</div>

                <div className="col-span-1">
                  <input
                    name="cost"
                    type="number"
                    step="0.01"
                    defaultValue={item.cost}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-2 outline-none focus:border-white"
                  />
                </div>

                <div className="col-span-1">
                  <input
                    name="sale_price"
                    type="number"
                    step="0.01"
                    defaultValue={item.sale_price ?? ""}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-2 outline-none focus:border-white"
                  />
                </div>

                <div className="col-span-2">
                  <input
                    name="notes"
                    defaultValue={item.notes ?? ""}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-2 outline-none focus:border-white"
                  />
                </div>

                <div className="col-span-1 flex items-center justify-end gap-2">
                  <input
                    name="active"
                    type="checkbox"
                    defaultChecked={item.active}
                    className="h-4 w-4"
                    title="Activo"
                  />

                  <button
                    type="submit"
                    className="rounded-lg border border-neutral-700 px-3 py-2 text-xs text-neutral-300 hover:border-white hover:text-white"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}