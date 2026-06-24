import Link from "next/link";
import type { CurrentUserProfile } from "@/utils/auth/permissions";

export default function AccessDenied({
  profile,
  section = "Solo administradores",
}: {
  profile: CurrentUserProfile | null;
  section?: string;
}) {
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
            No tienes permisos suficientes para entrar a esta sección.
          </p>
        </div>

        <div className="space-y-4 p-6">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
              Información del usuario
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InfoRow label="Correo" value={profile?.email ?? "Sin perfil"} />
              <InfoRow label="Rol" value={profile?.role ?? "Sin perfil"} />
              <InfoRow
                label="Estado"
                value={profile?.active ? "Activo" : "Inactivo / no válido"}
              />
              <InfoRow label="Sección" value={section} />
            </div>
          </div>

          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
            <p className="text-sm font-semibold leading-6 text-red-100">
              Esta sección está protegida. Solo un usuario con rol{" "}
              <span className="font-black text-red-300">admin</span> puede
              entrar.
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