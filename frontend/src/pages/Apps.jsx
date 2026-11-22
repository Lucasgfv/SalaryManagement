import { useState } from "react";
import {
  CircleCheck,
  CirclePause,
  ExternalLink,
  FolderGit2,
  Globe,
  LayoutGrid,
  Plus,
  RefreshCw,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { useData } from "../store.jsx";
import { timeAgo, uid } from "../lib/format.js";
import { Badge, Button, Card, CardHeader, Empty, IconButton, Input, PageTitle, Select, StatCard, Tabs, Textarea } from "../components/ui.jsx";

export const STATUS = {
  online: { label: "Online", tone: "green", dot: "bg-emerald-500", active: true },
  dev: { label: "Em desenvolvimento", tone: "brand", dot: "bg-brand-500", active: true },
  offline: { label: "Offline", tone: "red", dot: "bg-rose-500", active: false },
  done: { label: "Concluído", tone: "gray", dot: "bg-zinc-400", active: false },
};

// Checks if a URL answers. `no-cors` lets us reach any site, but the response is opaque:
// we only learn "reachable or not" (not the HTTP status code).
async function ping(url) {
  const start = performance.now();
  try {
    await fetch(url, { mode: "no-cors", cache: "no-store", signal: AbortSignal.timeout(8000) });
    return { ok: true, latency: Math.round(performance.now() - start) };
  } catch {
    return { ok: false, latency: null };
  }
}

export default function Apps() {
  const { apps, setApps } = useData();
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [checking, setChecking] = useState([]); // ids being pinged

  const active = apps.filter((a) => STATUS[a.status].active);
  const visible = apps.filter((a) =>
    filter === "all" ? true : filter === "active" ? STATUS[a.status].active : !STATUS[a.status].active,
  );

  const update = (id, patch) => setApps((l) => l.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  async function check(app) {
    if (!app.url) return;
    setChecking((c) => [...c, app.id]);
    const { ok, latency } = await ping(app.url);
    // only flip between online/offline — don't touch "dev" or "done" apps without a reply
    const status = ok ? "online" : app.status === "online" ? "offline" : app.status;
    update(app.id, { status, latency, lastCheck: new Date().toISOString() });
    setChecking((c) => c.filter((id) => id !== app.id));
  }

  const checkAll = () => apps.filter((a) => a.url).forEach(check);

  return (
    <>
      <PageTitle title="Meus apps" subtitle="O que está no ar, em desenvolvimento ou já foi concluído">
        <Button variant="light" onClick={checkAll} disabled={!apps.some((a) => a.url)}>
          <RefreshCw className={`size-4 ${checking.length ? "animate-spin" : ""}`} /> Verificar todos
        </Button>
        <Button variant="dark" onClick={() => setShowForm((v) => !v)}>
          {showForm ? <X className="size-4" /> : <Plus className="size-4" />} {showForm ? "Fechar" : "Novo app"}
        </Button>
      </PageTitle>

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={LayoutGrid} label="Total" value={apps.length} hint="projetos" />
        <StatCard icon={CircleCheck} label="Online" value={apps.filter((a) => a.status === "online").length} hint="no ar agora" />
        <StatCard icon={Wrench} label="Em desenvolvimento" value={apps.filter((a) => a.status === "dev").length} hint="construindo" />
        <StatCard icon={CirclePause} label="Inativos" value={apps.length - active.length} hint="offline + concluídos" />
      </div>

      {showForm && <AppForm onDone={() => setShowForm(false)} />}

      <Tabs
        className="mb-4"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "Todos", count: apps.length },
          { value: "active", label: "Ativos", count: active.length },
          { value: "inactive", label: "Inativos", count: apps.length - active.length },
        ]}
      />

      {visible.length === 0 ? (
        <Empty>Nenhum app aqui. Clique em “Novo app” para cadastrar.</Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              checking={checking.includes(app.id)}
              onCheck={() => check(app)}
              onStatus={(status) => update(app.id, { status })}
              onRemove={() => confirm(`Remover "${app.name}"?`) && setApps((l) => l.filter((a) => a.id !== app.id))}
            />
          ))}
        </div>
      )}
    </>
  );
}

function AppCard({ app, checking, onCheck, onStatus, onRemove }) {
  const st = STATUS[app.status];
  const stack = app.stack ? app.stack.split(",").map((s) => s.trim()).filter(Boolean) : [];
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-brand-100 dark:from-brand-500/25 to-peach-100 dark:to-peach-500/25 text-lg font-semibold text-brand-700 dark:text-brand-200">
          {app.name[0]?.toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{app.name}</div>
          <p className="line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">{app.description || "Sem descrição"}</p>
        </div>
        <Badge tone={st.tone}>
          <span className={`size-1.5 rounded-full ${st.dot} ${app.status === "online" ? "animate-pulse" : ""}`} />
          {st.label}
        </Badge>
      </div>

      {stack.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {stack.map((s) => (
            <span key={s} className="rounded-full border border-zinc-200 dark:border-white/10 bg-white dark:bg-surface px-2 py-0.5 text-[11px] text-zinc-600 dark:text-zinc-300">
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-xs">
        {app.url && (
          <a href={app.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-brand-600 dark:text-brand-300 hover:underline">
            <Globe className="size-3.5" /> {app.url.replace(/^https?:\/\//, "")}
            <ExternalLink className="size-3" />
          </a>
        )}
        {app.repo && (
          <a href={app.repo} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300 hover:underline">
            <FolderGit2 className="size-3.5" /> repositório
          </a>
        )}
      </div>

      <div className="mt-auto flex items-center gap-2 border-t border-zinc-100 dark:border-white/10 pt-3">
        <Select className="!w-auto !rounded-full !py-1 text-xs" value={app.status} onChange={(e) => onStatus(e.target.value)}>
          {Object.entries(STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </Select>
        <span className="flex-1 truncate text-[11px] text-zinc-400">
          {app.url ? `verificado ${timeAgo(app.lastCheck)}${app.latency ? ` · ${app.latency} ms` : ""}` : "sem URL"}
        </span>
        {app.url && (
          <IconButton title="Verificar agora" onClick={onCheck}>
            <RefreshCw className={`size-4 ${checking ? "animate-spin" : ""}`} />
          </IconButton>
        )}
        <IconButton title="Remover" onClick={onRemove}>
          <Trash2 className="size-4" />
        </IconButton>
      </div>
    </Card>
  );
}

function AppForm({ onDone }) {
  const { setApps } = useData();
  const [f, setF] = useState({ name: "", description: "", url: "", repo: "", stack: "", status: "dev" });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  function submit(e) {
    e.preventDefault();
    if (!f.name.trim()) return;
    setApps((l) => [
      { id: uid(), createdAt: new Date().toISOString(), lastCheck: null, latency: null, ...f, name: f.name.trim() },
      ...l,
    ]);
    onDone();
  }

  return (
    <Card className="mb-4">
      <CardHeader icon={Plus} title="Novo app" />
      <form onSubmit={submit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Input placeholder="Nome *" value={f.name} onChange={set("name")} autoFocus />
        <Select value={f.status} onChange={set("status")}>
          {Object.entries(STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </Select>
        <Input placeholder="URL (https://...)" type="url" value={f.url} onChange={set("url")} />
        <Input placeholder="Repositório (https://github.com/...)" type="url" value={f.repo} onChange={set("repo")} />
        <Input className="md:col-span-2" placeholder="Stack separada por vírgula (React, FastAPI, Docker)" value={f.stack} onChange={set("stack")} />
        <Textarea className="md:col-span-2" rows={2} placeholder="Descrição curta" value={f.description} onChange={set("description")} />
        <div className="flex justify-end gap-2 md:col-span-2">
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancelar
          </Button>
          <Button type="submit" variant="brand">
            Salvar app
          </Button>
        </div>
      </form>
    </Card>
  );
}
