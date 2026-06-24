import Link from "next/link";
import { getCurrentUserProfile } from "@/utils/auth/permissions";

export default async function AppTopBar() {
  const { user, profile } = await getCurrentUserProfile();

  const isLogged = Boolean(user);
  const role = profile?.role ?? "sin sesión";

  const canViewCotizaciones =
    role === "admin" ||
    role === "vendedor" ||
    role === "produccion" ||
    role === "viewer";

  const isAdmin = role === "admin";

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/95 px-4 py-3 text-white backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-yellow-500/40 bg-yellow-400 text-sm font-black text-neutral-950 shadow-lg shadow-yellow-950/20 transition group-hover:scale-105">
            HM
          </div>

          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-white transition group-hover:text-yellow-300">
              Hollow Mox
            </p>

            <p className="text-xs font-semibold text-neutral-500">
              Cotizadores
            </p>
          </div>
        </Link>

        {isLogged && (
          <nav className="flex flex-wrap items-center justify-end gap-2">
            <Link
              href="/"
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-bold uppercase tracking-wide text-neutral-300 transition hover:border-yellow-400 hover:text-yellow-300"
            >
              Inicio
            </Link>

            <Link
              href="/cotizadores/cajas-luz"
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-bold uppercase tracking-wide text-neutral-300 transition hover:border-yellow-400 hover:text-yellow-300"
            >
              Caja de luz
            </Link>

            {canViewCotizaciones && (
              <Link
                href="/cotizaciones"
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-bold uppercase tracking-wide text-neutral-300 transition hover:border-yellow-400 hover:text-yellow-300"
              >
                Cotizaciones
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/admin"
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-bold uppercase tracking-wide text-neutral-300 transition hover:border-yellow-400 hover:text-yellow-300"
              >
                Admin
              </Link>
            )}

            <form action="/logout" method="post">
              <button
                type="submit"
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-red-300 transition hover:border-red-400 hover:bg-red-500/20 hover:text-red-200"
              >
                Cerrar sesión
              </button>
            </form>
          </nav>
        )}
      </div>
    </header>
  );
}