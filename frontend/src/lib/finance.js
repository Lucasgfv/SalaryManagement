// Pure functions that turn the raw entries into the numbers shown on the Home page.
import { freelanceIncomes } from "./freelance.js";

export const CATEGORIES = [
  "Moradia",
  "Alimentação",
  "Transporte",
  "Saúde",
  "Lazer",
  "Educação",
  "Assinaturas",
  "Cloud",
  "Outros",
];

// A fixed expense counts for every month between startMonth and endMonth (inclusive).
export function fixedApplies(f, month) {
  return f.startMonth <= month && (!f.endMonth || month <= f.endMonth);
}

const sum = (list) => list.reduce((acc, item) => acc + Number(item.amount || 0), 0);

// Paid freelance jobs are merged into the income of their month (single source of truth:
// the job lives only in `freelances`, it is never copied into `incomes`).
export function monthSummary({ incomes, variable, fixed, freelances }, month) {
  const freelanceItems = freelanceIncomes(freelances, month);
  const incomeItems = [...incomes.filter((i) => i.month === month), ...freelanceItems];
  const variableItems = variable.filter((v) => v.month === month);
  const fixedItems = fixed.filter((f) => fixedApplies(f, month));

  const income = sum(incomeItems);
  const fixedTotal = sum(fixedItems);
  const variableTotal = sum(variableItems);
  const spent = fixedTotal + variableTotal;
  const balance = income - spent;

  // Group fixed + variable by category, biggest first
  const map = new Map();
  for (const item of [...fixedItems, ...variableItems]) {
    map.set(item.category, (map.get(item.category) || 0) + Number(item.amount));
  }
  const byCategory = [...map.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  return {
    incomeItems,
    freelanceItems,
    freelanceTotal: sum(freelanceItems),
    variableItems,
    fixedItems,
    income,
    fixedTotal,
    variableTotal,
    spent,
    balance,
    savingsRate: income > 0 ? balance / income : 0,
    byCategory,
  };
}
