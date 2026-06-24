"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/utils/auth/permissions";

const CATALOG_ROUTE = "/catalogo-costos";

function textValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function numericValue(formData: FormData, key: string, fallback = 0) {
  const value = textValue(formData, key);

  if (!value) return fallback;

  const normalized = value.replace(",", "");
  const number = Number(normalized);

  return Number.isFinite(number) ? number : fallback;
}

function nullableNumericValue(formData: FormData, key: string) {
  const value = textValue(formData, key);

  if (!value) return null;

  const normalized = value.replace(",", "");
  const number = Number(normalized);

  return Number.isFinite(number) ? number : null;
}

function boolValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function createCostItem(formData: FormData) {
  const { supabase } = await requireAdmin();

  const sku = textValue(formData, "sku").toUpperCase();
  const name = textValue(formData, "name");
  const category = textValue(formData, "category") || "general";
  const unit = textValue(formData, "unit").toUpperCase() || "PIEZA";
  const cost = numericValue(formData, "cost");
  const sale_price = nullableNumericValue(formData, "sale_price");
  const notes = textValue(formData, "notes");
  const active = boolValue(formData, "active");

  if (!sku || !name) {
    redirect(
      `${CATALOG_ROUTE}?error=${encodeURIComponent(
        "SKU y nombre son obligatorios"
      )}`
    );
  }

  const { error } = await supabase.from("cost_catalog").upsert(
    {
      sku,
      name,
      category,
      unit,
      cost,
      sale_price,
      active,
      notes,
    },
    {
      onConflict: "sku",
    }
  );

  if (error) {
    redirect(
      `${CATALOG_ROUTE}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(CATALOG_ROUTE);
  revalidatePath("/catalogo");

  redirect(
    `${CATALOG_ROUTE}?message=${encodeURIComponent(
      "Material guardado correctamente"
    )}`
  );
}

export async function updateCostItem(sku: string, formData: FormData) {
  const { supabase } = await requireAdmin();

  const name = textValue(formData, "name");
  const category = textValue(formData, "category") || "general";
  const unit = textValue(formData, "unit").toUpperCase() || "PIEZA";
  const cost = numericValue(formData, "cost");
  const sale_price = nullableNumericValue(formData, "sale_price");
  const notes = textValue(formData, "notes");
  const active = boolValue(formData, "active");

  if (!sku || !name) {
    redirect(
      `${CATALOG_ROUTE}?error=${encodeURIComponent(
        "SKU y nombre son obligatorios"
      )}`
    );
  }

  const { error } = await supabase
    .from("cost_catalog")
    .update({
      name,
      category,
      unit,
      cost,
      sale_price,
      active,
      notes,
    })
    .eq("sku", sku);

  if (error) {
    redirect(
      `${CATALOG_ROUTE}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(CATALOG_ROUTE);
  revalidatePath("/catalogo");

  redirect(
    `${CATALOG_ROUTE}?message=${encodeURIComponent(
      `SKU ${sku} actualizado correctamente`
    )}`
  );
}