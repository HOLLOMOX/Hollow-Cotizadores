import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import CajasLuzForm from "./Ca  jasLuzForm";

type CostRow = {
  sku: string;
  name: string;
  unit: string;
  cost: number;
  sale_price: number | null;
};

export default async function CajasDeLuzPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: costRows, error } = await supabase
    .from("cost_catalog")
    .select("sku, name, unit, cost, sale_price")
    .eq("active", true);

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

          <h1 className="text-3xl font-semibold">
            Cotizador de cajas de luz
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-neutral-400">
            Cálculo inicial para fabricación de caja de luz: medidas, frente,
            estructura, laterales, LED, fuente, mano de obra y margen.
          </p>
        </div>

        <CajasLuzForm costRows={(costRows ?? []) as CostRow[]} />
      </div>
    </main>
  );
} 