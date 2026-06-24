import Link from "next/link";
import AccessDenied from "@/components/AccessDenied";
import { getAdminAccess } from "@/utils/auth/permissions";
import { createCostItem, updateCostItem } from "./actions";

type CostItem = {
  sku: string;
  name: string;
  category: string | null;
  unit: string;
  cost: number;
  sale_price: number | null;
  active: boolean;
  notes: string | null;
};

export default async function CatalogoCostosPage({
  searchParams,
}: {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const { supabase, profile, allowed } = await getAdminAccess();

  if (!allowed) {
    return <AccessDenied profile={profile} section="Catálogo de costos" />;
  }

  const { data, error } = await supabase
    .from("cost_catalog")
    .select("sku,name,category,unit,cost,sale_price,active,notes")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  const items = (data ?? []) as CostItem[];

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-400">
            Hollow Cotizadores
          </p>

          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black">Catálogo de costos</h1>

              <p className="mt-2 text-sm text-neutral-400">
                Solo administradores pueden ver y modificar esta sección.
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                Usuario: {profile?.email} · Rol: {profile?.role}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <NavButton href="/" label="Inicio" />
              <NavButton href="/admin" label="Admin" />
              <NavButton href="/cotizadores/cajas-luz" label="Cotizador cajas" />
            </div>
          </div>
        </header>

        {params.error && <Alert type="error" message={params.error} />}

        {params.message && <Alert type="success" message={params.message} />}

        {error && (
          <Alert
            type="error"
            message={`No se pudo cargar el catálogo: ${error.message}`}
          />
        )}

        <section className="rounded-3xl border border-neutral-800 bg-neutral-900">
          <SectionTitle
            title="Agregar o actualizar SKU"
            description="Si el SKU ya existe, se actualiza. Si no existe, se crea."
          />

          <form
            action={createCostItem}
            className="grid gap-4 p-5 lg:grid-cols-12"
          >
            <Input
              label="SKU"
              name="sku"
              placeholder="EJEMPLO_SKU"
              className="lg:col-span-2"
            />

            <Input
              label="Nombre"
              name="name"
              placeholder="Nombre del material"
              className="lg:col-span-3"
            />

            <Input
              label="Categoría"
              name="category"
              placeholder="general"
              className="lg:col-span-2"
            />

            <Input
              label="Unidad"
              name="unit"
              placeholder="PIEZA"
              className="lg:col-span-1"
            />

            <Input
              label="Costo"
              name="cost"
              type="number"
              step="0.01"
              placeholder="0"
              className="lg:col-span-1"
            />

            <Input
              label="Venta"
              name="sale_price"
              type="number"
              step="0.01"
              placeholder="Opcional"
              className="lg:col-span-1"
            />

            <label className="flex items-end gap-2 text-sm lg:col-span-1">
              <input
                name="active"
                type="checkbox"
                defaultChecked
                className="mb-3 h-4 w-4"
              />

              <span className="mb-2 text-neutral-300">Activo</span>
            </label>

            <div className="lg:col-span-1 lg:flex lg:items-end">
              <button
                type="submit"
                className="w-full rounded-2xl bg-yellow-400 px-4 py-3 text-sm font-black uppercase tracking-wide text-neutral-950 transition hover:bg-yellow-300"
              >
                Guardar
              </button>
            </div>

            <label className="grid gap-2 text-sm lg:col-span-12">
              <span className="font-semibold text-neutral-300">Notas</span>

              <textarea
                name="notes"
                placeholder="Notas internas del material..."
                className="min-h-20 rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
              />
            </label>
          </form>
        </section>

        <section className="rounded-3xl border border-neutral-800 bg-neutral-900">
          <SectionTitle
            title="Materiales registrados"
            description={`${items.length} registros en cost_catalog.`}
          />

          <div className="overflow-x-auto p-5">
            <table className="w-full min-w-[1200px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-800 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="px-3 py-3">SKU</th>
                  <th className="px-3 py-3">Nombre</th>
                  <th className="px-3 py-3">Categoría</th>
                  <th className="px-3 py-3">Unidad</th>
                  <th className="px-3 py-3">Costo</th>
                  <th className="px-3 py-3">Venta</th>
                  <th className="px-3 py-3">Activo</th>
                  <th className="px-3 py-3">Notas</th>
                  <th className="px-3 py-3 text-right">Acción</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => {
                  const formId = `form-${item.sku}`;
                  const action = updateCostItem.bind(null, item.sku);

                  return (
                    <tr key={item.sku} className="border-b border-neutral-800">
                      <td className="px-3 py-3 align-top">
                        <div className="rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 font-mono text-xs text-yellow-300">
                          {item.sku}
                        </div>
                      </td>

                      <td className="px-3 py-3 align-top">
                        <form id={formId} action={action}>
                          <input
                            name="name"
                            defaultValue={item.name}
                            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-yellow-400"
                          />
                        </form>
                      </td>

                      <td className="px-3 py-3 align-top">
                        <input
                          form={formId}
                          name="category"
                          defaultValue={item.category ?? ""}
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-yellow-400"
                        />
                      </td>

                      <td className="px-3 py-3 align-top">
                        <input
                          form={formId}
                          name="unit"
                          defaultValue={item.unit}
                          className="w-28 rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-yellow-400"
                        />
                      </td>

                      <td className="px-3 py-3 align-top">
                        <input
                          form={formId}
                          name="cost"
                          type="number"
                          step="0.01"
                          defaultValue={Number(item.cost ?? 0)}
                          className="w-32 rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-right text-white outline-none focus:border-yellow-400"
                        />
                      </td>

                      <td className="px-3 py-3 align-top">
                        <input
                          form={formId}
                          name="sale_price"
                          type="number"
                          step="0.01"
                          defaultValue={item.sale_price ?? ""}
                          className="w-32 rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-right text-white outline-none focus:border-yellow-400"
                        />
                      </td>

                      <td className="px-3 py-3 align-top">
                        <label className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2">
                          <input
                            form={formId}
                            name="active"
                            type="checkbox"
                            defaultChecked={item.active}
                            className="h-4 w-4"
                          />

                          <span className="text-xs text-neutral-300">Sí</span>
                        </label>
                      </td>

                      <td className="px-3 py-3 align-top">
                        <textarea
                          form={formId}
                          name="notes"
                          defaultValue={item.notes ?? ""}
                          className="min-h-12 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-yellow-400"
                        />
                      </td>

                      <td className="px-3 py-3 text-right align-top">
                        <button
                          form={formId}
                          type="submit"
                          className="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black uppercase tracking-wide text-neutral-950 transition hover:bg-yellow-300"
                        >
                          Guardar
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-3 py-10 text-center text-neutral-500"
                    >
                      No hay materiales registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function NavButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-2 text-sm font-bold text-neutral-200 transition hover:border-yellow-400 hover:text-yellow-300"
    >
      {label}
    </Link>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-neutral-800 p-5">
      <h2 className="text-lg font-black text-white">{title}</h2>
      <p className="mt-1 text-sm text-neutral-500">{description}</p>
    </div>
  );
}

function Input({
  label,
  name,
  type = "text",
  step,
  placeholder,
  className = "",
}: {
  label: string;
  name: string;
  type?: string;
  step?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`grid gap-2 text-sm ${className}`}>
      <span className="font-semibold text-neutral-300">{label}</span>

      <input
        name={name}
        type={type}
        step={step}
        placeholder={placeholder}
        className="rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
      />
    </label>
  );
}

function Alert({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  const styles =
    type === "success"
      ? "border-green-500/30 bg-green-500/10 text-green-200"
      : "border-red-500/30 bg-red-500/10 text-red-200";

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${styles}`}
    >
      {message}
    </div>
  );
}