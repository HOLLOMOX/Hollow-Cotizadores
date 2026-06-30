import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  createClientRecord,
  deactivateClientRecord,
  updateClientRecord,
} from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ClientRow = {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  rfc: string | null;
  address: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
};

export default async function ClientesPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = String(params?.q ?? "").trim();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let query = supabase
    .from("clients")
    .select(
      "id,name,contact_name,phone,email,rfc,address,notes,active,created_at"
    )
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  const { data, error } = await query;

  const clients = (data ?? []) as ClientRow[];

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <section className="rounded-3xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-900 to-yellow-500/10 p-5 shadow-2xl shadow-black/20 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-400">
                Hollow Cotizadores
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
                Clientes
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">
                Registra clientes para vincularlos después con sus cotizaciones
                y tener historial por cliente.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/cotizadores/cajas-luz"
                className="rounded-2xl bg-yellow-400 px-5 py-3 text-center text-sm font-black uppercase tracking-wide text-neutral-950 transition hover:bg-yellow-300"
              >
                Nueva cotización
              </Link>

              <Link
                href="/cotizaciones"
                className="rounded-2xl border border-neutral-700 bg-neutral-950 px-5 py-3 text-center text-sm font-black uppercase tracking-wide text-neutral-200 transition hover:border-yellow-400 hover:text-yellow-300"
              >
                Historial
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5 shadow-2xl shadow-black/20">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-400">
              Nuevo cliente
            </p>

            <h2 className="mt-1 text-xl font-black">Registrar cliente</h2>

            <form action={createClientRecord} className="mt-5 space-y-4">
              <Field
                label="Nombre comercial / Cliente"
                name="name"
                placeholder="Ej. Farmacia Centro"
                required
              />

              <Field
                label="Contacto"
                name="contact_name"
                placeholder="Ej. Juan Pérez"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Teléfono" name="phone" placeholder="744..." />
                <Field label="Correo" name="email" placeholder="correo@..." />
              </div>

              <Field label="RFC" name="rfc" placeholder="Opcional" />

              <TextArea
                label="Dirección"
                name="address"
                placeholder="Dirección del cliente"
              />

              <TextArea
                label="Notas"
                name="notes"
                placeholder="Datos importantes, referencias, condiciones, etc."
              />

              <button
                type="submit"
                className="w-full rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black uppercase tracking-wide text-neutral-950 transition hover:bg-yellow-300"
              >
                Guardar cliente
              </button>
            </form>
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5">
              <form className="flex flex-col gap-3 sm:flex-row">
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Buscar por nombre..."
                  className="min-h-12 flex-1 rounded-2xl border border-neutral-700 bg-neutral-950 px-4 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-yellow-400"
                />

                <button
                  type="submit"
                  className="rounded-2xl border border-neutral-700 bg-neutral-950 px-5 py-3 text-sm font-black uppercase tracking-wide text-neutral-200 transition hover:border-yellow-400 hover:text-yellow-300"
                >
                  Buscar
                </button>

                {q && (
                  <Link
                    href="/clientes"
                    className="rounded-2xl border border-neutral-700 bg-neutral-950 px-5 py-3 text-center text-sm font-black uppercase tracking-wide text-neutral-200 transition hover:border-yellow-400 hover:text-yellow-300"
                  >
                    Limpiar
                  </Link>
                )}
              </form>
            </div>

            {error && (
              <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">
                Error al cargar clientes: {error.message}
              </div>
            )}

            {!error && clients.length === 0 && (
              <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-8 text-center">
                <p className="text-lg font-black">No hay clientes todavía</p>
                <p className="mt-2 text-sm text-neutral-400">
                  Registra el primer cliente para empezar a crear historial.
                </p>
              </div>
            )}

            <div className="grid gap-5">
              {clients.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ClientCard({ client }: { client: ClientRow }) {
  return (
    <article className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5 shadow-2xl shadow-black/20">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-400">
            Cliente
          </p>

          <h3 className="mt-1 break-words text-2xl font-black">
            {client.name}
          </h3>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Info label="Contacto" value={client.contact_name} />
            <Info label="Teléfono" value={client.phone} />
            <Info label="Correo" value={client.email} />
            <Info label="RFC" value={client.rfc} />
            <Info label="Fecha" value={formatDate(client.created_at)} />
          </div>

          {client.address && (
            <p className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-sm leading-6 text-neutral-300">
              <span className="font-bold text-white">Dirección: </span>
              {client.address}
            </p>
          )}

          {client.notes && (
            <p className="mt-3 rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-sm leading-6 text-neutral-300">
              <span className="font-bold text-white">Notas: </span>
              {client.notes}
            </p>
          )}
        </div>

        <form action={deactivateClientRecord}>
          <input type="hidden" name="id" value={client.id} />

          <button
            type="submit"
            className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs font-black uppercase tracking-wide text-red-200 transition hover:bg-red-500/20"
          >
            Desactivar
          </button>
        </form>
      </div>

      <details className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
        <summary className="cursor-pointer text-sm font-black uppercase tracking-wide text-neutral-300">
          Editar cliente
        </summary>

        <form action={updateClientRecord} className="mt-5 space-y-4">
          <input type="hidden" name="id" value={client.id} />

          <Field
            label="Nombre comercial / Cliente"
            name="name"
            defaultValue={client.name}
            required
          />

          <Field
            label="Contacto"
            name="contact_name"
            defaultValue={client.contact_name ?? ""}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Teléfono"
              name="phone"
              defaultValue={client.phone ?? ""}
            />
            <Field
              label="Correo"
              name="email"
              defaultValue={client.email ?? ""}
            />
          </div>

          <Field label="RFC" name="rfc" defaultValue={client.rfc ?? ""} />

          <TextArea
            label="Dirección"
            name="address"
            defaultValue={client.address ?? ""}
          />

          <TextArea
            label="Notas"
            name="notes"
            defaultValue={client.notes ?? ""}
          />

          <button
            type="submit"
            className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black uppercase tracking-wide text-neutral-950 transition hover:bg-yellow-300"
          >
            Guardar cambios
          </button>
        </form>
      </details>
    </article>
  );
}

function Field({
  label,
  name,
  placeholder,
  defaultValue,
  required = false,
}: {
  label: string;
  name: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-neutral-500">
        {label}
      </span>

      <input
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        className="mt-2 min-h-12 w-full rounded-2xl border border-neutral-700 bg-neutral-950 px-4 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-yellow-400"
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-neutral-500">
        {label}
      </span>

      <textarea
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        rows={3}
        className="mt-2 w-full resize-none rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-yellow-400"
      />
    </label>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold text-white">
        {value || "—"}
      </p>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}