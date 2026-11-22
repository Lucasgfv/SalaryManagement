import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BookOpen, CalendarDays, Info, ListPlus, Plus, Search, Target, Trash2 } from "lucide-react";
import { useData } from "../store.jsx";
import { uid } from "../lib/format.js";
import { COVERAGE_GOAL, estimatedCoverage, parseBulk, weekStart } from "../lib/languages.js";
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
  Progress,
  Textarea,
} from "../components/ui.jsx";

const WEEK = 7 * 24 * 60 * 60 * 1000;
const fmt = (n) => n.toLocaleString("pt-BR");

export default function Languages() {
  const { languages, words } = useData();
  const [selectedId, setSelectedId] = useState(languages[0]?.id);
  const selected = languages.find((l) => l.id === selectedId) ?? languages[0];

  // Count words per language once per change instead of filtering in every card.
  const stats = useMemo(() => {
    const thisWeek = weekStart(Date.now());
    return Object.fromEntries(
      languages.map((l) => {
        const list = words.filter((w) => w.langId === l.id);
        return [l.id, { total: list.length, week: list.filter((w) => w.createdAt >= thisWeek).length }];
      }),
    );
  }, [languages, words]);

  const totalWords = words.length;

  return (
    <div>
      <PageTitle title="Línguas" subtitle={`Meta: aprender as palavras que cobrem ${COVERAGE_GOAL * 100}% do uso diário`}>
        <Badge tone="brand">
          <BookOpen className="size-3" /> {fmt(totalWords)} palavras no total
        </Badge>
      </PageTitle>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {languages.map((l) => (
          <LanguageCard
            key={l.id}
            lang={l}
            stats={stats[l.id]}
            active={l.id === selected?.id}
            onSelect={() => setSelectedId(l.id)}
          />
        ))}
      </div>

      {selected && (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <WordsPanel key={selected.id} lang={selected} />
          <div className="flex flex-col gap-4 lg:col-span-5">
            <WeeklyChart languages={languages} words={words} />
            <HowItWorks key={selected.id} lang={selected} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- One card per language: words / target + estimated coverage ---------- */
function LanguageCard({ lang, stats, active, onSelect }) {
  const { total, week } = stats;
  const progress = total / lang.target;
  const coverage = estimatedCoverage(total, lang.target);
  const done = total >= lang.target;

  return (
    <Card
      onClick={onSelect}
      className={`cursor-pointer transition ${active ? "ring-2 ring-brand-400" : "hover:-translate-y-0.5"}`}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white"
          style={{ background: lang.color }}
        >
          {lang.code}
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{lang.name}</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {week > 0 ? `+${week} esta semana` : "nenhuma palavra esta semana"}
          </div>
        </div>
        {done && <Badge tone="green">meta batida 🎉</Badge>}
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div className="text-2xl font-semibold tracking-tight">
          {fmt(total)}
          <span className="text-sm font-medium text-zinc-400"> / {fmt(lang.target)}</span>
        </div>
        <div className="text-sm font-semibold" style={{ color: lang.color }}>
          {Math.min(100, progress * 100).toFixed(1)}%
        </div>
      </div>
      <Progress value={progress} color={lang.color} className="mt-2 h-2.5" />

      <div className="mt-3 flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
        <span>
          ≈ <b className="text-ink">{Math.round(coverage * 100)}%</b> do uso diário
        </span>
        <span>{done ? "agora é manutenção" : `faltam ${fmt(lang.target - total)}`}</span>
      </div>
    </Card>
  );
}

/* ---------- Add words (single or pasted list) + searchable list ---------- */
function WordsPanel({ lang }) {
  const { words, setWords } = useData();
  const [mode, setMode] = useState("single"); // "single" | "bulk"
  const [form, setForm] = useState({ word: "", translation: "" });
  const [bulk, setBulk] = useState("");
  const [query, setQuery] = useState("");
  const [msg, setMsg] = useState(null);

  const list = useMemo(
    () => words.filter((w) => w.langId === lang.id).sort((a, b) => b.createdAt - a.createdAt),
    [words, lang.id],
  );
  const q = query.trim().toLowerCase();
  const shown = q
    ? list.filter((w) => w.word.toLowerCase().includes(q) || w.translation.toLowerCase().includes(q))
    : list;

  // Adds only words that aren't in this language yet (case-insensitive), so the count stays honest.
  function addMany(items) {
    const known = new Set(list.map((w) => w.word.toLowerCase()));
    const now = Date.now();
    const fresh = [];
    for (const it of items) {
      const key = it.word.toLowerCase();
      if (known.has(key)) continue;
      known.add(key);
      fresh.push({ id: uid(), langId: lang.id, word: it.word, translation: it.translation, createdAt: now });
    }
    if (fresh.length) setWords((all) => [...all, ...fresh]);
    const skipped = items.length - fresh.length;
    setMsg(
      fresh.length
        ? `+${fresh.length} palavra(s) em ${lang.name}${skipped ? ` · ${skipped} repetida(s) ignorada(s)` : ""}`
        : "Essa(s) palavra(s) já estava(m) na lista.",
    );
    return fresh.length;
  }

  function submitSingle(e) {
    e.preventDefault();
    const word = form.word.trim();
    if (!word) return;
    if (addMany([{ word, translation: form.translation.trim() }])) setForm({ word: "", translation: "" });
  }

  function submitBulk(e) {
    e.preventDefault();
    const items = parseBulk(bulk);
    if (!items.length) return;
    addMany(items);
    setBulk("");
  }

  const remove = (id) => setWords((all) => all.filter((w) => w.id !== id));

  return (
    <Card className="flex flex-col lg:col-span-7">
      <CardHeader
        icon={Plus}
        title={`Palavras de ${lang.name}`}
        subtitle="Conte a forma de dicionário (ex.: “go”, não “went”)"
        action={
          <Button variant="light" className="!px-3 !py-1.5 text-xs" onClick={() => setMode(mode === "single" ? "bulk" : "single")}>
            <ListPlus className="size-4" /> {mode === "single" ? "Colar lista" : "Uma por vez"}
          </Button>
        }
      />

      {mode === "single" ? (
        <form onSubmit={submitSingle} className="flex flex-wrap gap-2">
          <Input
            className="min-w-0 flex-[1_1_140px]"
            placeholder={`Palavra em ${lang.name.toLowerCase()}`}
            value={form.word}
            onChange={(e) => setForm({ ...form, word: e.target.value })}
            autoFocus
          />
          <Input
            className="min-w-0 flex-[1_1_140px]"
            placeholder="Tradução (opcional)"
            value={form.translation}
            onChange={(e) => setForm({ ...form, translation: e.target.value })}
          />
          <Button type="submit" variant="brand">
            <Plus className="size-4" /> Adicionar
          </Button>
        </form>
      ) : (
        <form onSubmit={submitBulk} className="space-y-2">
          <Textarea
            rows={5}
            className="font-mono text-xs"
            placeholder={"Uma por linha. Ex.:\nhouse - casa\nдом - casa\ncasa = casa"}
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
          />
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>{parseBulk(bulk).length} palavra(s) detectada(s)</span>
            <Button type="submit" variant="brand">
              <Plus className="size-4" /> Adicionar todas
            </Button>
          </div>
        </form>
      )}
      {msg && <p className="mt-2 text-xs text-brand-600 dark:text-brand-300">{msg}</p>}

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
        <Input className="pl-9" placeholder={`Buscar entre ${fmt(list.length)} palavras`} value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="scroll-thin mt-3 max-h-96 space-y-0.5 overflow-y-auto">
        {shown.length === 0 && (
          <Empty>{list.length ? "Nada encontrado." : "Nenhuma palavra ainda — adicione a primeira acima."}</Empty>
        )}
        {shown.map((w) => (
          <div key={w.id} className="group flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-white/5">
            <span className="size-2 shrink-0 rounded-full" style={{ background: lang.color }} />
            <span className="min-w-0 flex-1 truncate text-sm">
              <b className="font-medium">{w.word}</b>
              {w.translation && <span className="text-zinc-500 dark:text-zinc-400"> — {w.translation}</span>}
            </span>
            <span className="text-[11px] text-zinc-400">{new Date(w.createdAt).toLocaleDateString("pt-BR")}</span>
            <IconButton title="Apagar" className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100" onClick={() => remove(w.id)}>
              <Trash2 className="size-4" />
            </IconButton>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------- Words added per week (last 8 weeks), stacked by language ---------- */
function WeeklyChart({ languages, words }) {
  const rows = useMemo(() => {
    const current = weekStart(Date.now());
    return Array.from({ length: 8 }, (_, i) => {
      const start = current - (7 - i) * WEEK;
      const row = { label: new Date(start).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) };
      for (const l of languages) {
        row[l.code] = words.filter((w) => w.langId === l.id && w.createdAt >= start && w.createdAt < start + WEEK).length;
      }
      return row;
    });
  }, [languages, words]);

  return (
    <Card>
      <CardHeader icon={CalendarDays} title="Ritmo semanal" subtitle="Palavras novas por semana (início na segunda)" />
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ left: -24, right: 4, top: 4 }}>
            <CartesianGrid vertical={false} stroke="#eee" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#a1a1aa" }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#a1a1aa" }} />
            <Tooltip cursor={{ fill: "#f4f2ff" }} content={<ChartTooltip labelFormat={(l) => `Semana de ${l}`} />} />
            {languages.map((l, i) => (
              <Bar
                key={l.id}
                dataKey={l.code}
                name={l.name}
                stackId="w"
                fill={l.color}
                maxBarSize={28}
                radius={i === languages.length - 1 ? [6, 6, 0, 0] : 0}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

/* ---------- Explanation + editable target for the selected language ---------- */
function HowItWorks({ lang }) {
  const { setLanguages } = useData();
  // Draft while typing; saved on blur/Enter so clearing the field doesn't zero the target.
  const [draft, setDraft] = useState(String(lang.target));
  const save = () => {
    const target = Math.max(50, Math.round(Number(draft)) || lang.target);
    setDraft(String(target));
    setLanguages((all) => all.map((l) => (l.id === lang.id ? { ...l, target } : l)));
  };

  return (
    <Card>
      <CardHeader icon={Target} title="Como a meta funciona" />
      <div className="flex gap-2 rounded-2xl bg-brand-50 p-3 text-xs leading-relaxed text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>
          Pela <b>Lei de Zipf</b>, poucas palavras aparecem o tempo todo: as ~100 mais comuns já são cerca de
          metade do que você ouve, e umas <b>2.000</b> cobrem perto de <b>80%</b> do uso diário. A barra mostra
          palavras / meta; o “% do uso diário” é uma estimativa por essa curva, supondo que você estude
          pelas listas de frequência (das mais comuns para as raras). No russo, por causa das
          declinações, conte só a forma de dicionário.
        </p>
      </div>
      <label className="mt-3 flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
        Meta de palavras para {lang.name}
        <Input
          type="number"
          min={50}
          step={100}
          className="!w-28"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        />
      </label>
    </Card>
  );
}
