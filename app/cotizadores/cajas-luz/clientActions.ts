"use server";

import { createClient } from "@/utils/supabase/server";

export type CotizadorClientOption = {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  rfc: string | null;
  address: string | null;
  notes: string | null;
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

export async function listClientsForCotizador(): Promise<{
  ok: boolean;
  clients: CotizadorClientOption[];
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      clients: [],
      error: "Usuario no autenticado.",
    };
  }

  const { data, error } = await supabase
    .from("clients")
    .select("id,name,contact_name,phone,email,rfc,address,notes")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) {
    return {
      ok: false,
      clients: [],
      error: error.message,
    };
  }

  return {
    ok: true,
    clients: (data ?? []) as CotizadorClientOption[],
  };
}

export async function createClientFromCotizador(payload: {
  name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  rfc?: string;
  address?: string;
  notes?: string;
}): Promise<{
  ok: boolean;
  client?: CotizadorClientOption;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      error: "Usuario no autenticado.",
    };
  }

  const name = clean(payload.name);

  if (!name) {
    return {
      ok: false,
      error: "El nombre del cliente es obligatorio.",
    };
  }

  const insertPayload = {
    name,
    contact_name: clean(payload.contact_name) || null,
    phone: clean(payload.phone) || null,
    email: clean(payload.email) || null,
    rfc: clean(payload.rfc) || null,
    address: clean(payload.address) || null,
    notes: clean(payload.notes) || null,
    active: true,
    created_by: user.id,
  };

  const { data, error } = await supabase
    .from("clients")
    .insert(insertPayload)
    .select("id,name,contact_name,phone,email,rfc,address,notes")
    .single();

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  return {
    ok: true,
    client: data as CotizadorClientOption,
  };
}