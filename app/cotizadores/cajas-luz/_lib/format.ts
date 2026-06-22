export function toNumber(value: string | number, fallback = 0) {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export function money(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number.isFinite(value) ? value : 0);
}

export function fixed(value: number, decimals = 2) {
  return Number.isFinite(value) ? value.toFixed(decimals) : "0.00";
}