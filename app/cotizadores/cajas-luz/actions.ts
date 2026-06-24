"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { FormState, QuoteResult } from "./_lib/types";

export type ConsumeCotizadorResponse =
  | {
      ok: true;
      role: string;
      cotizadorLimit: number | null;
      cotizadorUsed: number;
      cotizadorRemaining: number | null;
      canUse: boolean;
    }
  | {
      ok: false;
      message: string;
    };

export type SaveQuoteResponse =
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

export type SaveQuotePayload = {
  form: FormState;
  result: QuoteResult;
};

type ConsumeRow = {
  role: string;
  cotizador_limit: number | null;
  cotizador_used: number;
  cotizador_remaining: number | null;
  can_use: boolean;
};

function safeNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function createQuoteNumber() {
  const now = new Date();

  const datePart = now.toISOString().slice(0, 10).replaceAll("-", "");
  const timePart = String(now.getTime()).slice(-6);

  return `CL-${datePart}-${timePart}`;
}

export async function consumeGuestCotizadorUse(): Promise<ConsumeCotizadorResponse> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      message: "Sesión expirada. Inicia sesión nuevamente.",
    };
  }

  const { data, error } = await supabase.rpc("consume_cotizador_use", {
    p_module: "CAJA_LUZ",
    p_route: "/cotizadores/cajas-luz",
  });

  if (error) {
    const msg = error.message || "";

    if (msg.toLowerCase().includes("límite")) {
      return {
        ok: false,
        message:
          "La cuenta invitada ya agotó sus 5 usos disponibles del cotizador.",
      };
    }

    if (msg.toLowerCase().includes("inactivo")) {
      return {
        ok: false,
        message: "Este usuario está inactivo.",
      };
    }

    return {
      ok: false,
      message: `No se pudo activar el uso del cotizador: ${msg}`,
    };
  }

  const row = Array.isArray(data)
    ? (data[0] as ConsumeRow | undefined)
    : (data as ConsumeRow | undefined);

  if (!row) {
    return {
      ok: false,
      message: "No se recibió respuesta del servidor.",
    };
  }

  revalidatePath("/cotizadores/cajas-luz");

  return {
    ok: true,
    role: row.role,
    cotizadorLimit: row.cotizador_limit,
    cotizadorUsed: row.cotizador_used,
    cotizadorRemaining: row.cotizador_remaining,
    canUse: row.can_use,
  };
}

export async function saveCajaLuzQuote(
  payload: SaveQuotePayload
): Promise<SaveQuoteResponse> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      message: "Sesión expirada. Inicia sesión nuevamente.",
    };
  }

  const form = payload.form;
  const result = payload.result;

  if (!form || !result) {
    return {
      ok: false,
      message: "No se recibió información suficiente para guardar.",
    };
  }

  const quoteNumber = createQuoteNumber();

  const insertPayload = {
    user_id: user.id,
    quote_type: "CAJA_LUZ",

    client_name: form.cliente || "Cliente nuevo",
    seller_name: form.vendedor || "",
    project_name: form.proyecto || "Caja de luz",
    quote_number: quoteNumber,

    form_data: form,
    result_data: result,
    material_lines: result.partidas ?? [],

    cost_direct: safeNumber(result.costos?.costoDirecto),
    price_without_tax: safeNumber(result.costos?.precioSinIva),
    tax_amount: safeNumber(result.costos?.iva),
    total_with_tax: safeNumber(result.costos?.totalConIva),
    utility_amount: safeNumber(result.costos?.utilidad),
    margin_percent: safeNumber(result.costos?.margenPorcentaje),

    status: "BORRADOR",
    notes: form.observaciones || null,
  };

  const { data, error } = await supabase
    .from("quotes")
    .insert(insertPayload)
    .select("id,quote_number")
    .single();

  if (error) {
    return {
      ok: false,
      message: `No se pudo guardar la cotización: ${error.message}`,
    };
  }

  await supabase.from("usage_events").insert({
    user_id: user.id,
    event_type: "quote_saved",
    module: "CAJA_LUZ",
    route: "/cotizadores/cajas-luz",
    quote_id: data.id,
    metadata: {
      quote_number: quoteNumber,
      client_name: insertPayload.client_name,
      seller_name: insertPayload.seller_name,
      project_name: insertPayload.project_name,
      total_with_tax: insertPayload.total_with_tax,
      price_without_tax: insertPayload.price_without_tax,
    },
  });

  revalidatePath("/cotizaciones");
  revalidatePath("/admin");

  return {
    ok: true,
    id: data.id,
    quoteNumber: data.quote_number || quoteNumber,
    message: `Cotización ${
      data.quote_number || quoteNumber
    } guardada correctamente.`,
  };
}