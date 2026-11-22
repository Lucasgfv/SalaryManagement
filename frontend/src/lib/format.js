// Formatting + date helpers shared by every page.

export function money(value, currency = "BRL", digits = 2) {
  return (Number(value) || 0).toLocaleString(currency === "BRL" ? "pt-BR" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export const brl = (v) => money(v, "BRL");

export const pct = (v, digits = 0) => `${((Number(v) || 0) * 100).toFixed(digits)}%`;

// Month keys are "YYYY-MM" strings: they sort correctly with plain string comparison.
export function monthKey(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftMonth(key, delta) {
  const [y, m] = key.split("-").map(Number);
  return monthKey(new Date(y, m - 1 + delta, 1));
}

export function monthLabel(key, opts = { month: "long", year: "numeric" }) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", opts);
}

export const monthShort = (key) =>
  monthLabel(key, { month: "short" }).replace(".", "");

export const uid = () => crypto.randomUUID();

// Relative change between two numbers; null when there is no base to compare.
export function change(current, previous) {
  if (!previous) return null;
  return (current - previous) / Math.abs(previous);
}

export function timeAgo(iso) {
  if (!iso) return "nunca";
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "agora";
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  return `há ${Math.floor(s / 86400)} d`;
}
