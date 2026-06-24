import Link from "next/link";
import { requireAdmin } from "@/utils/auth/permissions";

type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  active: boolean;
  cotizador_limit: number | null;
  cotizador_used: number;
  created_at: string;
};

type PresenceRow = {
  user_id: string;
  route: string | null;
  module: string | null;
  status: string;
  last_seen: string;
};

type UsageRow = {
  id: string;
  event_type: string;
  module: string | null;
  route: string | null;
  created_at: string;
  user_profiles?: {
    email: string | null;
    full_name: string | null;
    role: string;
  } | null;
};

export default async function AdminPage() {
  const { supabase, profile } = await requireAdmin();

  const { data: users } = await supabase
    .from("user_profiles")
    .select(
      "id,email,full_name,role,active,cotizador_limit,cotizador_used,created_at"
    )
    .order("created_at", { ascending: false });

  const { count: quotesCount } = await supabase
    .from("quotes")
    .select("id", { count: "exact", head: true });

  const { count: usageCount } = await supabase
    .from("usage_events")
    .select("id", { count: "exact", head: true });

  const { count: activeUsersCount } = await supabase
    .from("user_presence")
    .select("user_id", { count: "exact", head: true })
    .gt("last_seen", new Date(Date.now() - 2 * 60 * 1000).toISOString());

  const { data: presence } = await supabase
    .from("user_presence")
    .select("user_id,route,module,status,last_seen")
    .order("last_seen", { ascending: false })
    .limit(20);

  const { data: usage } = await supabase
    .from("usage_events")
    .select(
      `
      id,
      event_type,
      module,
      route,
      created_at,
      user_profiles:user_id (
        email,
        full_name,
        role
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(20);

  const allUsers = (users ?? []) as UserProfile[];
  const guest = allUsers.find((item) => item.email === "invitado@hollow.mx");

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-400">
            Hollow Cotizadores
          </p>

          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black">Panel de administrador</h1>
              <p className="mt-2 text-sm text-neutral-400">
                Usuario: {profile?.email} · Rol: {profile?.role}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <AdminLink href="/" label="Inicio" />
              <AdminLink href="/cotizadores/cajas-luz" label="Cotizador cajas" />
              <AdminLink href="/catalogo-costos" label="Catálogo costos" />
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Usuarios"
            value={String(allUsers.length)}
            description="Usuarios registrados en user_profiles"
          />

          <MetricCard
            title="Activos ahora"
            value={String(activeUsersCount ?? 0)}
            description="Vistos en los últimos 2 minutos"
          />

          <MetricCard
            title="Cotizaciones"
            value={String(quotesCount ?? 0)}
            description="Cotizaciones guardadas"
          />

          <MetricCard
            title="Eventos"
            value={String(usageCount ?? 0)}
            description="Registros de uso del sistema"
          />
        </section>

        {guest && (
          <section className="rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-300">
              Cuenta invitado
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <MetricCard
                title="Correo"
                value={guest.email ?? "—"}
                description="Usuario demo"
              />

              <MetricCard
                title="Límite"
                value={String(guest.cotizador_limit ?? "∞")}
                description="Usos permitidos"
              />

              <MetricCard
                title="Usados"
                value={String(guest.cotizador_used ?? 0)}
                description="Usos consumidos"
              />

              <MetricCard
                title="Restantes"
                value={String(
                  guest.cotizador_limit === null
                    ? "∞"
                    : Math.max(
                        Number(guest.cotizador_limit) -
                          Number(guest.cotizador_used ?? 0),
                        0
                      )
                )}
                description="Usos disponibles"
              />
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-neutral-800 bg-neutral-900">
          <SectionTitle
            title="Usuarios"
            description="Roles, estado y límites de uso."
          />

          <div className="overflow-x-auto p-5">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-neutral-800 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="px-3 py-3">Correo</th>
                  <th className="px-3 py-3">Nombre</th>
                  <th className="px-3 py-3">Rol</th>
                  <th className="px-3 py-3">Activo</th>
                  <th className="px-3 py-3 text-right">Límite</th>
                  <th className="px-3 py-3 text-right">Usados</th>
                  <th className="px-3 py-3 text-right">Restantes</th>
                </tr>
              </thead>

              <tbody>
                {allUsers.map((user) => {
                  const remaining =
                    user.cotizador_limit === null
                      ? null
                      : Math.max(
                          Number(user.cotizador_limit) -
                            Number(user.cotizador_used ?? 0),
                          0
                        );

                  return (
                    <tr key={user.id} className="border-b border-neutral-800">
                      <td className="px-3 py-3 font-semibold text-white">
                        {user.email || "—"}
                      </td>
                      <td className="px-3 py-3 text-neutral-400">
                        {user.full_name || "—"}
                      </td>
                      <td className="px-3 py-3">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-3 py-3">
                        {user.active ? (
                          <span className="text-green-300">Activo</span>
                        ) : (
                          <span className="text-red-300">Inactivo</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right text-neutral-300">
                        {user.cotizador_limit ?? "∞"}
                      </td>
                      <td className="px-3 py-3 text-right text-neutral-300">
                        {user.cotizador_used ?? 0}
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-yellow-300">
                        {remaining ?? "∞"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900">
            <SectionTitle
              title="Usuarios activos"
              description="Última presencia registrada."
            />

            <div className="space-y-3 p-5">
              {((presence ?? []) as PresenceRow[]).length === 0 && (
                <EmptyState text="Todavía no hay presencia registrada." />
              )}

              {((presence ?? []) as PresenceRow[]).map((item) => (
                <div
                  key={item.user_id}
                  className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4"
                >
                  <p className="text-sm font-bold text-white">
                    {item.module || "Sin módulo"}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Ruta: {item.route || "—"}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Última vez: {formatDate(item.last_seen)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-neutral-900">
            <SectionTitle
              title="Últimos eventos"
              description="Uso reciente del sistema."
            />

            <div className="space-y-3 p-5">
              {((usage ?? []) as UsageRow[]).length === 0 && (
                <EmptyState text="Todavía no hay eventos registrados." />
              )}

              {((usage ?? []) as UsageRow[]).map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-bold text-white">
                      {item.event_type}
                    </p>

                    <span className="text-xs text-neutral-500">
                      {formatDate(item.created_at)}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-neutral-500">
                    Usuario: {item.user_profiles?.email || "—"}
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    Módulo: {item.module || "—"} · Ruta: {item.route || "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function AdminLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-2 text-sm font-bold text-neutral-200 transition hover:border-yellow-400 hover:text-yellow-300"
    >
      {label}
    </Link>
  );
}

function MetricCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
        {title}
      </p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-neutral-500">{description}</p>
    </div>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-neutral-800 p-5">
      <h2 className="text-lg font-black text-white">{title}</h2>
      <p className="mt-1 text-sm text-neutral-500">{description}</p>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const label = role || "sin rol";

  return (
    <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-bold uppercase text-yellow-300">
      {label}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 text-sm text-neutral-500">
      {text}
    </div>
  );
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}