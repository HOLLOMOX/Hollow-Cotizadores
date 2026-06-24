"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

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

type ConsumeRow = {
  role: string;
  cotizador_limit: number | null;
  cotizador_used: number;
  cotizador_remaining: number | null;
  can_use: boolean;
};

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