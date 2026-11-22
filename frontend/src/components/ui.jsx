// Small design-system pieces reused by every page (glass cards, stat tiles, pills, inputs).
import { useEffect } from "react";
import { ArrowDownRight, ArrowUpRight, X } from "lucide-react";

const cx = (...c) => c.filter(Boolean).join(" ");

export function Card({ className, hero = false, children, ...props }) {
  return (
    <div
      className={cx(
        "rounded-3xl border border-white/80 dark:border-white/5 p-5 shadow-[0_12px_40px_-16px_rgba(90,70,180,0.22)] dark:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.6)] backdrop-blur-xl",
        hero
          ? "bg-linear-to-r from-[#e3dcff] via-[#f0ebff] to-[#ffe2d3] dark:from-[#2b2350] dark:via-[#221d38] dark:to-[#3b2820]"
          : "bg-white/75 dark:bg-surface/75",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="size-4 text-brand-500" />}
          <h3 className="font-semibold">{title}</h3>
        </div>
        {subtitle && <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// Tile like "Interviews today" in the reference: label on top, change + big number below.
export function StatCard({ icon: Icon, label, value, delta, goodWhenUp = true, hint = "vs. mês passado" }) {
  const has = delta !== null && delta !== undefined && Number.isFinite(delta);
  const up = delta >= 0;
  const good = up === goodWhenUp;
  return (
    <Card className="flex flex-col justify-between gap-2 !p-3.5">
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          {Icon && <Icon className="size-3.5" />}
          {label}
        </span>
        <ArrowUpRight className="size-3.5 text-zinc-400" />
      </div>
      <div className="flex flex-wrap items-end justify-between gap-x-2">
        <div className="text-[11px] leading-tight text-zinc-400">
          {hint}
          {/* delta === undefined → tile without comparison (no change line) */}
          {delta !== undefined && <div
            className={cx(
              "mt-0.5 flex items-center font-semibold",
              !has ? "text-zinc-400" : good ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500",
            )}
          >
            {has ? (
              <>
                {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                {Math.abs(delta * 100).toFixed(0)}%
              </>
            ) : (
              "—"
            )}
          </div>}
        </div>
        <div className="text-lg font-semibold tracking-tight whitespace-nowrap xl:text-xl">{value}</div>
      </div>
    </Card>
  );
}

const TONES = {
  brand: "bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-200",
  green: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  red: "bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400",
  amber: "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300",
  peach: "bg-peach-100 dark:bg-peach-500/15 text-peach-500",
  gray: "bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300",
};

export function Badge({ tone = "gray", className, children }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const BTN = {
  dark: "bg-ink dark:bg-brand-500 text-white hover:bg-zinc-800 dark:hover:bg-brand-600",
  brand: "bg-brand-500 text-white hover:bg-brand-600",
  light: "bg-white dark:bg-surface text-ink border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5",
  ghost: "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-ink",
};

export function Button({ variant = "dark", className, children, ...props }) {
  return (
    <button
      className={cx(
        "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        BTN[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({ className, children, ...props }) {
  return (
    <button
      className={cx(
        "inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

const field =
  "w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white/90 dark:bg-surface/90 px-3 py-2 text-sm outline-none transition placeholder:text-zinc-400 focus:border-brand-300 focus:ring-4 focus:ring-brand-100 dark:focus:ring-brand-500/20";

export const Input = ({ className, ...p }) => <input className={cx(field, className)} {...p} />;
export const Textarea = ({ className, ...p }) => <textarea className={cx(field, className)} {...p} />;
export const Select = ({ className, children, ...p }) => (
  <select className={cx(field, "cursor-pointer", className)} {...p}>
    {children}
  </select>
);

// Pill tab group, same look as the navbar.
export function Tabs({ value, onChange, options, className }) {
  return (
    <div className={cx("inline-flex flex-wrap gap-1 rounded-full bg-zinc-100/80 dark:bg-white/10 p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            "cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition",
            value === o.value ? "bg-white dark:bg-surface text-ink shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-ink",
          )}
        >
          {o.label}
          {o.count !== undefined && <span className="ml-1 text-zinc-400">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

// `color` (any CSS color) overrides `tone` — used by the language bars.
export function Progress({ value, tone = "brand", color: custom, className }) {
  const color = tone === "red" ? "bg-rose-400" : tone === "peach" ? "bg-peach-400" : "bg-brand-500";
  return (
    <div className={cx("h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10", className)}>
      <div
        className={cx("h-full rounded-full transition-all duration-500", !custom && color)}
        style={{ width: `${Math.min(100, Math.max(0, value * 100))}%`, background: custom }}
      />
    </div>
  );
}

export function Empty({ children }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-white/10 p-6 text-center text-sm text-zinc-400">
      {children}
    </div>
  );
}

export function PageTitle({ title, subtitle, children }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

// Shared chart tooltip in the card style
export function ChartTooltip({ active, payload, label, format = (v) => v, labelFormat = (l) => l }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-zinc-100 dark:border-white/10 bg-white/95 dark:bg-surface/95 px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-semibold">{labelFormat(label)}</div>
      {payload
        .filter((p) => p.value !== null && p.value !== undefined)
        .map((p) => (
          <div key={p.dataKey} className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
            <span className="size-2 rounded-full" style={{ background: p.color }} />
            {p.name}: <b className="text-ink">{format(p.value)}</b>
          </div>
        ))}
    </div>
  );
}

// Centered dialog over a blurred backdrop. Closes on Esc or clicking outside.
export function Modal({ open, onClose, title, icon, className, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/30 p-4 backdrop-blur-sm sm:items-center dark:bg-black/50" onClick={onClose}>
      <Card className={cx("w-full max-w-xl bg-white/95 dark:bg-surface", className)} onClick={(e) => e.stopPropagation()}>
        <CardHeader
          icon={icon}
          title={title}
          action={
            <IconButton onClick={onClose} aria-label="Fechar">
              <X className="size-4" />
            </IconButton>
          }
        />
        {children}
      </Card>
    </div>
  );
}

// Field with a small label on top (forms in modals/pages)
export function Field({ label, className, children }) {
  return (
    <label className={cx("flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400", className)}>
      {label}
      {children}
    </label>
  );
}

export const initials = (name) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

// Round avatar with the initials of a name (clients, freelas)
export function Avatar({ name, small }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-linear-to-br from-brand-200 to-peach-200 font-semibold text-brand-700 dark:from-brand-500/40 dark:to-peach-500/40 dark:text-white ${
        small ? "size-6 text-[10px]" : "size-14 text-base"
      }`}
    >
      {initials(name)}
    </span>
  );
}

// 10 small blocks filled proportionally (same look as the score bars in the reference)
export function Segments({ value, count = 10 }) {
  const filled = Math.round(Math.min(1, Math.max(0, value)) * count);
  return (
    <div className="flex gap-1">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={`h-2 flex-1 rounded-sm ${i < filled ? "bg-brand-500" : "bg-zinc-200 dark:bg-white/10"}`}
          style={i < filled ? { opacity: 0.45 + (0.55 * (i + 1)) / filled } : undefined}
        />
      ))}
    </div>
  );
}
