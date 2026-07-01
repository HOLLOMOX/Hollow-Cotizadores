"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  createClientFromCotizador,
  listClientsForCotizador,
  type CotizadorClientOption,
} from "./clientActions";

type ClientPickerProps = {
  selectedClientId: string;
  clientName: string;
  onChange: (data: {
    clientId: string;
    clientName: string;
    phone?: string;
    email?: string;
    rfc?: string;
    address?: string;
  }) => void;
};

type NewClientForm = {
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  rfc: string;
  address: string;
  notes: string;
};

const emptyClientForm: NewClientForm = {
  name: "",
  contact_name: "",
  phone: "",
  email: "",
  rfc: "",
  address: "",
  notes: "",
};

export default function ClientPicker({
  selectedClientId,
  clientName,
  onChange,
}: ClientPickerProps) {
  const [clients, setClients] = useState<CotizadorClientOption[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewClientForm>(emptyClientForm);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let mounted = true;

    async function loadClients() {
      setLoadingClients(true);

      const response = await listClientsForCotizador();

      if (!mounted) return;

      if (!response.ok) {
        setError(response.error || "No se pudieron cargar los clientes.");
        setClients([]);
      } else {
        setClients(response.clients);
      }

      setLoadingClients(false);
    }

    loadClients();

    return () => {
      mounted = false;
    };
  }, []);

  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => a.name.localeCompare(b.name));
  }, [clients]);

  function handleSelect(value: string) {
    if (value === "__new__") {
      setOpen(true);
      return;
    }

    if (value === "") {
      onChange({
        clientId: "",
        clientName: "",
        phone: "",
        email: "",
        rfc: "",
        address: "",
      });
      return;
    }

    const client = sortedClients.find((item) => item.id === value);

    if (!client) return;

    onChange({
      clientId: client.id,
      clientName: client.name,
      phone: client.phone ?? "",
      email: client.email ?? "",
      rfc: client.rfc ?? "",
      address: client.address ?? "",
    });
  }

  function updateField(name: keyof NewClientForm, value: string) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleCreateClient() {
    setError("");

    startTransition(async () => {
      const response = await createClientFromCotizador(form);

      if (!response.ok || !response.client) {
        setError(response.error || "No se pudo guardar el cliente.");
        return;
      }

      setClients((prev) => [response.client!, ...prev]);

      onChange({
        clientId: response.client.id,
        clientName: response.client.name,
        phone: response.client.phone ?? "",
        email: response.client.email ?? "",
        rfc: response.client.rfc ?? "",
        address: response.client.address ?? "",
      });

      setForm(emptyClientForm);
      setOpen(false);
    });
  }

  return (
    <>
      <div className="space-y-4 rounded-3xl border border-neutral-800 bg-neutral-950 p-4">
        {error && !open && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-200">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs font-black uppercase tracking-wide text-neutral-500">
            Cliente registrado
          </label>

          <select
            value={selectedClientId}
            onChange={(event) => handleSelect(event.target.value)}
            className="mt-2 min-h-12 w-full rounded-2xl border border-neutral-700 bg-neutral-900 px-4 text-sm font-bold text-white outline-none transition focus:border-yellow-400"
          >
            <option value="">
              {loadingClients
                ? "Cargando clientes..."
                : "Cliente manual / sin registrar"}
            </option>

            {sortedClients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
                {client.phone ? ` · ${client.phone}` : ""}
              </option>
            ))}

            <option value="__new__">+ Crear nuevo cliente</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-black uppercase tracking-wide text-neutral-500">
            Nombre del cliente
          </label>

          <input
            name="cliente"
            value={clientName}
            onChange={(event) =>
              onChange({
                clientId: selectedClientId,
                clientName: event.target.value,
              })
            }
            placeholder="Ej. Farmacia Centro"
            className="mt-2 min-h-12 w-full rounded-2xl border border-neutral-700 bg-neutral-900 px-4 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-yellow-400"
          />
        </div>

        <input type="hidden" name="clientId" value={selectedClientId} />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-neutral-800 bg-neutral-950 p-5 text-white shadow-2xl shadow-black/60">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-400">
                  Nuevo cliente
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Registrar cliente
                </h2>

                <p className="mt-1 text-sm leading-6 text-neutral-400">
                  Se guardará en tu base de clientes y quedará seleccionado en
                  esta cotización.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm font-black text-neutral-300 transition hover:border-red-400 hover:text-red-300"
              >
                Cerrar
              </button>
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">
                {error}
              </div>
            )}

            <div className="mt-5 grid gap-4">
              <ModalField
                label="Nombre comercial / Cliente"
                value={form.name}
                onChange={(value) => updateField("name", value)}
                placeholder="Ej. Farmacia Centro"
                required
              />

              <ModalField
                label="Contacto"
                value={form.contact_name}
                onChange={(value) => updateField("contact_name", value)}
                placeholder="Ej. Juan Pérez"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <ModalField
                  label="Teléfono"
                  value={form.phone}
                  onChange={(value) => updateField("phone", value)}
                  placeholder="744..."
                />

                <ModalField
                  label="Correo"
                  value={form.email}
                  onChange={(value) => updateField("email", value)}
                  placeholder="correo@..."
                />
              </div>

              <ModalField
                label="RFC"
                value={form.rfc}
                onChange={(value) => updateField("rfc", value)}
                placeholder="Opcional"
              />

              <ModalTextArea
                label="Dirección"
                value={form.address}
                onChange={(value) => updateField("address", value)}
                placeholder="Dirección del cliente"
              />

              <ModalTextArea
                label="Notas"
                value={form.notes}
                onChange={(value) => updateField("notes", value)}
                placeholder="Datos importantes del cliente"
              />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-2xl border border-neutral-700 bg-neutral-900 px-5 py-3 text-sm font-black uppercase tracking-wide text-neutral-300 transition hover:border-red-400 hover:text-red-300"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleCreateClient}
                disabled={isPending}
                className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black uppercase tracking-wide text-neutral-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Guardando..." : "Guardar cliente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ModalField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-neutral-500">
        {label}
        {required ? " *" : ""}
      </span>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 min-h-12 w-full rounded-2xl border border-neutral-700 bg-neutral-900 px-4 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-yellow-400"
      />
    </label>
  );
}

function ModalTextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-neutral-500">
        {label}
      </span>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="mt-2 w-full resize-none rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-yellow-400"
      />
    </label>
  );
}