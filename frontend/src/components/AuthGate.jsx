// Decides what to render before the dashboard:
// - no Supabase configured → app runs local-only (user = null)
// - Supabase configured    → requires login; passes the logged user down
import { useEffect, useState } from "react";
import { Feather, LoaderCircle } from "lucide-react";
import { supabase, isCloudEnabled } from "../lib/supabase.js";
import { Button, Card, Input } from "./ui.jsx";

export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined); // undefined = still checking

  useEffect(() => {
    if (!isCloudEnabled) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    // Fires on login, logout and token refresh
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!isCloudEnabled) return children(null);
  if (session === undefined) return <Splash text="Verificando sessão..." />;
  if (!session) return <Login />;
  return children(session.user);
}

export function Splash({ text }) {
  return (
    <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-zinc-500">
      <LoaderCircle className="size-4 animate-spin" />
      {text}
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { type: "error" | "info", text }

  async function submit(mode) {
    setBusy(true);
    setMsg(null);
    const { data, error } =
      mode === "signup"
        ? await supabase.auth.signUp({
            email,
            password,
            // where the confirmation e-mail link sends the user back (localhost or the Vercel URL)
            options: { emailRedirectTo: window.location.origin },
          })
        : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setMsg({ type: "error", text: translate(error.message) });
    // signUp with "Confirm email" enabled returns a user but no session yet
    if (mode === "signup" && !data.session) {
      setMsg({ type: "info", text: "Conta criada! Confirme pelo link enviado ao seu e-mail e depois entre." });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-5 flex items-center gap-2">
          <Feather className="size-6 -rotate-12" strokeWidth={2.4} />
          <span className="text-lg font-semibold tracking-tight">Salary</span>
        </div>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit("login");
          }}
        >
          <Input type="email" placeholder="E-mail" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" placeholder="Senha (mín. 6)" autoComplete="current-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          {msg && (
            <p className={msg.type === "error" ? "text-sm text-rose-600" : "text-sm text-emerald-700"}>{msg.text}</p>
          )}
          <Button type="submit" className="w-full" disabled={busy}>Entrar</Button>
          <Button type="button" variant="ghost" className="w-full" disabled={busy || !email || password.length < 6} onClick={() => submit("signup")}>
            Criar conta
          </Button>
        </form>
      </Card>
    </div>
  );
}

const translate = (m) =>
  ({
    "Invalid login credentials": "E-mail ou senha incorretos.",
    "Email not confirmed": "Confirme seu e-mail antes de entrar.",
    "User already registered": "Este e-mail já tem conta.",
    "Signups not allowed for this instance": "Cadastro de novas contas está desativado.",
  })[m] ?? m;
