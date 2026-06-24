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

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id,email,full_name,role,active,cotizador_limit,cotizador_used")
    .eq("id", user.id)
    .single();

  return {
    user,
    profile: profile as CurrentUserProfile | null,
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

export async function requireAdmin() {
  const result = await requireLogin();

  if (!result.profile || result.profile.active === false) {
    redirect("/no-autorizado?reason=inactive");
  }

  if (result.profile.role !== "admin") {
    redirect("/no-autorizado?reason=admin");
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
  return role === "admin";
}

export function canViewAdmin(role?: string | null) {
  return role === "admin";
}