import { redirect } from "next/navigation";
import { requireAdmin } from "@/utils/auth/permissions";

export default async function CatalogoRedirectPage() {
  await requireAdmin();
  redirect("/catalogo-costos");
}