import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock,
  ImagePlus,
  Pencil,
  Plus,
  Search,
  Trash2,
  Trophy,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useData } from "../store.jsx";
import { brl, monthKey, uid } from "../lib/format.js";
import { compressImage, FREELANCE_STATUS, freelanceMonth, todayISO } from "../lib/freelance.js";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  Empty,
  Field,
  IconButton,
  Input,
  Modal,
  PageTitle,
  Segments,
  Select,
  StatCard,
  Tabs,
  Textarea,
} from "../components/ui.jsx";

const sum = (list) => list.reduce((a, f) => a + Number(f.amount), 0);
const dateBR = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR"); // noon: avoids timezone shifting the day

export default function Freelances() {
  const { freelances, setFreelances, freelanceFiles, setFreelanceFiles } = useData();
  const [editing, setEditing] = useState(null); // null | "new" | job object
  const [viewImage, setViewImage] = useState(null);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const month = monthKey();
  const year = month.slice(0, 4);
  const paid = freelances.filter((f) => f.status === "pago");
  const pending = freelances.filter((f) => f.status === "pendente");

  const stats = {
    month: sum(paid.filter((f) => freelanceMonth(f) === month)),
    year: sum(paid.filter((f) => f.date.startsWith(year))),
    pending: sum(pending),
    avg: paid.length ? sum(paid) / paid.length : 0,
  };

  // Ranking of clients by total received
  const clients = useMemo(() => {
    const map = new Map();
    for (const f of paid) {
      const key = f.client.name.trim() || "Sem nome";
      const c = map.get(key) ?? { name: key, total: 0, jobs: 0 };
      c.total += Number(f.amount);
      c.jobs += 1;
      map.set(key, c);
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freelances]);

  const q = query.trim().toLowerCase();
  const list = freelances
    .filter((f) => filter === "all" || f.status === filter)
    .filter((f) => !q || `${f.title} ${f.client.name} ${f.client.company}`.toLowerCase().includes(q))
    .sort((a, b) => b.date.localeCompare(a.date));

  function save(job, image) {
    setFreelances((all) =>
      all.some((f) => f.id === job.id) ? all.map((f) => (f.id === job.id ? job : f)) : [...all, job],
    );
    // image: undefined = unchanged, null = removed, string = new data URL
    if (image !== undefined)
      setFreelanceFiles((files) => {
        const next = { ...files };
        if (image) next[job.id] = image;
        else delete next[job.id];
        return next;
      });
    setEditing(null);
  }

  function remove(job) {
    if (!confirm(`Apagar o freela "${job.title}"? Ele sai também da receita do mês.`)) return;
    setFreelances((all) => all.filter((f) => f.id !== job.id));
    setFreelanceFiles((files) => {
      const next = { ...files };
      delete next[job.id];
      return next;
    });
  }

  const toggleStatus = (job) =>
    setFreelances((all) =>
      all.map((f) => (f.id === job.id ? { ...f, status: f.status === "pago" ? "pendente" : "pago" } : f)),
    );

  return (
    <div>
      <PageTitle title="Freelas" subtitle="Serviços recebidos entram automaticamente na receita do mês (Início)">
        <Button variant="dark" onClick={() => setEditing("new")}>
          <Plus className="size-4" /> Novo freela
        </Button>
      </PageTitle>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Wallet} label="Recebido no mês" value={brl(stats.month)} hint="já está no caixa" />
        <StatCard icon={CalendarDays} label={`Recebido em ${year}`} value={brl(stats.year)} hint={`${paid.filter((f) => f.date.startsWith(year)).length} serviços`} />
        <StatCard icon={Clock} label="A receber" value={brl(stats.pending)} hint={`${pending.length} pendente(s)`} />
        <StatCard icon={Trophy} label="Ticket médio" value={brl(stats.avg)} hint={`${clients.length} cliente(s)`} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeader
            icon={Briefcase}
            title="Serviços prestados"
            subtitle="Clique no status para marcar como recebido"
            action={
              <Tabs
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "all", label: "Todos", count: freelances.length },
                  { value: "pago", label: "Recebidos", count: paid.length },
                  { value: "pendente", label: "A receber", count: pending.length },
                ]}
              />
            }
          />
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
            <Input className="pl-9" placeholder="Buscar por serviço ou cliente" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="space-y-2">
            {list.length === 0 && <Empty>Nenhum freela aqui. Clique em “Novo freela”.</Empty>}
            {list.map((f) => (
              <JobRow
                key={f.id}
                job={f}
                image={freelanceFiles[f.id]}
                onImage={() => setViewImage(freelanceFiles[f.id])}
                onEdit={() => setEditing(f)}
                onDelete={() => remove(f)}
                onToggle={() => toggleStatus(f)}
              />
            ))}
          </div>
        </Card>

        <Card className="self-start lg:col-span-4">
          <CardHeader icon={Users} title="Clientes" subtitle="Quem mais te pagou" />
          {clients.length === 0 && <Empty>Ainda sem pagamentos recebidos.</Empty>}
          <div className="space-y-3">
            {clients.slice(0, 8).map((c) => (
              <div key={c.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <Avatar name={c.name} small />
                    <span className="truncate">{c.name}</span>
                  </span>
                  <b className="whitespace-nowrap">{brl(c.total)}</b>
                </div>
                <Segments value={c.total / clients[0].total} />
                <div className="mt-0.5 text-[11px] text-zinc-400">{c.jobs} serviço(s)</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        icon={Briefcase}
        title={editing === "new" ? "Novo freela" : "Editar freela"}
      >
        {editing !== null && (
          <JobForm
            key={editing === "new" ? "new" : editing.id}
            job={editing === "new" ? null : editing}
            image={editing === "new" ? null : freelanceFiles[editing.id]}
            onSave={save}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      {viewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setViewImage(null)}>
          <img src={viewImage} alt="Print do serviço" className="max-h-full max-w-full rounded-2xl shadow-2xl" />
          <button className="absolute top-4 right-4 cursor-pointer rounded-full bg-white/10 p-2 text-white" aria-label="Fechar">
            <X className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
}

function JobRow({ job, image, onImage, onEdit, onDelete, onToggle }) {
  const st = FREELANCE_STATUS[job.status];
  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white/60 p-2.5 dark:border-white/10 dark:bg-white/5">
      {image ? (
        <button onClick={onImage} className="size-14 shrink-0 cursor-zoom-in overflow-hidden rounded-xl" title="Ver print">
          <img src={image} alt="" className="size-full object-cover" />
        </button>
      ) : (
        <Avatar name={job.client.name} />
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{job.title}</div>
        <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          {job.client.name}
          {job.client.company && ` · ${job.client.company}`}
          {job.client.contact && ` · ${job.client.contact}`}
        </div>
        <div className="text-[11px] text-zinc-400">{dateBR(job.date)}</div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <b className="whitespace-nowrap">{brl(job.amount)}</b>
        <button onClick={onToggle} className="cursor-pointer" title="Alternar status">
          <Badge tone={st.tone}>
            {job.status === "pago" ? <CheckCircle2 className="size-3" /> : <Clock className="size-3" />}
            {st.label}
          </Badge>
        </button>
      </div>
      <div className="flex flex-col opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
        <IconButton title="Editar" onClick={onEdit}>
          <Pencil className="size-4" />
        </IconButton>
        <IconButton title="Apagar" onClick={onDelete}>
          <Trash2 className="size-4" />
        </IconButton>
      </div>
    </div>
  );
}

function JobForm({ job, image: savedImage, onSave, onCancel }) {
  const [form, setForm] = useState(
    job
      ? { ...job, amount: String(job.amount).replace(".", ","), client: { ...job.client } }
      : { title: "", amount: "", date: todayISO(), status: "pago", notes: "", client: { name: "", company: "", contact: "" } },
  );
  const [image, setImage] = useState(savedImage ?? null);
  const [imageChanged, setImageChanged] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setClient = (k) => (e) => setForm((f) => ({ ...f, client: { ...f.client, [k]: e.target.value } }));

  async function attachFile(file) {
    if (!file?.type.startsWith("image/")) return;
    try {
      setImage(await compressImage(file));
      setImageChanged(true);
    } catch {
      setError("Não consegui ler essa imagem.");
    }
  }

  // Ctrl+V with a screenshot in the clipboard attaches it (Win+Shift+S → Ctrl+V)
  useEffect(() => {
    const onPaste = (e) => {
      const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith("image/"));
      if (file) attachFile(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  function submit(e) {
    e.preventDefault();
    const amount = Number(String(form.amount).replace(/\./g, "").replace(",", "."));
    if (!form.title.trim()) return setError("Descreva o serviço.");
    if (!(amount > 0)) return setError("Informe um valor maior que zero.");
    if (!form.client.name.trim()) return setError("Informe o nome do cliente.");
    const next = {
      ...form,
      id: job?.id ?? uid(),
      title: form.title.trim(),
      amount,
      hasImage: Boolean(image),
      client: { name: form.client.name.trim(), company: form.client.company.trim(), contact: form.client.contact.trim() },
    };
    onSave(next, imageChanged ? image : undefined);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
        <Field label="Serviço" className="sm:col-span-6">
          <Input placeholder="Ex.: Landing page para clínica" value={form.title} onChange={set("title")} autoFocus />
        </Field>
        <Field label="Valor (R$)" className="sm:col-span-2">
          <Input inputMode="decimal" placeholder="0,00" value={form.amount} onChange={set("amount")} />
        </Field>
        <Field label="Data" className="sm:col-span-2">
          <Input type="date" value={form.date} onChange={set("date")} />
        </Field>
        <Field label="Status" className="sm:col-span-2">
          <Select value={form.status} onChange={set("status")}>
            <option value="pago">Recebido</option>
            <option value="pendente">A receber</option>
          </Select>
        </Field>
      </div>

      <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-white/5">
        <div className="mb-2 text-xs font-semibold">Cliente</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Input placeholder="Nome" value={form.client.name} onChange={setClient("name")} />
          <Input placeholder="Empresa (opcional)" value={form.client.company} onChange={setClient("company")} />
          <Input placeholder="E-mail / WhatsApp" value={form.client.contact} onChange={setClient("contact")} />
        </div>
      </div>

      <Field label="Observações">
        <Textarea rows={2} placeholder="Escopo, prazo, forma de pagamento..." value={form.notes} onChange={set("notes")} />
      </Field>

      <div>
        <div className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">Print do serviço</div>
        {image ? (
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/10">
            <img src={image} alt="Print" className="max-h-48 w-full object-cover object-top" />
            <button
              type="button"
              onClick={() => {
                setImage(null);
                setImageChanged(true);
              }}
              className="absolute top-2 right-2 cursor-pointer rounded-full bg-black/60 p-1.5 text-white"
              aria-label="Remover print"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <label
            className="flex cursor-pointer flex-col items-center gap-1 rounded-2xl border border-dashed border-zinc-300 p-5 text-center text-xs text-zinc-500 transition hover:border-brand-300 hover:bg-brand-50 dark:border-white/20 dark:text-zinc-400 dark:hover:bg-brand-500/10"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              attachFile(e.dataTransfer.files[0]);
            }}
          >
            <ImagePlus className="size-5 text-brand-500" />
            Clique, arraste uma imagem ou cole com Ctrl+V
            <input type="file" accept="image/*" hidden onChange={(e) => attachFile(e.target.files[0])} />
          </label>
        )}
      </div>

      {error && <p className="text-xs font-medium text-rose-500">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="light" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="brand">
          Salvar
        </Button>
      </div>
    </form>
  );
}
