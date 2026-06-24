import Link from "next/link";
import { getCurrentUserProfile } from "@/utils/auth/permissions";

export default async function HomePage() {
  const { user, profile } = await getCurrentUserProfile();

  const isLogged = Boolean(user);
  const role = profile?.role ?? "sin sesión";

  const isAdmin = role === "admin";
  const isInvitado = role === "invitado";

  const canUseCotizadores =
    role === "admin" ||
    role === "vendedor" ||
    role === "produccion" ||
    role === "invitado";

  const canViewCotizaciones =
    role === "admin" ||
    role === "vendedor" ||
    role === "produccion" ||
    role === "viewer";

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-400">
            Hollow Cotizadores
          </p>

          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black">
                Panel principal
              </h1>

              <p className="mt-2 text-sm text-neutral-400">
                Sistema de cotización, historial y administración.
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                Usuario: {user?.email ?? "Sin sesión"} · Rol: {role}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {!isLogged ? (
                <TopButton href="/login" label="Iniciar sesión" />
              ) : (
                <>
                  <TopButton href="/cotizadores/cajas-luz" label="Caja de luz" />

                  {canViewCotizaciones && (
                    <TopButton href="/cotizaciones" label="Cotizaciones" />
                  )}

                  {isAdmin && <TopButton href="/admin" label="Admin" />}
                </>
              )}
            </div>
          </div>
        </header>

        {!isLogged && (
          <section className="rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-6">
            <h2 className="text-xl font-black text-yellow-300">
              Necesitas iniciar sesión
            </h2>

            <p className="mt-2 text-sm text-yellow-100/80">
              Entra con tu usuario para acceder a los cotizadores y al historial.
            </p>

            <Link
              href="/login"
              className="mt-5 inline-flex rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black uppercase tracking-wide text-neutral-950 transition hover:bg-yellow-300"
            >
              Iniciar sesión
            </Link>
          </section>
        )}

        {isLogged && (
          <section className="grid gap-6 lg:grid-cols-3">
            {canUseCotizadores && (
              <MenuDropdown
                title="Cotizadores"
                description={
                  isInvitado
                    ? "Acceso invitado limitado."
                    : "Herramientas para calcular proyectos."
                }
                icon="🧮"
              >
                <DropdownLink
                  href="/cotizadores/cajas-luz"
                  title="Cajas de luz"
                  description="Cotizador maestro de cajas de luz."
                />

                {!isInvitado && (
                  <DropdownLink
                    href="/cotizadores"
                    title="Menú de cotizadores"
                    description="Vista general de cotizadores disponibles."
                  />
                )}
              </MenuDropdown>
            )}

            {canViewCotizaciones && (
              <MenuDropdown
                title="Cotizaciones"
                description="Historial, detalle y control de estados."
                icon="📄"
              >
                <DropdownLink
                  href="/cotizaciones"
                  title="Historial de cotizaciones"
                  description="Ver cotizaciones guardadas."
                />

                <DropdownLink
                  href="/cotizadores/cajas-luz"
                  title="Nueva cotización de caja de luz"
                  description="Crear y guardar una nueva cotización."
                />
              </MenuDropdown>
            )}

            {isAdmin && (
              <MenuDropdown
                title="Administración"
                description="Usuarios, permisos, costos y uso del sistema."
                icon="⚙️"
              >
                <DropdownLink
                  href="/admin"
                  title="Panel administrador"
                  description="Usuarios, invitado y actividad."
                />

                <DropdownLink
                  href="/catalogo-costos"
                  title="Catálogo de costos"
                  description="Modificar SKUs, costos y materiales."
                />
              </MenuDropdown>
            )}

            {isInvitado && (
              <MenuCard
                href="/cotizadores/cajas-luz"
                title="Acceso invitado"
                description="Usar cotizador limitado a los usos disponibles."
                icon="👤"
              />
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function TopButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-2 text-sm font-bold text-neutral-200 transition hover:border-yellow-400 hover:text-yellow-300"
    >
      {label}
    </Link>
  );
}

function MenuDropdown({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded-3xl border border-neutral-800 bg-neutral-900 p-6 transition hover:border-yellow-400">
      <summary className="cursor-pointer list-none">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-500/10 text-3xl">
              {icon}
            </div>

            <h2 className="mt-5 text-xl font-black text-white">
              {title}
            </h2>

            <p className="mt-2 text-sm leading-6 text-neutral-400">
              {description}
            </p>
          </div>

          <span className="mt-2 rounded-full border border-neutral-700 bg-neutral-950 px-3 py-1 text-xs font-black text-yellow-300 transition group-open:rotate-180">
            ▼
          </span>
        </div>
      </summary>

      <div className="mt-5 space-y-3 border-t border-neutral-800 pt-5">
        {children}
      </div>
    </details>
  );
}

function DropdownLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-neutral-800 bg-neutral-950 p-4 transition hover:border-yellow-400 hover:bg-neutral-800"
    >
      <p className="text-sm font-black text-white">{title}</p>
      <p className="mt-1 text-xs leading-5 text-neutral-500">{description}</p>
    </Link>
  );
}

function MenuCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 transition hover:border-yellow-400 hover:bg-neutral-800"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-500/10 text-3xl">
        {icon}
      </div>

      <h2 className="mt-5 text-xl font-black text-white">{title}</h2>

      <p className="mt-2 text-sm leading-6 text-neutral-400">
        {description}
      </p>
    </Link>
  );
}