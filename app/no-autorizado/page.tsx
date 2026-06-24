import Link from "next/link";
import { getCurrentUserProfile } from "@/utils/auth/permissions";

export default async function NoAutorizadoPage({
  searchParams,
}: {
  searchParams?: Promise<{
    reason?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const { profile, user } = await getCurrentUserProfile();

  const reason = params.reason;

  const message =
    reason === "inactive"
      ? "Tu usuario está inactivo o no tiene un perfil válido asignado."
      : "No tienes permisos suficientes para entrar a esta sección.";

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-red-500/30 bg-neutral-900 shadow-2xl shadow-red-950/30">
        <div className="border-b border-red-500/20 bg-red-950/40 p-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-red-500/40 bg-red-500/10 text-5xl">
            ⛔
          </div>

          <p className="mt-6 text-xs font-black uppercase tracking-[0.35em] text-red-400">
            Acceso no autorizado
          </p>

          <h1 className="mt-3 text-4xl font-black text-red-500">
            Permiso denegado
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-red-100/80">
            {message}
          </p>
        </div>

        <div className="space-y-4 p-6">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
              Información del usuario
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InfoRow label="Correo" value={user?.email ?? "Sin sesión"} />
              <InfoRow label="Rol" value={profile?.role ?? "Sin perfil"} />
              <InfoRow
                label="Estado"
                value={profile?.active ? "Activo" : "Inactivo / no válido"}
              />
              <InfoRow
                label="Sección"
                value="Solo administradores"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
            <p className="text-sm font-semibold leading-6 text-red-100">
              Esta sección está protegida. Si necesitas acceso, solicita al
              administrador que cambie tu rol a{" "}
              <span className="font-black text-red-300">admin</span>.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="flex-1 rounded-2xl bg-yellow-400 px-5 py-3 text-center text-sm font-black uppercase tracking-wide text-neutral-950 transition hover:bg-yellow-300"
            >
              Volver al inicio
            </Link>

            <Link
              href="/cotizadores/cajas-luz"
              className="flex-1 rounded-2xl border border-neutral-700 bg-neutral-950 px-5 py-3 text-center text-sm font-black uppercase tracking-wide text-neutral-200 transition hover:border-yellow-400 hover:text-yellow-300"
            >
              Ir al cotizador
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-bold text-white">{value}</p>
    </div>
  );
}