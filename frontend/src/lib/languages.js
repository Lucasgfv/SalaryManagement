// Vocabulary goals. Word frequency follows Zipf's law: a few words are used ALL the time
// ("the", "is", "и", "di"...) and most words are rare. That's why ~2,000 of the most
// frequent words (dictionary forms) already cover roughly 80% of everyday speech/text,
// even though a language has hundreds of thousands of words.
import { uid } from "./format.js";

export const COVERAGE_GOAL = 0.8;
export const DEFAULT_TARGET = 2000;

export function defaultLanguages() {
  return [
    { id: uid(), name: "Inglês", code: "EN", color: "#7b6cf6", target: DEFAULT_TARGET },
    { id: uid(), name: "Russo", code: "RU", color: "#f69e7b", target: DEFAULT_TARGET },
    { id: uid(), name: "Italiano", code: "IT", color: "#34d399", target: DEFAULT_TARGET },
  ];
}

// Estimated share of everyday usage covered by your `n` most frequent words.
// With Zipf (s = 1) coverage grows like a logarithm: coverage(n) ∝ ln(n) + γ.
// We scale it so that coverage(target) = 80% — e.g. target 2000 → 100 words ≈ 50%,
// which matches the classic frequency-list numbers. It is an estimate, not a test!
const GAMMA = 0.5772; // Euler–Mascheroni constant (appears in the harmonic sum)
export function estimatedCoverage(n, target = DEFAULT_TARGET) {
  if (n <= 0) return 0;
  const c = (COVERAGE_GOAL * (Math.log(n) + GAMMA)) / (Math.log(target) + GAMMA);
  return Math.min(0.98, c);
}

// Monday 00:00 of the week containing `date` (local time) — used to group words per week.
export function weekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

// Parse a pasted list: one word per line, "word - translation" / "word = translation" / "word;translation".
export function parseBulk(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [word, ...rest] = line.split(/\s+[-–=]\s+|;|\t/);
      return { word: word.trim(), translation: rest.join(" ").trim() };
    })
    .filter((w) => w.word);
}
