import { useState } from "react";
import { ChevronLeft, ChevronRight, Lightbulb, Plus, Search, Trash2 } from "lucide-react";
import { useData } from "../store.jsx";
import { uid } from "../lib/format.js";
import { Badge, Button, Card, Empty, IconButton, Input, PageTitle, Select, Textarea } from "../components/ui.jsx";

// Kanban columns, left → right
const COLUMNS = [
  { id: "ideia", label: "Ideias", dot: "bg-amber-400" },
  { id: "validando", label: "Validando", dot: "bg-peach-400" },
  { id: "fazendo", label: "Fazendo", dot: "bg-brand-500" },
  { id: "feito", label: "Feito", dot: "bg-emerald-500" },
];

const PRIORITY = { alta: "red", média: "amber", baixa: "gray" };

export default function Ideas() {
  const { ideas, setIdeas } = useData();
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ title: "", description: "", tag: "", priority: "média" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function add(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setIdeas((l) => [
      { id: uid(), ...form, title: form.title.trim(), tag: form.tag.trim(), status: "ideia", createdAt: new Date().toISOString() },
      ...l,
    ]);
    setForm({ title: "", description: "", tag: "", priority: "média" });
  }

  // Move a card one column left (-1) or right (+1)
  function move(id, dir) {
    setIdeas((l) =>
      l.map((i) => {
        if (i.id !== id) return i;
        const idx = COLUMNS.findIndex((c) => c.id === i.status) + dir;
        return COLUMNS[idx] ? { ...i, status: COLUMNS[idx].id } : i;
      }),
    );
  }

  const q = query.toLowerCase();
  const filtered = ideas.filter((i) => [i.title, i.description, i.tag].join(" ").toLowerCase().includes(q));

  return (
    <>
      <PageTitle title="Ideias" subtitle="Anote ideias de projetos e acompanhe do rascunho até o feito">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
          <Input className="!rounded-full !pl-9 sm:w-64" placeholder="Buscar ideia..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </PageTitle>

      <Card hero className="mb-4">
        <form onSubmit={add} className="grid grid-cols-1 gap-2 md:grid-cols-[2fr_3fr_1fr_1fr_auto]">
          <Input placeholder="Título da ideia *" value={form.title} onChange={set("title")} />
          <Textarea rows={1} className="resize-none" placeholder="Descrição (opcional)" value={form.description} onChange={set("description")} />
          <Input placeholder="Tag (IA, Cloud...)" value={form.tag} onChange={set("tag")} />
          <Select value={form.priority} onChange={set("priority")}>
            <option value="alta">Prioridade alta</option>
            <option value="média">Prioridade média</option>
            <option value="baixa">Prioridade baixa</option>
          </Select>
          <Button type="submit" variant="dark">
            <Plus className="size-4" /> Anotar
          </Button>
        </form>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col, colIdx) => {
          const items = filtered.filter((i) => i.status === col.id);
          return (
            <div key={col.id} className="rounded-3xl bg-white/40 dark:bg-surface/40 p-3">
              <div className="mb-3 flex items-center gap-2 px-1">
                <span className={`size-2 rounded-full ${col.dot}`} />
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <span className="text-xs text-zinc-400">{items.length}</span>
              </div>
              <div className="space-y-3">
                {items.length === 0 && <Empty>{col.id === "ideia" ? <Lightbulb className="mx-auto size-5" /> : "—"}</Empty>}
                {items.map((idea) => (
                  <Card key={idea.id} className="group !p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className={`font-medium ${col.id === "feito" ? "text-zinc-400 line-through" : ""}`}>{idea.title}</div>
                      <IconButton className="-mt-1 -mr-1 size-7 opacity-100 sm:opacity-0 sm:group-hover:opacity-100" title="Apagar" onClick={() => confirm("Apagar ideia?") && setIdeas((l) => l.filter((i) => i.id !== idea.id))}>
                        <Trash2 className="size-3.5" />
                      </IconButton>
                    </div>
                    {idea.description && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{idea.description}</p>}
                    <div className="mt-3 flex items-center gap-1.5">
                      {idea.tag && <Badge tone="brand">{idea.tag}</Badge>}
                      <Badge tone={PRIORITY[idea.priority]}>{idea.priority}</Badge>
                      <span className="ml-auto flex">
                        <IconButton className="size-7" title="Voltar" disabled={colIdx === 0} onClick={() => move(idea.id, -1)}>
                          <ChevronLeft className="size-4" />
                        </IconButton>
                        <IconButton className="size-7" title="Avançar" disabled={colIdx === COLUMNS.length - 1} onClick={() => move(idea.id, 1)}>
                          <ChevronRight className="size-4" />
                        </IconButton>
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
