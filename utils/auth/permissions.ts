import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type UserRole =
  | "admin"
  | "vendedor"
  | "produccion"
  | "viewer"
  | "invitado";

export type CurrentUserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  active: boolean;
  cotizador_limit: number | null;
  cotizador_used: number;
};

type ProfileRpcRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  active: boolean;
  cotizador_limit: number | null;
  cotizador_used: number | null;
};

export async function getCurrentUserProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      profile: null,
      supabase,
    };
  }

  const { data, error } = await supabase.rpc("get_my_profile");

  if (error) {
    console.error("get_my_profile error:", error.message);

    return {
      user,
      profile: null,
      supabase,
    };
  }

  const row = Array.isArray(data)
    ? (data[0] as ProfileRpcRow | undefined)
    : (data as ProfileRpcRow | undefined);

  if (!row) {
    return {
      user,
      profile: null,
      supabase,
    };
  }

  const profile: CurrentUserProfile = {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    role: row.role as UserRole,
    active: Boolean(row.active),
    cotizador_limit: row.cotizador_limit,
    cotizador_used: Number(row.cotizador_used ?? 0),
  };

  return {
    user,
    profile,
    supabase,
  };
}

export async function requireLogin() {
  const result = await getCurrentUserProfile();

  if (!result.user) {
    redirect("/login");
  }

  return result;
}

export async function getAdminAccess() {
  const result = await requireLogin();

  const allowed =
    result.profile?.active === true && result.profile.role === "admin";

  return {
    ...result,
    allowed,
  };
}

export async function getCatalogAccess() {
  const result = await requireLogin();

  const role = result.profile?.role;

  const allowed =
    result.profile?.active === true &&
    (role === "admin" || role === "vendedor");

  const canEdit =
    result.profile?.active === true && result.profile.role === "admin";

  return {
    ...result,
    allowed,
    canEdit,
  };
}

export async function requireAdmin() {
  const result = await requireLogin();

  if (!result.profile) {
    redirect("/");
  }

  if (result.profile.active === false) {
    redirect("/");
  }

  if (result.profile.role !== "admin") {
    redirect("/");
  }

  return result;
}

export function isAdminRole(role?: string | null) {
  return role === "admin";
}

export function canUseCotizadores(role?: string | null) {
  return (
    role === "admin" ||
    role === "vendedor" ||
    role === "produccion" ||
    role === "invitado"
  );
}

export function canViewCatalog(role?: string | null) {
  return role === "admin" || role === "vendedor";
}

export function canEditCatalog(role?: string | null) {
  return role === "admin";
}

export function canViewAdmin(role?: string | null) {
  return role === "admin";
}

export function canViewInternalCosts(role?: string | null) {
  return role === "admin" || role === "vendedor";
}

export function canViewProductionMaterials(role?: string | null) {
  return role === "admin" || role === "vendedor" || role === "produccion";
}

export function canViewSalePrice(role?: string | null) {
  return role === "admin" || role === "vendedor" || role === "invitado";
}

export function canViewUtility(role?: string | null) {
  return role === "admin" || role === "vendedor";
}