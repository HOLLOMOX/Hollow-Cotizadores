"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function updateCostItem(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const id = String(formData.get("id"));
  const cost = Number(formData.get("cost") || 0);
  const salePriceRaw = String(formData.get("sale_price") || "");
  const notes = String(formData.get("notes") || "");
  const active = formData.get("active") === "on";

  const sale_price = salePriceRaw === "" ? null : Number(salePriceRaw);

  const { error } = await supabase
    .from("cost_catalog")
    .update({
      cost,
      sale_price,
      notes,
      active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/catalogo-costos");
}

export async function createCostItem(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const sku = String(formData.get("sku") || "").trim().toUpperCase();
  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const unit = String(formData.get("unit") || "").trim().toUpperCase();
  const cost = Number(formData.get("cost") || 0);
  const notes = String(formData.get("notes") || "").trim();

  if (!sku || !name || !category || !unit) {
    throw new Error("Faltan datos obligatorios.");
  }

  const { error } = await supabase.from("cost_catalog").insert({
    sku,
    name,
    category,
    unit,
    cost,
    notes,
    active: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/catalogo-costos");
}