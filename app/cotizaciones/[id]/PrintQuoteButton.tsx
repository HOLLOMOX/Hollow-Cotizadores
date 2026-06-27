"use client";

export default function PrintQuoteButton() {
  function handlePrint() {
    window.print();
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="rounded-2xl border border-neutral-700 bg-neutral-950 px-5 py-3 text-center text-sm font-black uppercase tracking-wide text-neutral-200 transition hover:border-yellow-400 hover:text-yellow-300"
    >
      Imprimir cotización
    </button>
  );
}