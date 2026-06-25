import { redirect } from "next/navigation";
import AccessDenied from "@/components/AccessDenied";
import { getCatalogAccess } from "@/utils/auth/permissions";

export default async function CatalogoRedirectPage() {
  const { profile, allowed } = await getCatalogAccess();

  if (!allowed) {
    return <AccessDenied profile={profile} section="Catálogo de costos" />;
  }

  redirect("/catalogo-costos");
}