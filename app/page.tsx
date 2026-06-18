const cotizadores = [
  {
    nombre: "Cajas de luz",
    descripcion: "Cotizador para cajas de luz, bastidores iluminados y anuncios.",
    href: "/cotizadores/cajas-luz",
    activo: true,
  },
  {
    nombre: "Letras de canal",
    descripcion: "Cotizador para letras volumétricas, LEDs, fuentes y herrajes.",
    href: "/cotizadores/letras-canal",
    activo: true,
  },
  {
    nombre: "Bastidores",
    descripcion: "Próximamente.",
    href: "#",
    activo: false,
  },
  {
    nombre: "Vinil",
    descripcion: "Próximamente.",
    href: "#",
    activo: false,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-12">
        <div className="mb-10">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-neutral-400">
            H O L L O W
          </p>

          <h1 className="text-4xl font-semibold md:text-6xl">
            Hollow Cotizadores
          </h1>

          <p className="mt-4 max-w-2xl text-neutral-400">
            Plataforma interna para crear cotizaciones de cajas de luz,
            letras de canal y próximos productos.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {cotizadores.map((item) => (
            <a
              key={item.nombre}
              href={item.activo ? item.href : "#"}
              className={`rounded-2xl border p-6 transition ${
                item.activo
                  ? "border-neutral-700 bg-neutral-900 hover:border-white"
                  : "border-neutral-800 bg-neutral-900/50 opacity-50"
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-medium">{item.nombre}</h2>

                <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs text-neutral-300">
                  {item.activo ? "Activo" : "Próximamente"}
                </span>
              </div>

              <p className="text-sm text-neutral-400">{item.descripcion}</p>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}