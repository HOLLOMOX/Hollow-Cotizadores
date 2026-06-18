import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { logout } from "./login/actions";

type CalculatorType = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
  sort_order: number;
};

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: cotizadores, error } = await supabase
    .from("calculator_types")
    .select("id, name, slug, description, active, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error(error);
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-12">
        <div className="mb-10">
          <div className="mb-6 flex flex-wrap gap-3">
            <form action={logout}>
              <button
                type="submit"
                className="rounded-full border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:border-white hover:text-white"
              >
                Cerrar sesión
              </button>
            </form>

            <a
              href="/catalogo-costos"
              className="inline-block rounded-full border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:border-white hover:text-white"
            >
              Catálogo de costos
            </a>

            <a
              href="/clientes"
              className="inline-block rounded-full border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:border-white hover:text-white"
            >
              Clientes
            </a>
          </div>

          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-neutral-400">
            Pantera Publicidad
          </p>

          <h1 className="text-4xl font-semibold md:text-6xl">
            Hollow Cotizadores
          </h1>

          <p className="mt-4 max-w-2xl text-neutral-400">
            Plataforma interna para crear cotizaciones de cajas de luz,
            letras de canal y próximos productos.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {(cotizadores as CalculatorType[] | null)?.map((item) => (
            <a
              key={item.id}
              href={item.active ? `/cotizadores/${item.slug}` : "#"}
              className={`rounded-2xl border p-6 transition ${
                item.active
                  ? "border-neutral-700 bg-neutral-900 hover:border-white"
                  : "border-neutral-800 bg-neutral-900/50 opacity-50"
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-medium">{item.name}</h2>

                <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs text-neutral-300">
                  {item.active ? "Activo" : "Próximamente"}
                </span>
              </div>

              <p className="text-sm text-neutral-400">
                {item.description || "Sin descripción."}
              </p>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}