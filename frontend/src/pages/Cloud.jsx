import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  CalendarDays,
  Cloud,
  Gauge,
  Info,
  Pause,
  Play,
  Plus,
  Server,
  Timer,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useData } from "../store.jsx";
import { useNow } from "../lib/useLocalStorage.js";
import { PROVIDERS, cloudTotals, dailySeries, hourlyCost, isRunning, spentUntil, DAY } from "../lib/cloud.js";
import { money, monthKey, monthLabel, pct, uid } from "../lib/format.js";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ChartTooltip,
  Empty,
  IconButton,
  Input,
  PageTitle,
  Select,
} from "../components/ui.jsx";

const PROVIDER_COLORS = ["#7b6cf6", "#f69e7b", "#b6aafc", "#71717a", "#fcbc9f", "#5642c4", "#a1a1aa"];
const colorOf = (provider) => PROVIDER_COLORS[PROVIDERS.indexOf(provider) % PROVIDER_COLORS.length];

export default function CloudPage() {
  const { services, setServices, cloudSettings, setCloudSettings } = useData();
  const now = useNow(1000); // tick every second → "real time" counter
  const { currency, budget } = cloudSettings;
  const fmt = (v, d = 2) => money(v, currency, d);

  const t = cloudTotals(services, now);
  const bounds = t.bounds;
  const daysLeft = Math.ceil((bounds.end - now) / DAY);
  const budgetUse = budget > 0 ? t.spent / budget : 0;
  const projUse = budget > 0 ? t.projected / budget : 0;

  // The chart only needs to refresh once a minute
  const minute = Math.floor(now / 60_000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const series = useMemo(() => dailySeries(services, now), [services, minute]);

  const byProvider = useMemo(() => {
    const map = new Map();
    for (const s of services) map.set(s.provider, (map.get(s.provider) || 0) + spentUntil(s, bounds, now));
    return [...map.entries()].map(([name, value]) => ({ name, value })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services, minute]);

  const toggle = (id) =>
    setServices((list) =>
      list.map((s) => {
        if (s.id !== id) return s;
        const periods = isRunning(s)
          ? s.periods.map((p, i) => (i === s.periods.length - 1 ? { ...p, end: Date.now() } : p))
          : [...s.periods, { start: Date.now(), end: null }];
        return { ...s, periods };
      }),
    );

  return (
    <>
      <PageTitle title="Cloud" subtitle={`Custos estimados em tempo real · ${monthLabel(monthKey(now))}`}>
        <Badge tone="green" className="!px-3 !py-1">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          Ao vivo
        </Badge>
      </PageTitle>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Hero with ticking counter */}
        <Card hero className="flex flex-col justify-between gap-6 lg:col-span-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Gasto em cloud neste mês</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Calculado a partir do tempo ligado × preço de cada serviço</p>
            </div>
            <div className="grid w-full grid-cols-3 gap-3 sm:flex sm:w-auto sm:gap-8">
              <HeroStat icon={TrendingUp} label="Projeção" value={fmt(t.projected)} />
              <HeroStat icon={Gauge} label="Orçamento" value={budget > 0 ? fmt(budget, 0) : "—"} />
              <HeroStat icon={Timer} label="Por hora" value={fmt(t.perHour, 4)} />
            </div>
          </div>
          <div>
            <div className="font-mono text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
              {/* 5 decimals so the counter visibly moves every second */}
              {fmt(t.spent, 5)}
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              +{fmt(t.perSecond, 6)} por segundo · {services.filter(isRunning).length} serviço(s) ligados
            </p>
          </div>
          {budget > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                <span>{pct(budgetUse)} do orçamento usado</span>
                <span className={projUse > 1 ? "font-semibold text-rose-500" : ""}>
                  projeção: {pct(projUse)}
                </span>
              </div>
              {/* light bar = projection, solid bar = spent so far */}
              <div className="relative h-3 overflow-hidden rounded-full bg-white/70 dark:bg-surface/70">
                <div className="absolute inset-y-0 left-0 rounded-full bg-brand-200" style={{ width: `${Math.min(100, projUse * 100)}%` }} />
                <div
                  className={`absolute inset-y-0 left-0 rounded-full ${budgetUse > 1 ? "bg-rose-400" : "bg-brand-500"}`}
                  style={{ width: `${Math.min(100, budgetUse * 100)}%` }}
                />
              </div>
            </div>
          )}
        </Card>

        {/* Donut by provider */}
        <Card className="lg:col-span-4">
          <CardHeader icon={Cloud} title="Por provedor" subtitle="Gasto acumulado no mês" />
          {byProvider.length === 0 ? (
            <Empty>Nenhum gasto ainda.</Empty>
          ) : (
            <div className="flex items-center gap-4">
              <div className="size-36 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byProvider} dataKey="value" innerRadius={42} outerRadius={66} paddingAngle={3} stroke="none" isAnimationActive={false}>
                      {byProvider.map((p) => (
                        <Cell key={p.name} fill={colorOf(p.name)} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="min-w-0 flex-1 space-y-2 text-sm">
                {byProvider.map((p) => (
                  <li key={p.name} className="flex items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: colorOf(p.name) }} />
                    <span className="flex-1 truncate text-zinc-600 dark:text-zinc-300">{p.name}</span>
                    <b className="tabular-nums">{fmt(p.value)}</b>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* Cumulative chart */}
        <Card className="lg:col-span-8">
          <CardHeader
            icon={Activity}
            title="Gasto acumulado"
            subtitle="Linha cheia = real até agora · tracejada = projeção até o fim do mês"
            action={budget > 0 && <Badge tone={projUse > 1 ? "red" : "green"}>{projUse > 1 ? "vai estourar" : "dentro do orçamento"}</Badge>}
          />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ left: -10, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="realFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7b6cf6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#7b6cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#eee" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#a1a1aa" }} interval={4} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#a1a1aa" }}
                  domain={[0, (max) => Math.ceil(Math.max(max, budget || 0) * 1.1)]}
                />
                <Tooltip content={<ChartTooltip format={(v) => fmt(v)} labelFormat={(d) => `Dia ${d}`} />} />
                {budget > 0 && (
                  <ReferenceLine y={budget} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: "orçamento", fontSize: 11, fill: "#f43f5e", position: "insideTopLeft" }} />
                )}
                <Area dataKey="real" name="Real" stroke="#7b6cf6" strokeWidth={2.5} fill="url(#realFill)" isAnimationActive={false} />
                <Area dataKey="proj" name="Projeção" stroke="#f69e7b" strokeWidth={2} strokeDasharray="5 5" fill="transparent" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4 lg:col-span-4">
          <MiniStat icon={Server} label="Serviços ligados" value={`${services.filter(isRunning).length}/${services.length}`} />
          <MiniStat icon={CalendarDays} label="Dias restantes" value={daysLeft} />
          <MiniStat icon={Timer} label="Custo por dia" value={fmt(t.perHour * 24)} />
          <MiniStat icon={TrendingUp} label="Média/dia até agora" value={fmt(t.spent / Math.max(1, (now - bounds.start) / DAY))} />
        </div>

        <Services services={services} setServices={setServices} toggle={toggle} now={now} fmt={fmt} bounds={bounds} />

        <Settings settings={cloudSettings} setSettings={setCloudSettings} />
      </div>
    </>
  );
}

function HeroStat({ icon: Icon, label, value }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className="mt-1 text-sm font-semibold tracking-tight whitespace-nowrap tabular-nums sm:text-xl">{value}</div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <Card className="flex min-h-28 flex-col justify-between !p-4">
      <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className="text-right text-xl font-semibold tracking-tight tabular-nums">{value}</div>
    </Card>
  );
}

function Services({ services, setServices, toggle, now, fmt, bounds }) {
  const [form, setForm] = useState({ name: "", provider: "AWS", billing: "hourly", rate: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function add(e) {
    e.preventDefault();
    const rate = Number(String(form.rate).replace(",", "."));
    if (!form.name.trim() || !(rate >= 0) || form.rate === "") return;
    setServices((l) => [
      ...l,
      { id: uid(), name: form.name.trim(), provider: form.provider, billing: form.billing, rate, periods: [{ start: Date.now(), end: null }] },
    ]);
    setForm((f) => ({ ...f, name: "", rate: "" }));
  }

  const remove = (id) => confirm("Remover este serviço?") && setServices((l) => l.filter((s) => s.id !== id));

  return (
    <Card className="lg:col-span-8">
      <CardHeader icon={Server} title="Serviços" subtitle="Ligue/desligue para registrar quando cada recurso está rodando" />
      <form onSubmit={add} className="mb-4 flex flex-wrap gap-2">
        <Input className="min-w-0 flex-[2_1_160px]" placeholder="Ex.: API (EC2 t3.micro)" value={form.name} onChange={set("name")} />
        <Select className="flex-[1_1_110px]" value={form.provider} onChange={set("provider")}>
          {PROVIDERS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </Select>
        <Select className="flex-[1_1_110px]" value={form.billing} onChange={set("billing")}>
          <option value="hourly">por hora</option>
          <option value="monthly">por mês</option>
        </Select>
        <Input className="flex-[1_1_90px]" placeholder={form.billing === "hourly" ? "0.0208" : "20"} inputMode="decimal" value={form.rate} onChange={set("rate")} />
        <Button type="submit" variant="brand" className="!px-3">
          <Plus className="size-4" /> Adicionar
        </Button>
      </form>

      {services.length === 0 ? (
        <Empty>Cadastre seus serviços de cloud com o preço por hora ou por mês.</Empty>
      ) : (
        <div className="space-y-1">
          {services.map((s) => {
            const running = isRunning(s);
            const spent = spentUntil(s, bounds, now);
            return (
              <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl px-2 py-2 hover:bg-zinc-50 dark:hover:bg-white/5">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: colorOf(s.provider) }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{s.name}</span>
                  <span className="text-[11px] text-zinc-400">
                    {s.provider} · {fmt(s.rate, s.billing === "hourly" ? 4 : 2)}/{s.billing === "hourly" ? "h" : "mês"}
                    {s.billing === "monthly" && ` (≈ ${fmt(hourlyCost(s, bounds), 4)}/h)`}
                  </span>
                </span>
                <Badge tone={running ? "green" : "gray"}>{running ? "ligado" : "desligado"}</Badge>
                <span className="w-24 text-right text-sm font-semibold tabular-nums">{fmt(spent, 4)}</span>
                <span className="flex">
                  <IconButton title={running ? "Desligar" : "Ligar"} onClick={() => toggle(s.id)}>
                    {running ? <Pause className="size-4" /> : <Play className="size-4" />}
                  </IconButton>
                  <IconButton title="Remover" onClick={() => remove(s.id)}>
                    <Trash2 className="size-4" />
                  </IconButton>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function Settings({ settings, setSettings }) {
  return (
    <Card className="flex flex-col gap-4 lg:col-span-4">
      <CardHeader icon={Gauge} title="Configurações" subtitle="Moeda e limite mensal" />
      <label className="space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
        Moeda
        <Select value={settings.currency} onChange={(e) => setSettings((s) => ({ ...s, currency: e.target.value }))}>
          <option value="USD">Dólar (USD)</option>
          <option value="BRL">Real (BRL)</option>
          <option value="EUR">Euro (EUR)</option>
        </Select>
      </label>
      <label className="space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
        Orçamento mensal
        <Input
          type="number"
          min={0}
          value={settings.budget}
          onChange={(e) => setSettings((s) => ({ ...s, budget: Number(e.target.value) || 0 }))}
        />
      </label>
      <div className="flex gap-2 rounded-2xl bg-brand-50 dark:bg-brand-500/15 p-3 text-xs text-brand-700 dark:text-brand-200">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>
          Os valores são <b>estimativas</b> com base no preço cadastrado. Para o custo exato, o próximo passo é um
          backend lendo a API de billing (AWS Cost Explorer, GCP Billing export).
        </p>
      </div>
    </Card>
  );
}
