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
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { type: "error" | "info", text }
  const signup = mode === "signup";

  async function submit(e) {
    e.preventDefault(); // browser already checked required / e-mail format / minLength
    setBusy(true);
    setMsg(null);
    const { data, error } = signup
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
    if (signup && !data.session) {
      setMode("login");
      setPassword("");
      setMsg({ type: "info", text: `Conta criada! Abra o link enviado para ${email} (veja o spam) e depois entre.` });
    }
  }

  function switchMode() {
    setMode(signup ? "login" : "signup");
    setMsg(null);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-1 flex items-center gap-2">
          <Feather className="size-6 -rotate-12" strokeWidth={2.4} />
          <span className="text-lg font-semibold tracking-tight">Salary</span>
        </div>
        <p className="mb-5 text-sm text-zinc-500">{signup ? "Crie sua conta" : "Entre na sua conta"}</p>
        <form className="space-y-3" onSubmit={submit}>
          <Input type="email" placeholder="E-mail" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input
            type="password"
            placeholder={signup ? "Senha (mínimo 6 caracteres)" : "Senha"}
            autoComplete={signup ? "new-password" : "current-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {msg && (
            <p className={msg.type === "error" ? "text-sm text-rose-500" : "text-sm text-emerald-500"}>{msg.text}</p>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <LoaderCircle className="size-4 animate-spin" />}
            {signup ? "Criar conta" : "Entrar"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-500">
          {signup ? "Já tem conta? " : "Ainda não tem conta? "}
          <button type="button" onClick={switchMode} className="cursor-pointer font-medium text-brand-500 hover:underline">
            {signup ? "Entrar" : "Criar conta"}
          </button>
        </p>
      </Card>
    </div>
  );
}

const translate = (m) =>
  ({
    "Invalid login credentials": "E-mail ou senha incorretos.",
    "Email not confirmed": "Confirme seu e-mail antes de entrar (veja o link na sua caixa de entrada).",
    "User already registered": "Este e-mail já tem conta. Use Entrar.",
    "Signups not allowed for this instance": "Cadastro de novas contas está desativado.",
    "email rate limit exceeded": "Limite de e-mails da Supabase atingido. Espere alguns minutos e tente de novo.",
    "Password should be at least 6 characters.": "A senha precisa ter pelo menos 6 caracteres.",
    "Failed to fetch": "Sem conexão com o servidor. Verifique sua internet.",
  })[m] ?? m;
