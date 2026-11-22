# Deploy: Supabase (dados) + Vercel (site)

Arquitetura:

```
Navegador (React na Vercel) ──HTTPS──▶ Supabase (Auth + PostgreSQL)
        │                                     │
   localStorage = cache              tabela user_data (1 linha por "fatia")
                                     protegida por RLS
```

Não há backend próprio: o app fala direto com a Supabase usando a **chave pública (anon)**.
Isso é seguro porque o banco tem **Row Level Security** — cada usuário só lê/escreve as próprias linhas.

---

## 1. Supabase

### 1.1 Criar o projeto
1. Acesse https://supabase.com → **Start your project** → entre com o GitHub.
2. **New project** → nome `salary`, gere uma **Database Password** forte (guarde num gerenciador de senhas) e escolha a região **South America (São Paulo)**.
3. Aguarde ~2 min até o projeto ficar pronto.

### 1.2 Criar a tabela
1. Menu lateral → **SQL Editor** → **New query**.
2. Cole todo o conteúdo de [`supabase/schema.sql`](../supabase/schema.sql) e clique **Run**.
3. Confira em **Table Editor** → deve existir `user_data` com o selo **RLS enabled**.

### 1.3 Pegar as chaves
**Project Settings → API** (ou **Connect** no topo):
- **Project URL** → vai em `VITE_SUPABASE_URL`
- **anon / publishable key** → vai em `VITE_SUPABASE_ANON_KEY`

> ⚠️ **Nunca** use a `service_role` / `secret` key no frontend: ela ignora o RLS.

### 1.4 Autenticação
**Authentication → Sign In / Providers → Email**: deixe habilitado.
- *Confirm email* ligado (padrão) = precisa clicar no link do e-mail antes de entrar.

**Authentication → URL Configuration** (importante para o link de confirmação):
- **Site URL**: a URL da Vercel, ex.: `https://salary-seunome.vercel.app`
  (enquanto não tiver, use `http://localhost:5173`)
- **Redirect URLs**: adicione `http://localhost:5173` e `https://*.vercel.app` (cobre os previews).

### 1.5 Depois de criar sua conta: fechar o cadastro
O app é pessoal. Após criar **sua** conta, vá em **Authentication → Sign In / Providers** e
desligue **Allow new users to sign up**. Assim ninguém mais cria conta no seu site.
(Mesmo se criassem, o RLS impediria de ver seus dados — isso só evita lixo no banco.)

---

## 2. Rodar local com a Supabase

```bash
cd frontend
cp .env.example .env.local   # depois edite com a URL e a anon key
npm run dev
```

- Com as variáveis → aparece a tela de login.
- Sem as variáveis → o app roda no modo antigo (só localStorage, sem login).

**Primeiro login:** os dados que já estavam no localStorage deste navegador são enviados
para a Supabase automaticamente (só as fatias que ainda não existem no banco).
Depois disso o banco é a fonte da verdade.

---

## 3. Vercel

1. Suba o código no GitHub (`git push`).
2. https://vercel.com → entre com o GitHub → **Add New… → Project** → importe `SalaryManagement`.
3. Configure:
   | Campo | Valor |
   | --- | --- |
   | **Root Directory** | `frontend` (clique *Edit*) |
   | Framework Preset | Vite (detectado sozinho) |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |
4. **Environment Variables** → adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
   (marque Production, Preview e Development).
5. **Deploy**. Copie a URL gerada e volte ao passo **1.4** para colocá-la como *Site URL*.

Notas:
- Variáveis `VITE_*` são embutidas **no build**. Se mudar uma delas na Vercel, faça **Redeploy**.
- Não precisa de `vercel.json`: o app usa rotas com `#` (`/#/cloud`), então a Vercel sempre serve o `index.html`.
- Cada `git push` na `main` gera deploy de produção; outras branches/PRs geram previews.

---

## 4. Checklist de verificação
- [ ] Login funciona em produção.
- [ ] Menu do avatar mostra 🟢 **Sincronizado na nuvem** depois de editar algo.
- [ ] Em **Table Editor → user_data** aparecem as linhas (`incomes`, `fixed`, ...).
- [ ] Abrindo em outro navegador/celular e logando, os mesmos dados aparecem.
- [ ] Cadastro de novos usuários desligado (1.5).

## Problemas comuns
| Sintoma | Causa provável |
| --- | --- |
| Tela branca na Vercel | Root Directory não está em `frontend`. |
| App abre sem tela de login na Vercel | Variáveis não configuradas, ou adicionadas sem redeploy. |
| "Erro ao sincronizar" | `schema.sql` não foi executado, ou chave/URL erradas. Veja o console (F12). |
| Link do e-mail leva para `localhost` | *Site URL* ainda está como localhost (passo 1.4). |
| "Email not confirmed" | Clique no link de confirmação no seu e-mail. |
