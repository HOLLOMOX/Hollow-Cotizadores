"use client";

import { useEffect, useState } from "react";

const REMEMBER_EMAIL_KEY = "hollow_login_email";

export default function LoginClient({
  error,
  message,
  signInAction,
}: {
  error?: string;
  message?: string;
  signInAction: (formData: FormData) => void | Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [rememberEmail, setRememberEmail] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const savedEmail = window.localStorage.getItem(REMEMBER_EMAIL_KEY);

    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
  }, []);

  function handleSubmit() {
    if (rememberEmail && email.trim()) {
      window.localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
    } else {
      window.localStorage.removeItem(REMEMBER_EMAIL_KEY);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="hidden border-r border-neutral-800 bg-neutral-900 lg:flex lg:flex-col lg:justify-between">
          <div className="p-10">
            <div className="inline-flex rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-yellow-300">
              Hollow Cotizadores
            </div>

            <h1 className="mt-8 max-w-xl text-5xl font-black leading-tight">
              Sistema interno de cotización para fabricación publicitaria.
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-neutral-400">
              Calcula cajas de luz, letras de canal, materiales, estructura,
              iluminación, instalación, utilidad y precio final desde una sola
              plataforma.
            </p>

            <div className="mt-10 grid gap-4">
              <FeatureCard
                title="Cotizadores"
                description="Cajas de luz, letras de canal, materiales, instalación y precio final."
              />

              <FeatureCard
                title="Catálogo de costos"
                description="Costos editables para mantener el sistema actualizado."
              />

              <FeatureCard
                title="Acceso seguro"
                description="Inicio de sesión privado con Supabase Auth."
              />
            </div>
          </div>

          <div className="border-t border-neutral-800 p-10">
            <p className="text-sm text-neutral-500">
              Acceso privado · Pantera Publicidad · Hollow Mox
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="inline-flex rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-yellow-300">
                Hollow Cotizadores
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl shadow-black/40 sm:p-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-400">
                  Iniciar sesión
                </p>

                <h2 className="mt-3 text-3xl font-black">
                  Bienvenido de nuevo
                </h2>

                <p className="mt-2 text-sm leading-6 text-neutral-400">
                  Ingresa con tu usuario autorizado. Puedes presionar{" "}
                  <span className="font-bold text-yellow-300">Enter</span> para
                  entrar.
                </p>
              </div>

              {error && (
                <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200">
                  {error}
                </div>
              )}

              {message && (
                <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-200">
                  {message}
                </div>
              )}

              <form
                action={signInAction}
                onSubmit={handleSubmit}
                className="mt-8 space-y-5"
              >
                <label className="grid gap-2 text-sm">
                  <span className="font-semibold text-neutral-300">
                    Correo electrónico
                  </span>

                  <input
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="usuario@empresa.com"
                    autoComplete="username email"
                    autoFocus
                    className="rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                  />
                </label>

                <label className="grid gap-2 text-sm">
                  <span className="font-semibold text-neutral-300">
                    Contraseña
                  </span>

                  <div className="flex overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-950 focus-within:border-yellow-400 focus-within:ring-2 focus-within:ring-yellow-400/20">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="min-w-0 flex-1 bg-transparent px-4 py-3 text-white outline-none"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="px-4 text-xs font-bold uppercase text-neutral-400 transition hover:text-yellow-300"
                    >
                      {showPassword ? "Ocultar" : "Ver"}
                    </button>
                  </div>
                </label>

                <div className="flex items-center justify-between gap-4">
                  <label className="flex items-center gap-3 text-sm text-neutral-300">
                    <input
                      type="checkbox"
                      checked={rememberEmail}
                      onChange={(event) =>
                        setRememberEmail(event.target.checked)
                      }
                      className="h-4 w-4"
                    />

                    Recordar usuario
                  </label>

                  <span className="text-xs text-neutral-500">
                    La contraseña la recuerda tu navegador
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-yellow-400 px-4 py-3 text-sm font-black uppercase tracking-wide text-neutral-950 transition hover:bg-yellow-300 active:scale-[0.99]"
                >
                  Entrar al sistema
                </button>
              </form>

              <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                <p className="text-xs leading-5 text-neutral-500">
                  Por seguridad, Hollow no guarda contraseñas en el navegador.
                  Si quieres recordar contraseña, acepta la opción de guardar
                  contraseña que ofrece Chrome, Edge o tu navegador.
                </p>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-neutral-600">
              Hollow Cotizadores · Acceso interno
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
      <h3 className="text-sm font-bold uppercase tracking-wide text-white">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-neutral-500">{description}</p>
    </div>
  );
}