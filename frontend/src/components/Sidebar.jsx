import { useRef, useState } from "react";
import { Download, Feather, LogOut, Moon, RotateCcw, Sun, Trash2, Upload } from "lucide-react";
import { useTheme } from "../lib/useTheme.js";

// Dot color + text for the sync status shown in the account menu
const SYNC_LABEL = {
  local: ["bg-zinc-300", "Salvo só neste navegador"],
  saving: ["bg-amber-400", "Salvando..."],
  synced: ["bg-emerald-500", "Sincronizado na nuvem"],
  error: ["bg-rose-500", "Erro ao sincronizar"],
};

const cx = (...c) => c.filter(Boolean).join(" ");

// Desktop (lg+): dark sidebar on the left, like the reference layout.
// Mobile: compact top bar with scrollable pill navigation.
export default function Sidebar({ pages, current, data }) {
  const [theme, toggleTheme] = useTheme();
  const name = data.user?.email?.split("@")[0] ?? "Lucas";

  return (
    <>
      {/* ---------- desktop sidebar ---------- */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 p-3 lg:block">
        <div className="flex h-full flex-col rounded-3xl bg-[#1b1733] p-4 text-white shadow-xl dark:bg-[#15121f] dark:ring-1 dark:ring-white/5">
          <a href="#/home" className="mb-8 flex items-center gap-2 px-2 pt-1">
            <Feather className="size-6 -rotate-12 text-peach-300" strokeWidth={2.4} />
            <span className="text-lg font-semibold tracking-tight">Salary</span>
          </a>

          <nav className="space-y-1">
            {pages.map(({ id, label, icon: Icon, badge }) => (
              <a
                key={id}
                href={`#/${id}`}
                className={cx(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  current === id ? "bg-brand-300 text-[#16141f]" : "text-white/70 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="size-4" />
                <span className="flex-1">{label}</span>
                {badge > 0 && (
                  <span className={cx("rounded-md px-1.5 text-xs", current === id ? "bg-white/50" : "bg-white/10")}>{badge}</span>
                )}
              </a>
            ))}
          </nav>

          <div className="flex-1" />

          <button
            onClick={toggleTheme}
            className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {theme === "dark" ? "Tema claro" : "Tema escuro"}
          </button>

          <div className="mt-2 border-t border-white/10 pt-3">
            <AccountMenu data={data} up>
              <span className="flex size-9 items-center justify-center rounded-full bg-linear-to-br from-peach-300 to-brand-400 font-semibold">
                {name[0].toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-medium capitalize">{name}</span>
                <span className="block text-xs text-white/50">Minha conta</span>
              </span>
            </AccountMenu>
          </div>
        </div>
      </aside>

      {/* ---------- mobile top bar ---------- */}
      <header className="relative z-20 flex items-center justify-between gap-3 px-4 pt-5 lg:hidden">
        <a href="#/home" className="shrink-0">
          <Feather className="size-6 -rotate-12" strokeWidth={2.4} />
        </a>
        <nav className="flex gap-1 overflow-x-auto rounded-full bg-white/60 p-1 shadow-sm backdrop-blur-xl dark:bg-surface/60">
          {pages.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`#/${id}`}
              aria-label={label}
              className={cx(
                "flex items-center rounded-full p-2 transition",
                current === id ? "bg-white text-ink shadow-sm dark:bg-white/15" : "text-zinc-600 dark:text-zinc-300",
              )}
            >
              <Icon className="size-4" />
            </a>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-white/70 shadow-sm dark:bg-surface/70"
            aria-label="Alternar tema"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <AccountMenu data={data}>
            <span className="flex size-9 items-center justify-center rounded-full bg-linear-to-br from-peach-300 to-brand-400 font-semibold text-white">
              {name[0].toUpperCase()}
            </span>
          </AccountMenu>
        </div>
      </header>
    </>
  );
}

// Account button + menu (sync status, backup, reset, sign out). `up` opens above the button.
function AccountMenu({ data, up, children }) {
  const [open, setOpen] = useState(false);
  const fileRef = useRef(null);

  function exportBackup() {
    const blob = new Blob([JSON.stringify(data.exportAll(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `salary-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setOpen(false);
  }

  async function importBackup(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      data.loadAll(JSON.parse(await file.text()));
    } catch {
      alert("Arquivo inválido.");
    }
    e.target.value = "";
    setOpen(false);
  }

  function confirmThen(message, fn) {
    if (confirm(message)) fn();
    setOpen(false);
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex w-full cursor-pointer items-center gap-3 rounded-xl p-1 transition hover:bg-white/5" aria-label="Menu da conta">
        {children}
      </button>

      {open && <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />}
      {open && (
        <div
          className={cx(
            "absolute z-40 w-64 rounded-2xl border border-white bg-white/95 p-2 text-sm text-ink shadow-xl backdrop-blur dark:border-white/5 dark:bg-surface/95",
            up ? "bottom-14 left-0" : "top-12 right-0",
          )}
        >
          <div className="px-3 pt-1 pb-2">
            {data.user && <div className="truncate font-medium">{data.user.email}</div>}
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <span className={cx("size-2 rounded-full", SYNC_LABEL[data.sync]?.[0])} />
              {SYNC_LABEL[data.sync]?.[1]}
            </div>
          </div>
          <div className="mb-1 h-px bg-zinc-100 dark:bg-white/10" />
          <MenuItem icon={Download} onClick={exportBackup}>Exportar backup (.json)</MenuItem>
          <MenuItem icon={Upload} onClick={() => fileRef.current?.click()}>Importar backup</MenuItem>
          <div className="my-1 h-px bg-zinc-100 dark:bg-white/10" />
          <MenuItem icon={RotateCcw} onClick={() => confirmThen("Substituir tudo pelos dados de exemplo?", data.resetDemo)}>
            Restaurar dados de exemplo
          </MenuItem>
          <MenuItem icon={Trash2} danger onClick={() => confirmThen("Apagar TODOS os dados? Exporte um backup antes.", data.resetEmpty)}>
            Começar do zero
          </MenuItem>
          {data.user && (
            <>
              <div className="my-1 h-px bg-zinc-100 dark:bg-white/10" />
              <MenuItem icon={LogOut} onClick={data.signOut}>Sair</MenuItem>
            </>
          )}
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={importBackup} />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, danger, children, ...props }) {
  return (
    <button
      className={cx(
        "flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-white/5",
        danger && "text-rose-600 dark:text-rose-400",
      )}
      {...props}
    >
      <Icon className="size-4" />
      {children}
    </button>
  );
}
