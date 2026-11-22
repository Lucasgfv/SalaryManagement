// Example data shown on first run so the dashboard isn't empty.
// Can be wiped from the avatar menu ("Começar do zero").
import { monthKey, shiftMonth, uid } from "./format.js";
import { monthBounds, DAY } from "./cloud.js";
import { defaultLanguages } from "./languages.js";
import { todayISO } from "./freelance.js";

export function createSeed() {
  const cm = monthKey();
  const months = Array.from({ length: 6 }, (_, i) => shiftMonth(cm, i - 5)); // oldest → current

  const incomes = months.flatMap((month, i) => [
    { id: uid(), month, description: "Salário", amount: 4800 + (i >= 3 ? 300 : 0) },
  ]);

  const fixed = [
    ["Aluguel", "Moradia", 1500, 5],
    ["Internet", "Moradia", 110, 10],
    ["Academia", "Saúde", 99, 8],
    ["Curso / faculdade", "Educação", 420, 12],
    ["Streaming", "Assinaturas", 45, 20],
  ].map(([description, category, amount, dueDay]) => ({
    id: uid(),
    description,
    category,
    amount,
    dueDay,
    startMonth: months[0],
    endMonth: null,
  }));

  const variable = months.flatMap((month, i) => [
    { id: uid(), month, description: "Mercado", category: "Alimentação", amount: 620 + ((i * 47) % 180) },
    { id: uid(), month, description: "Uber / ônibus", category: "Transporte", amount: 140 + ((i * 31) % 90) },
    { id: uid(), month, description: "Restaurantes", category: "Lazer", amount: 180 + ((i * 53) % 160) },
    { id: uid(), month, description: "Farmácia", category: "Saúde", amount: 40 + ((i * 17) % 60) },
  ]);

  const { start } = monthBounds();
  const services = [
    ["API (EC2 t3.small)", "AWS", "hourly", 0.0208, true],
    ["Banco (RDS t4g.micro)", "AWS", "hourly", 0.016, true],
    ["Site / frontend", "Vercel", "monthly", 20, true],
    ["Worker (Cloud Run)", "GCP", "monthly", 6, true],
    ["Droplet de testes", "DigitalOcean", "hourly", 0.009, false],
  ].map(([name, provider, billing, rate, running]) => ({
    id: uid(),
    name,
    provider,
    billing,
    rate,
    // the stopped one ran for 3 days at the start of the month
    periods: [{ start, end: running ? null : start + 3 * DAY }],
  }));

  const now = new Date().toISOString();
  const apps = [
    {
      name: "Site pessoal",
      description: "Portfólio com projetos e contato.",
      url: "https://example.com",
      repo: "",
      stack: "React, Vite, Tailwind",
      status: "online",
    },
    {
      name: "Planner de corrida IA",
      description: "Gera treinos semanais a partir do histórico.",
      url: "",
      repo: "",
      stack: "FastAPI, React, PostgreSQL",
      status: "dev",
    },
    {
      name: "Agente de e-mail",
      description: "Resume e classifica e-mails automaticamente.",
      url: "",
      repo: "",
      stack: "Python, Gmail API",
      status: "offline",
    },
    {
      name: "Downloader de áudio",
      description: "Baixa e converte áudio/vídeo.",
      url: "",
      repo: "",
      stack: "Python, yt-dlp",
      status: "done",
    },
  ].map((a) => ({ id: uid(), createdAt: now, lastCheck: null, latency: null, ...a }));

  const ideas = [
    ["Agente de WhatsApp", "Responder clientes com IA e agenda integrada.", "IA", "alta", "validando"],
    ["Integração AWS Cost Explorer", "Puxar custo real da AWS no lugar da estimativa.", "Cloud", "alta", "ideia"],
    ["Metas de economia", "Definir meta mensal e acompanhar no Início.", "Finanças", "média", "fazendo"],
    ["Modo escuro", "Tema dark para o painel.", "UI", "baixa", "ideia"],
    ["Backup em JSON", "Exportar/importar todos os dados.", "Dados", "média", "feito"],
  ].map(([title, description, tag, priority, status]) => ({
    id: uid(),
    title,
    description,
    tag,
    priority,
    status,
    createdAt: now,
  }));

  return {
    incomes,
    fixed,
    variable,
    fixedPaid: { [cm]: [fixed[0].id, fixed[1].id] },
    services,
    cloudSettings: { currency: "USD", budget: 45 },
    apps,
    ideas,
    languages: defaultLanguages(),
    words: [],
    // freelas on odd months (they used to be plain "Freela" incomes)
    freelances: months
      .map((month, i) => ({ month, i }))
      .filter(({ i }) => i % 2 === 1)
      .map(({ month, i }) => ({
        id: uid(),
        title: ["Landing page", "Dashboard em React", "Ajustes no site"][i % 3],
        amount: 600 + i * 120,
        date: month === cm ? todayISO() : `${month}-15`,
        status: "pago",
        client: { name: ["Ana Souza", "Bruno Lima", "Carla Dias"][i % 3], company: "", contact: "", },
        notes: "",
        hasImage: false,
      })),
    freelanceFiles: {},
  };
}

export function emptyData() {
  return {
    incomes: [],
    fixed: [],
    variable: [],
    fixedPaid: {},
    services: [],
    cloudSettings: { currency: "USD", budget: 50 },
    apps: [],
    ideas: [],
    languages: defaultLanguages(),
    words: [],
    freelances: [],
    freelanceFiles: {},
  };
}
