"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserProfile } from "@/utils/auth/permissions";

export type QuoteStatus =
  | "BORRADOR"
  | "ENVIADA"
  | "APROBADA"
  | "RECHAZADA"
  | "PRODUCCION"
  | "TERMINADA"
  | "CANCELADA";

export type UpdateQuoteStatusResponse =
  | {
      ok: true;
      message: string;
      status: QuoteStatus;
    }
  | {
      ok: false;
      message: string;
    };

export type DuplicateQuoteResponse =
  | {
      ok: true;
      id: string;
      quoteNumber: string;
      message: string;
    }
  | {
      ok: false;
      message: string;
    };

const VALID_STATUSES: QuoteStatus[] = [
  "BORRADOR",
  "ENVIADA",
  "APROBADA",
  "RECHAZADA",
  "PRODUCCION",
  "TERMINADA",
  "CANCELADA",
];

const SELLER_ALLOWED_STATUSES: QuoteStatus[] = [
  "BORRADOR",
  "ENVIADA",
  "APROBADA",
  "RECHAZADA",
  "CANCELADA",
];

const PRODUCTION_ALLOWED_STATUSES: QuoteStatus[] = [
  "PRODUCCION",
  "TERMINADA",
];

type QuoteRow = {
  id: string;
  user_id: string | null;
  quote_number: string | null;
  title: string | null;
  quote_type: string | null;
  client_name: string | null;
  seller_name: string | null;
  project_name: string | null;
  form_data: Record<string, unknown> | null;
  result_data: Record<string, unknown> | null;
  material_lines: unknown[] | null;
  cost_direct: number | null;
  price_without_tax: number | null;
  tax_amount: number | null;
  total_with_tax: number | null;
  utility_amount: number | null;
  margin_percent: number | null;
  status: string | null;
  notes: string | null;
};

function createQuoteNumber() {
  const now = new Date();

  const datePart = now.toISOString().slice(0, 10).replaceAll("-", "");
  const timePart = String(now.getTime()).slice(-6);

  return `CL-${datePart}-${timePart}`;
}

function createDuplicatedTitle(title: string | null) {
  const cleanTitle = title?.trim() || "Cotización de caja de luz";

  if (cleanTitle.toLowerCase().startsWith("copia de")) {
    return cleanTitle;
  }

  return `Copia de ${cleanTitle}`;
}

function normalizeRole(role: string | null | undefined) {
  return String(role ?? "")
    .trim()
    .toLowerCase();
}

function normalizeStatus(status: string): QuoteStatus | null {
  const clean = status
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

  if (clean === "PRODUCCIÓN") return "PRODUCCION";
  if (clean === "PRODUCCION") return "PRODUCCION";

  if ((VALID_STATUSES as string[]).includes(clean)) {
    return clean as QuoteStatus;
  }

  return null;
}

function canRoleChangeStatus(roleRaw: string, nextStatus: QuoteStatus) {
  const role = normalizeRole(roleRaw);

  if (role === "admin") {
    return true;
  }

  if (role === "vendedor") {
    return SELLER_ALLOWED_STATUSES.includes(nextStatus);
  }

  if (role === "produccion" || role === "producción") {
    return PRODUCTION_ALLOWED_STATUSES.includes(nextStatus);
  }

  return false;
}

function canRoleDuplicate(roleRaw: string) {
  const role = normalizeRole(roleRaw);

  return role === "admin" || role === "vendedor";
}

export async function updateQuoteStatus(
  quoteId: string,
  nextStatusRaw: QuoteStatus | string
): Promise<UpdateQuoteStatusResponse> {
  const nextStatus = normalizeStatus(nextStatusRaw);

  if (!nextStatus) {
    return {
      ok: false,
      message: "Estado no válido.",
    };
  }

  const { user, profile, supabase } = await getCurrentUserProfile();

  if (!user) {
    return {
      ok: false,
      message: "Sesión expirada. Inicia sesión nuevamente.",
    };
  }

  if (!profile || profile.active === false) {
    return {
      ok: false,
      message: "Usuario inactivo o sin perfil válido.",
    };
  }

  const role = normalizeRole(profile.role);

  if (!canRoleChangeStatus(role, nextStatus)) {
    return {
      ok: false,
      message: "Tu rol no tiene permiso para asignar este estado.",
    };
  }

  const { data: quoteData, error: quoteError } = await supabase
    .from("quotes")
    .select("id,user_id,quote_number,title,status")
    .eq("id", quoteId)
    .single();

  if (quoteError || !quoteData) {
    return {
      ok: false,
      message: "No se encontró la cotización.",
    };
  }

  const quote = quoteData as {
    id: string;
    user_id: string | null;
    quote_number: string | null;
    title: string | null;
    status: string | null;
  };

  const isAdmin = role === "admin";
  const isProduction = role === "produccion" || role === "producción";
  const isOwner = quote.user_id === user.id;

  if (!isAdmin && !isProduction && !isOwner) {
    return {
      ok: false,
      message: "No tienes permiso para modificar esta cotización.",
    };
  }

  const previousStatus = normalizeStatus(quote.status ?? "") ?? "BORRADOR";

  const { error: updateError } = await supabase
    .from("quotes")
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", quoteId);

  if (updateError) {
    return {
      ok: false,
      message: `No se pudo actualizar el estado: ${updateError.message}`,
    };
  }

  await supabase.from("usage_events").insert({
    user_id: user.id,
    event_type: "quote_status_changed",
    module: "CAJA_LUZ",
    route: `/cotizaciones/${quoteId}`,
    quote_id: quoteId,
    metadata: {
      quote_number: quote.quote_number,
      title: quote.title,
      previous_status: previousStatus,
      next_status: nextStatus,
      changed_by: user.email,
      role,
    },
  });

  revalidatePath("/cotizaciones");
  revalidatePath(`/cotizaciones/${quoteId}`);
  revalidatePath("/admin");

  return {
    ok: true,
    status: nextStatus,
    message: `Estado actualizado a ${nextStatus}.`,
  };
}

export async function duplicateQuote(
  quoteId: string
): Promise<DuplicateQuoteResponse> {
  const { user, profile, supabase } = await getCurrentUserProfile();

  if (!user) {
    return {
      ok: false,
      message: "Sesión expirada. Inicia sesión nuevamente.",
    };
  }

  if (!profile || profile.active === false) {
    return {
      ok: false,
      message: "Usuario inactivo o sin perfil válido.",
    };
  }

  const role = normalizeRole(profile.role);

  if (!canRoleDuplicate(role)) {
    return {
      ok: false,
      message: "Tu rol no puede duplicar cotizaciones.",
    };
  }

  const { data: quoteData, error: quoteError } = await supabase
    .from("quotes")
    .select(
      `
      id,
      user_id,
      quote_number,
      title,
      quote_type,
      client_name,
      seller_name,
      project_name,
      form_data,
      result_data,
      material_lines,
      cost_direct,
      price_without_tax,
      tax_amount,
      total_with_tax,
      utility_amount,
      margin_percent,
      status,
      notes
    `
    )
    .eq("id", quoteId)
    .single();

  if (quoteError || !quoteData) {
    return {
      ok: false,
      message: "No se encontró la cotización original.",
    };
  }

  const original = quoteData as QuoteRow;

  const isAdmin = role === "admin";
  const isOwner = original.user_id === user.id;

  if (!isAdmin && !isOwner) {
    return {
      ok: false,
      message: "No tienes permiso para duplicar esta cotización.",
    };
  }

  const newQuoteNumber = createQuoteNumber();
  const newTitle = createDuplicatedTitle(original.title);

  const insertPayload = {
    user_id: user.id,

    title: newTitle,
    quote_type: original.quote_type || "CAJA_LUZ",

    client_name: original.client_name || "Cliente nuevo",
    seller_name: original.seller_name || "",
    project_name: original.project_name || "Caja de luz",
    quote_number: newQuoteNumber,

    form_data: original.form_data ?? {},
    result_data: original.result_data ?? {},
    material_lines: original.material_lines ?? [],

    cost_direct: Number(original.cost_direct ?? 0),
    price_without_tax: Number(original.price_without_tax ?? 0),
    tax_amount: Number(original.tax_amount ?? 0),
    total_with_tax: Number(original.total_with_tax ?? 0),
    utility_amount: Number(original.utility_amount ?? 0),
    margin_percent: Number(original.margin_percent ?? 0),

    status: "BORRADOR",
    notes: original.notes || null,
  };

  const { data: created, error: insertError } = await supabase
    .from("quotes")
    .insert(insertPayload)
    .select("id,quote_number")
    .single();

  if (insertError || !created) {
    return {
      ok: false,
      message: `No se pudo duplicar la cotización: ${
        insertError?.message ?? "Error desconocido"
      }`,
    };
  }

  await supabase.from("usage_events").insert({
    user_id: user.id,
    event_type: "quote_duplicated",
    module: "CAJA_LUZ",
    route: `/cotizaciones/${created.id}`,
    quote_id: created.id,
    metadata: {
      original_quote_id: original.id,
      original_quote_number: original.quote_number,
      new_quote_number: created.quote_number,
      title: newTitle,
      duplicated_by: user.email,
      role,
    },
  });

  revalidatePath("/cotizaciones");
  revalidatePath(`/cotizaciones/${quoteId}`);
  revalidatePath(`/cotizaciones/${created.id}`);
  revalidatePath("/admin");

  return {
    ok: true,
    id: created.id,
    quoteNumber: created.quote_number || newQuoteNumber,
    message: `Cotización duplicada como ${
      created.quote_number || newQuoteNumber
    }.`,
  };
}