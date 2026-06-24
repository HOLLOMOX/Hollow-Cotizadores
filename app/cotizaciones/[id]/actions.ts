"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserProfile } from "@/utils/auth/permissions";

export type QuoteStatus =
  | "BORRADOR"
  | "ENVIADA"
  | "APROBADA"
  | "RECHAZADA"
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

const VALID_STATUSES: QuoteStatus[] = [
  "BORRADOR",
  "ENVIADA",
  "APROBADA",
  "RECHAZADA",
  "CANCELADA",
];

type QuoteRow = {
  id: string;
  user_id: string | null;
  quote_number: string | null;
  title: string | null;
  status: string | null;
};

export async function updateQuoteStatus(
  quoteId: string,
  nextStatus: QuoteStatus
): Promise<UpdateQuoteStatusResponse> {
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

  if (!VALID_STATUSES.includes(nextStatus)) {
    return {
      ok: false,
      message: "Estado no válido.",
    };
  }

  if (profile.role === "invitado" || profile.role === "viewer") {
    return {
      ok: false,
      message: "Tu rol no puede cambiar estados de cotizaciones.",
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

  const quote = quoteData as QuoteRow;
  const isAdmin = profile.role === "admin";
  const isOwner = quote.user_id === user.id;

  if (!isAdmin && !isOwner) {
    return {
      ok: false,
      message: "No tienes permiso para modificar esta cotización.",
    };
  }

  const previousStatus = quote.status ?? "BORRADOR";

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
      role: profile.role,
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