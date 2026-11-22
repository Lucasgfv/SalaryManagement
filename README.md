# Salary — painel financeiro pessoal

Painel para controlar salário, despesas fixas e variáveis, gastos de cloud em tempo real, status dos meus apps e um quadro de ideias.

## Páginas

| Aba | O que faz |
| --- | --- |
| **Início** | Receitas do mês, despesas fixas (recorrentes, com checklist de pago/atrasado) e variáveis; gastos por categoria; histórico de 6 meses. |
| **Cloud** | Cadastro de serviços (preço por hora ou por mês) com liga/desliga; contador ao vivo, projeção do mês, orçamento e gráficos. |
| **Apps** | Projetos com status (online, em desenvolvimento, offline, concluído) e verificação se a URL está respondendo. |
| **Ideias** | Kanban: Ideias → Validando → Fazendo → Feito, com tag, prioridade e busca. |

O sino mostra alertas (orçamento de cloud, apps offline, contas atrasadas). O menu do avatar exporta/importa backup em JSON.

## Tecnologias

- React 19 + Vite
- Tailwind CSS v4
- Recharts (gráficos) e lucide-react (ícones)
- Supabase (Auth + PostgreSQL) para salvar os dados na nuvem, com `localStorage` como cache
- Deploy na Vercel — passo a passo em [docs/DEPLOY.md](docs/DEPLOY.md)

## Como rodar

```bash
cd frontend
npm install
cp .env.example .env.local   # opcional: preencha para usar a Supabase
npm run dev
```

Sem `.env.local` o app roda só com `localStorage` (sem login).

Abra http://localhost:5173.

## Estrutura

```
frontend/src/
  App.jsx            # layout + roteamento por hash (#/home, #/cloud...)
  store.jsx          # estado global: localStorage + sync com a Supabase
  components/        # Navbar e componentes de UI (Card, StatCard, Tabs...)
  lib/               # cálculos (finance.js, cloud.js), formatação, dados de exemplo
  pages/             # Home, Cloud, Apps, Ideas
```

## Observações

- Os custos de cloud são **estimados** (tempo ligado × preço). Integração com APIs de billing (AWS Cost Explorer, GCP Billing) fica para o backend.
- A verificação de apps usa `fetch` com `mode: "no-cors"`: detecta se o site responde, mas não lê o código HTTP.
