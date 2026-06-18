import { login } from "./actions";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
        <p className="mb-3 text-sm uppercase tracking-[0.3em] text-neutral-500">
          Hollow Cotizadores
        </p>

        <h1 className="text-3xl font-semibold">Iniciar sesión</h1>

        <p className="mt-2 text-sm text-neutral-400">
          Acceso interno para cotizadores de Pantera.
        </p>

        <form action={login} className="mt-8 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-neutral-300">
              Correo
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-white"
              placeholder="admin@hollow.mx"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-neutral-300">
              Contraseña
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-white px-4 py-3 font-medium text-neutral-950 transition hover:bg-neutral-200"
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}