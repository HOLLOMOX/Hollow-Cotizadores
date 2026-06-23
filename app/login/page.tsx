import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import LoginClient from "./LoginClient";

async function signIn(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(
      `/login?error=${encodeURIComponent("Ingresa correo y contraseña")}`
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(
      `/login?error=${encodeURIComponent("Correo o contraseña incorrectos")}`
    );
  }

  redirect("/");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};

  return (
    <LoginClient
      error={params.error}
      message={params.message}
      signInAction={signIn}
    />
  );
}