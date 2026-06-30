"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function createClientRecord(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuario no autenticado.");
  }

  const name = clean(formData.get("name"));

  if (!name) {
    throw new Error("El nombre del cliente es obligatorio.");
  }

  const payload = {
    name,
    contact_name: clean(formData.get("contact_name")) || null,
    phone: clean(formData.get("phone")) || null,
    email: clean(formData.get("email")) || null,
    rfc: clean(formData.get("rfc")) || null,
    address: clean(formData.get("address")) || null,
    notes: clean(formData.get("notes")) || null,
    active: true,
    created_by: user.id,
  };

  const { error } = await supabase.from("clients").insert(payload);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/clientes");
}

export async function updateClientRecord(formData: FormData) {
  const supabase = await createClient();

  const id = clean(formData.get("id"));
  const name = clean(formData.get("name"));

  if (!id) {
    throw new Error("Falta el ID del cliente.");
  }

  if (!name) {
    throw new Error("El nombre del cliente es obligatorio.");
  }

  const payload = {
    name,
    contact_name: clean(formData.get("contact_name")) || null,
    phone: clean(formData.get("phone")) || null,
    email: clean(formData.get("email")) || null,
    rfc: clean(formData.get("rfc")) || null,
    address: clean(formData.get("address")) || null,
    notes: clean(formData.get("notes")) || null,
  };

  const { error } = await supabase
    .from("clients")
    .update(payload)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/clientes");
}

export async function deactivateClientRecord(formData: FormData) {
  const supabase = await createClient();

  const id = clean(formData.get("id"));

  if (!id) {
    throw new Error("Falta el ID del cliente.");
  }

  const { error } = await supabase
    .from("clients")
    .update({ active: false })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/clientes");
}