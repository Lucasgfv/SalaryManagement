import { useMemo, useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ArrowDownCircle,
  ArrowDownRight,
  ArrowUpCircle,
  BarChart3,
  CalendarClock,
  ArrowUpRight,
  Briefcase,
  CalendarX,
  Check,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  Plus,
  ReceiptText,
  Repeat,
  Shuffle,
  Trash2,
  Wallet,
} from "lucide-react";
import { useData } from "../store.jsx";
import { CATEGORIES, monthSummary } from "../lib/finance.js";
import { brl, money, monthKey, monthLabel, monthShort, pct, shiftMonth, uid } from "../lib/format.js";
import { Badge, Button, Card, CardHeader, ChartTooltip, Empty, IconButton, Input, Modal, Progress, Select, Tabs } from "../components/ui.jsx";

const cx = (...c) => c.filter(Boolean).join(" ");
const brl0 = (v) => money(v, "BRL", 0); // big numbers read better without cents

// Layout:
//   header (title · month pills · actions)
//   [ Saldo do mês (month nav + totals) .... ] [ Highlight card ]
//   [ Gastos por categoria ................. ] [ Contas fixas   ]
// Desktop: everything fits the viewport (rows share the height, lists scroll inside).
export default function Home() {
  const data = useData();
  const [month, setMonth] = useState(monthKey());
  const [entriesOpen, setEntriesOpen] = useState(false);

  const s = useMemo(() => monthSummary(data, month), [data, month]);
  const prev = useMemo(() => monthSummary(data, shiftMonth(month, -1)), [data, month]);

  return (
    <div className="flex flex-col gap-4 lg:h-full">
      <header className="flex shrink-0 flex-wrap items-center gap-3">
        <h1 className="mr-2 text-3xl font-semibold tracking-tight">Início</h1>
        <MonthPills month={month} setMonth={setMonth} />
        <div className="ml-auto flex gap-2">
          <Button variant="light" onClick={() => (location.hash = "#/freelas")}>
            <Briefcase className="size-4" /> Freelas
          </Button>
          <Button variant="dark" onClick={() => setEntriesOpen(true)}>
            <Plus className="size-4" /> Lançamento
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-12 lg:grid-rows-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Hero s={s} month={month} setMonth={setMonth} className="lg:col-span-8" />
        <Balance s={s} prev={prev} month={month} className="lg:col-span-4" />
        <Categories s={s} month={month} className="lg:col-span-8" />
        <FixedBills s={s} month={month} className="lg:col-span-4" />
      </div>

      <Modal open={entriesOpen} onClose={() => setEntriesOpen(false)} icon={ReceiptText} title="Lançamentos">
        <Entries s={s} month={month} />
      </Modal>
    </div>
  );
}

/* ---------- Period selector (like "Q3 · Q4 · Year") ---------- */
function MonthPills({ month, setMonth }) {
  const current = monthKey();
  const pill = (m) => (
    <button
      key={m}
      onClick={() => setMonth(m)}
      className={cx(
        "cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium capitalize transition",
        m === month ? "bg-[#1b1733] text-white dark:bg-brand-500" : "text-zinc-500 hover:text-ink dark:text-zinc-400",
      )}
    >
      {monthShort(m)}
      {m.slice(0, 4) !== current.slice(0, 4) && ` ${m.slice(2, 4)}`}
    </button>
  );
  return (
    <div className="flex items-center gap-0.5 rounded-full bg-white/70 p-1 shadow-sm dark:bg-surface/70">
      <IconButton onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Mês anterior" className="size-7">
        <ChevronLeft className="size-4" />
      </IconButton>
      {[-1, 0, 1].map((d) => pill(shiftMonth(month, d)))}
      <IconButton onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Próximo mês" className="size-7">
        <ChevronRight className="size-4" />
      </IconButton>
      {month !== current && (
        <button onClick={() => setMonth(current)} className="cursor-pointer px-2 text-xs text-brand-600 hover:underline dark:text-brand-300">
          hoje
        </button>
      )}
    </div>
  );
}

/* ---------- Saldo do mês: month nav, totals and where the income went ---------- */
function Hero({ s, month, setMonth, className }) {
  const base = Math.max(s.income, s.spent) || 1;
  const segments = [
    { key: "fixed", label: "Fixas", value: s.fixedTotal, cls: "bg-brand-500" },
    { key: "variable", label: "Variáveis", value: s.variableTotal, cls: "bg-peach-400" },
    { key: "free", label: "Sobra", value: Math.max(0, s.balance), cls: "bg-white/80 dark:bg-white/30" },
  ].filter((x) => x.value > 0);

  return (
    <Card hero className={cx("flex flex-col gap-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1">
            <IconButton onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Mês anterior">
              <ChevronLeft className="size-4" />
            </IconButton>
            <h2 className="text-lg font-semibold first-letter:uppercase">{monthLabel(month)}</h2>
            <IconButton onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Próximo mês">
              <ChevronRight className="size-4" />
            </IconButton>
            {month !== monthKey() && (
              <button onClick={() => setMonth(monthKey())} className="ml-1 cursor-pointer text-xs text-brand-600 hover:underline dark:text-brand-300">
                hoje
              </button>
            )}
          </div>
          <p className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">Saldo do mês: receitas menos despesas fixas e variáveis</p>
        </div>
        <div className="grid w-full grid-cols-3 gap-3 sm:flex sm:w-auto sm:gap-8">
          <HeroStat icon={ArrowUpCircle} label="Receita" value={brl(s.income)} />
          <HeroStat icon={ArrowDownCircle} label="Gastos" value={brl(s.spent)} />
          <HeroStat icon={PiggyBank} label="Guardou" value={pct(s.savingsRate)} />
        </div>
      </div>

      <div className={cx("text-4xl font-semibold tracking-tight sm:text-5xl", s.balance < 0 && "text-rose-500")}>
        {brl(s.balance)}
        <span className="ml-2 align-middle text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {s.balance < 0 ? "no vermelho" : "disponível"}
        </span>
      </div>

      {/* stacked bar: how the income was split */}
      <div className="mt-auto">
        <div className="mb-2 flex text-[11px] text-zinc-500 dark:text-zinc-400">
          {segments.map((seg) => (
            <div key={seg.key} style={{ width: `${(seg.value / base) * 100}%` }} className="min-w-0 truncate pr-2">
              {seg.label} · {pct(seg.value / base)}
            </div>
          ))}
        </div>
        <div className="flex h-3 gap-1 overflow-hidden rounded-full">
          {segments.map((seg) => (
            <div key={seg.key} className={`${seg.cls} rounded-full`} style={{ width: `${(seg.value / base) * 100}%` }} />
          ))}
          {segments.length === 0 && <div className="w-full rounded-full bg-white/70" />}
        </div>
        {s.freelanceTotal > 0 && (
          <p className="mt-2 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <Briefcase className="size-3" /> Receita inclui {brl(s.freelanceTotal)} de freelas
          </p>
        )}
        {s.balance < 0 && <p className="mt-2 text-xs font-medium text-rose-500">Gastos passaram a receita em {brl(-s.balance)}.</p>}
      </div>
    </Card>
  );
}

function HeroStat({ icon: Icon, label, value }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className="mt-1 text-sm font-semibold tracking-tight whitespace-nowrap sm:text-xl">{value}</div>
    </div>
  );
}

/* ---------- Saldo do mês: highlight card (the lime "Time to hire" card) ---------- */
const CAT_COLORS = ["#2d2466", "#6853e6", "#9888f8", "#f69e7b", "#fcbc9f"];

function Balance({ s, prev, month, className }) {
  const diff = s.balance - prev.balance;
  const top = s.byCategory.slice(0, 4);
  const rest = s.byCategory.slice(4).reduce((a, c) => a + c.total, 0);
  const parts = [...top, ...(rest > 0 ? [{ category: "Outros", total: rest }] : [])];
  const biggest = s.byCategory[0];

  return (
    <Card className={cx("flex flex-col !border-transparent bg-linear-to-br from-brand-200 to-peach-200 dark:from-[#3a2f78] dark:to-[#5b3427]", className)}>
      <h3 className="text-lg font-semibold">Saldo do mês</h3>
      <div className="mt-1 flex items-baseline gap-2">
        <span className={cx("text-5xl font-semibold tracking-tight", s.balance < 0 && "text-rose-600 dark:text-rose-300")}>
          {brl0(s.balance)}
        </span>
        <span className="text-sm text-ink/70">{s.balance < 0 ? "no vermelho" : "disponível"}</span>
      </div>
      {prev.income + prev.spent > 0 && (
        <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-lg bg-[#1b1733] px-2.5 py-1 text-xs font-medium text-white">
          {diff >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
          {brl0(Math.abs(diff))} {diff >= 0 ? "a mais" : "a menos"} que {monthShort(shiftMonth(month, -1))}
        </span>
      )}

      <div className="mt-auto pt-4">
        <div className="flex h-4 gap-1 overflow-hidden">
          {parts.map((p, i) => (
            <div key={p.category} className="rounded-sm" style={{ flexGrow: p.total, background: CAT_COLORS[i] }} title={p.category} />
          ))}
          {parts.length === 0 && <div className="flex-1 rounded-sm bg-white/50" />}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          {parts.map((p, i) => (
            <div key={p.category} className="flex items-center gap-1.5">
              <span className="size-2.5 shrink-0 rounded-sm" style={{ background: CAT_COLORS[i] }} />
              <span className="flex-1 truncate">{p.category}</span>
              <b>{brl0(p.total)}</b>
            </div>
          ))}
        </div>
        {biggest && (
          <p className="mt-3 border-t border-ink/10 pt-2.5 text-xs">
            Maior gasto: <b>{biggest.category}, {pct(biggest.total / s.spent)} do total</b>
          </p>
        )}
      </div>
    </Card>
  );
}

/* ---------- Gastos por categoria (horizontal bars) ---------- */
function Categories({ s, month, className }) {
  const max = s.byCategory[0]?.total || 1;
  const top = s.byCategory[0];
  return (
    <Card className={cx("flex flex-col", className)}>
      <CardHeader
        icon={BarChart3}
        title="Gastos por categoria"
        subtitle={`Fixas + variáveis · ${monthLabel(month)}`}
        action={<Badge tone="brand">{s.byCategory.length} categorias</Badge>}
      />
      {s.byCategory.length === 0 ? (
        <Empty>Sem gastos neste mês.</Empty>
      ) : (
        <div className="scroll-thin -mx-1 max-h-56 shrink-0 space-y-1.5 overflow-y-auto px-1 lg:max-h-none lg:min-h-12 lg:shrink">
          {s.byCategory.map((c, i) => {
            const last = i === s.byCategory.length - 1 && s.byCategory.length > 2;
            return (
              <div key={c.category} className="grid grid-cols-[90px_1fr_56px] items-center gap-3 sm:grid-cols-[110px_1fr_60px]">
                <span className="truncate text-sm text-zinc-600 dark:text-zinc-300">{c.category}</span>
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`h-5 shrink-0 rounded-md ${
                      last ? "bg-linear-to-r from-peach-200 to-peach-400" : "bg-linear-to-r from-brand-200 to-brand-400"
                    }`}
                    style={{ width: `${Math.max(4, (c.total / max) * 75)}%`, opacity: 1 - i * 0.06 }}
                  />
                  <span className="text-sm font-semibold whitespace-nowrap">{brl(c.total)}</span>
                </div>
                <span className="justify-self-end text-xs text-zinc-400">{pct(c.total / s.spent)}</span>
              </div>
            );
          })}
        </div>
      )}
      <History month={month} />
      {top && (
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          Maior gasto: <b className="text-ink">{top.category}</b> · {pct(top.total / s.spent)} do total
          {s.income > 0 && <> · {pct(top.total / s.income)} da receita</>}
        </p>
      )}
    </Card>
  );
}

/* ---------- Últimos 6 meses: income vs spending + balance line (inside the categories card) ---------- */
function History({ month }) {
  const data = useData();
  const rows = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const m = shiftMonth(month, i - 5);
        const s = monthSummary(data, m);
        return { label: monthShort(m), Receita: s.income, Gastos: s.spent, Saldo: s.balance };
      }),
    [data, month],
  );
  const avg = rows.reduce((a, r) => a + r.Saldo, 0) / rows.length;

  return (
    <div className="mt-3 flex min-h-44 flex-1 flex-col border-t lg:min-h-36 lg:basis-0 border-zinc-100 pt-3 dark:border-white/10">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <BarChart3 className="size-4 text-brand-500" />
        <span className="text-sm font-semibold">Últimos 6 meses</span>
        <span className="text-xs text-zinc-400">receita x gastos e saldo</span>
        <Badge tone={avg >= 0 ? "green" : "red"} className="ml-auto">
          média {brl(avg)}/mês
        </Badge>
      </div>
      {/* h-44 on mobile; on desktop the chart takes whatever height is left in the card */}
      <div className="h-44 lg:h-auto lg:min-h-0 lg:flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ left: -14, right: 4, top: 6 }}>
            <CartesianGrid vertical={false} stroke="#eee" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#a1a1aa" }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#a1a1aa" }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
            <Tooltip cursor={{ fill: "#f4f2ff" }} content={<ChartTooltip format={brl} />} />
            <Bar dataKey="Receita" fill="#9888f8" radius={[6, 6, 0, 0]} maxBarSize={22} />
            <Bar dataKey="Gastos" fill="#fcbc9f" radius={[6, 6, 0, 0]} maxBarSize={22} />
            <Line dataKey="Saldo" stroke="currentColor" strokeWidth={2} dot={{ r: 3 }} type="monotone" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ---------- Contas fixas: checklist of the month ---------- */
function FixedBills({ s, month, className }) {
  const { fixedPaid, setFixedPaid } = useData();
  const paid = fixedPaid[month] ?? [];
  const isCurrent = month === monthKey();
  const today = new Date().getDate();
  const items = [...s.fixedItems].sort((a, b) => a.dueDay - b.dueDay);
  const paidTotal = items.filter((f) => paid.includes(f.id)).reduce((a, f) => a + Number(f.amount), 0);

  const toggle = (id) =>
    setFixedPaid((all) => {
      const list = all[month] ?? [];
      return { ...all, [month]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] };
    });

  return (
    <Card className={cx("flex flex-col", className)}>
      <CardHeader
        icon={CalendarClock}
        title="Contas fixas"
        subtitle="Marque o que já foi pago"
        action={<Badge tone="green">{paid.filter((id) => items.some((f) => f.id === id)).length}/{items.length} pagas</Badge>}
      />
      <div className="scroll-thin -mx-1 max-h-72 min-h-0 flex-1 space-y-0.5 overflow-y-auto px-1 lg:max-h-none">
        {items.length === 0 && <Empty>Nenhuma despesa fixa. Adicione em “Lançamento”.</Empty>}
        {items.map((f) => {
          const done = paid.includes(f.id);
          const late = isCurrent && !done && f.dueDay < today;
          return (
            <button
              key={f.id}
              onClick={() => toggle(f.id)}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 text-left transition hover:bg-brand-50 dark:hover:bg-brand-500/15"
            >
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-md border ${
                  done ? "border-brand-500 bg-brand-500 text-white" : "border-zinc-300 bg-white dark:border-white/25 dark:bg-surface"
                }`}
              >
                {done && <Check className="size-3.5" strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-sm font-medium ${done ? "text-zinc-400 line-through" : ""}`}>{f.description}</span>
                <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                  vence dia {String(f.dueDay).padStart(2, "0")} · {f.category}
                  {late && <Badge tone="red" className="!py-0">atrasada</Badge>}
                </span>
              </span>
              <span className="text-sm font-semibold whitespace-nowrap">{brl(f.amount)}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>Pago {brl(paidTotal)}</span>
          <span>de {brl(s.fixedTotal)}</span>
        </div>
        <Progress value={s.fixedTotal ? paidTotal / s.fixedTotal : 0} />
      </div>
    </Card>
  );
}

/* ---------- Add/list entries: income, variable, fixed ---------- */
function Entries({ s, month }) {
  const { setIncomes, setVariable, setFixed } = useData();
  const [tab, setTab] = useState("variable");

  const lists = {
    income: s.incomeItems,
    variable: s.variableItems,
    fixed: s.fixedItems,
  };

  function remove(id) {
    if (tab === "income") setIncomes((l) => l.filter((x) => x.id !== id));
    if (tab === "variable") setVariable((l) => l.filter((x) => x.id !== id));
    if (tab === "fixed" && confirm("Apagar esta despesa fixa de TODOS os meses? (Para parar só daqui pra frente use 'encerrar')"))
      setFixed((l) => l.filter((x) => x.id !== id));
  }

  // Ending a fixed expense keeps it in past months but stops it after the viewed month.
  const endFixed = (id) => setFixed((l) => l.map((f) => (f.id === id ? { ...f, endMonth: month } : f)));

  return (
    <div className="flex flex-col">
      <p className="-mt-2 mb-3 text-xs text-zinc-500 dark:text-zinc-400 first-letter:uppercase">Registrando em {monthLabel(month)}</p>
      <Tabs
        className="mb-3 self-start"
        value={tab}
        onChange={setTab}
        options={[
          { value: "income", label: "Receitas", count: lists.income.length },
          { value: "variable", label: "Variáveis", count: lists.variable.length },
          { value: "fixed", label: "Fixas", count: lists.fixed.length },
        ]}
      />
      <EntryForm key={tab} tab={tab} month={month} />
      <div className="scroll-thin mt-3 max-h-80 space-y-0.5 overflow-y-auto">
        {lists[tab].length === 0 && <Empty>Nada lançado aqui ainda.</Empty>}
        {lists[tab].map((item) => (
          <div key={item.id} className="group flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-white/5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-300">
              {tab === "income" ? <Wallet className="size-4" /> : tab === "fixed" ? <Repeat className="size-4" /> : <Shuffle className="size-4" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{item.description}</span>
              <span className="text-[11px] text-zinc-400">
                {tab === "income" && (item.freelance ? "Freela" : "Receita")}
                {tab === "variable" && item.category}
                {tab === "fixed" && `${item.category} · dia ${item.dueDay}${item.endMonth ? ` · até ${monthLabel(item.endMonth, { month: "short", year: "2-digit" })}` : ""}`}
              </span>
            </span>
            <span className={`text-sm font-semibold ${tab === "income" ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
              {tab === "income" ? "+" : "−"} {brl(item.amount)}
            </span>
            <span className="flex opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
              {tab === "fixed" && !item.endMonth && (
                <IconButton title="Encerrar após este mês" onClick={() => endFixed(item.id)}>
                  <CalendarX className="size-4" />
                </IconButton>
              )}
              {item.freelance ? (
                <IconButton title="Editar na página Freelas" onClick={() => (location.hash = "#/freelas")}>
                  <Briefcase className="size-4" />
                </IconButton>
              ) : (
                <IconButton title="Apagar" onClick={() => remove(item.id)}>
                  <Trash2 className="size-4" />
                </IconButton>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EntryForm({ tab, month }) {
  const { setIncomes, setVariable, setFixed } = useData();
  const [form, setForm] = useState({ description: "", amount: "", category: tab === "fixed" ? "Moradia" : "Alimentação", dueDay: 10 });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function submit(e) {
    e.preventDefault();
    const amount = Number(String(form.amount).replace(",", "."));
    if (!form.description.trim() || !(amount > 0)) return;
    const base = { id: uid(), description: form.description.trim(), amount };
    if (tab === "income") setIncomes((l) => [...l, { ...base, month }]);
    if (tab === "variable") setVariable((l) => [...l, { ...base, month, category: form.category }]);
    if (tab === "fixed")
      setFixed((l) => [
        ...l,
        { ...base, category: form.category, dueDay: Math.min(31, Math.max(1, Number(form.dueDay) || 1)), startMonth: month, endMonth: null },
      ]);
    setForm((f) => ({ ...f, description: "", amount: "" }));
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap gap-2">
      <Input
        className="min-w-0 flex-[2_1_140px]"
        placeholder={tab === "income" ? "Ex.: Salário, freela" : tab === "fixed" ? "Ex.: Aluguel" : "Ex.: Mercado"}
        value={form.description}
        onChange={set("description")}
      />
      <Input className="flex-[1_1_90px]" placeholder="R$ 0,00" inputMode="decimal" value={form.amount} onChange={set("amount")} />
      {tab !== "income" && (
        <Select className="flex-[1_1_120px]" value={form.category} onChange={set("category")}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      )}
      {tab === "fixed" && (
        <Input className="w-20" type="number" min={1} max={31} title="Dia do vencimento" value={form.dueDay} onChange={set("dueDay")} />
      )}
      <Button type="submit" variant="brand" className="!px-3">
        <Plus className="size-4" /> Adicionar
      </Button>
    </form>
  );
}

