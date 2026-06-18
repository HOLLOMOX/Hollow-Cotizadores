export default function LetrasCanalPage() {
  return (
    <main className="min-h-screen bg-neutral-950 p-6 text-white">
      <div className="mx-auto max-w-5xl">
        <a href="/" className="text-sm text-neutral-400 hover:text-white">
          ← Volver
        </a>

        <h1 className="mt-6 text-3xl font-semibold">
          Cotizador de letras de canal
        </h1>

        <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-neutral-400">
            Aquí irá el cálculo de letras, LEDs, fuentes Pantera y validación de diseño.
          </p>
        </div>
      </div>
    </main>
  );
}