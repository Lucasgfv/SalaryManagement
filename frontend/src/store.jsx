// Global data store: every slice lives in localStorage and is shared via React Context,
// so the navbar alerts and all pages read the same data.
//
// When logged in to Supabase, localStorage works as a cache and the table `user_data`
// is the source of truth: on mount we download it, and every change is uploaded
// (debounced) as one row per slice.
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorage } from "./lib/useLocalStorage.js";
import { createSeed, emptyData } from "./lib/seed.js";
import { supabase } from "./lib/supabase.js";
import { Splash } from "./components/AuthGate.jsx";

const DataContext = createContext(null);

const KEYS = [
  "incomes",
  "fixed",
  "variable",
  "fixedPaid",
  "services",
  "cloudSettings",
  "apps",
  "ideas",
  "languages",
  "words",
  "freelances",
  "freelanceFiles", // screenshots (data URLs) kept apart so editing a job doesn't re-upload images
];

const SAVE_DELAY = 800; // ms without changes before uploading (avoids one request per keystroke)

// Seed is created once per page load and only used for keys not yet in storage.
let seedCache;
const seed = () => (seedCache ??= createSeed());
// Slices added in later versions (e.g. freelances) start EMPTY for someone who already
// has data, so demo values never get mixed into real numbers. Fresh installs get the demo.
const hasData = () => localStorage.getItem("salary:incomes") !== null;
const initial = (key) => (hasData() ? emptyData()[key] : seed()[key]);

// sync: "local" (no Supabase) | "loading" | "saving" | "synced" | "error"
export function DataProvider({ user, children }) {
  // One persisted state per slice. Hooks must be called in a fixed order — KEYS never changes.
  const slices = {};
  for (const key of KEYS) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    slices[key] = useLocalStorage(`salary:${key}`, () => initial(key));
  }
  const values = KEYS.map((k) => slices[k][0]);
  const loadAll = (next) => KEYS.forEach((k) => next[k] !== undefined && slices[k][1](next[k]));

  const [sync, setSync] = useState(user ? "loading" : "local");
  const lastSynced = useRef({}); // key → JSON string of what the DB currently has
  const timer = useRef();

  // 1) Download: on login, the DB wins over whatever is in this browser.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase
      .from("user_data")
      .select("key, value")
      .then(({ data: rows, error }) => {
        if (cancelled) return;
        if (error) return setSync("error");
        for (const r of rows) lastSynced.current[r.key] = JSON.stringify(r.value);
        loadAll(Object.fromEntries(rows.map((r) => [r.key, r.value])));
        // Slices missing in the DB stay "dirty" → the upload effect sends them.
        // That's how the existing localStorage data migrates on the first login.
        setSync("synced");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 2) Upload: compare each slice with the last version saved; send only what changed.
  const loading = sync === "loading";
  useEffect(() => {
    if (!user || loading) return;
    const dirty = KEYS.filter((k) => JSON.stringify(slices[k][0]) !== lastSynced.current[k]);
    if (!dirty.length) return;

    setSync("saving");
    clearTimeout(timer.current); // a new change restarts the countdown
    timer.current = setTimeout(async () => {
      const rows = dirty.map((k) => ({ user_id: user.id, key: k, value: slices[k][0] }));
      const { error } = await supabase.from("user_data").upsert(rows, { onConflict: "user_id,key" });
      if (error) return setSync("error");
      for (const r of rows) lastSynced.current[r.key] = JSON.stringify(r.value);
      setSync("synced");
    }, SAVE_DELAY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, ...values]);

  useEffect(() => () => clearTimeout(timer.current), []); // stop pending upload on unmount (logout)

  // Warn before closing the tab while a save is pending
  useEffect(() => {
    if (sync !== "saving") return;
    const warn = (e) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [sync]);

  const value = useMemo(() => {
    const data = Object.fromEntries(KEYS.map((k) => [k, slices[k][0]]));
    const setters = Object.fromEntries(
      KEYS.map((k) => [`set${k[0].toUpperCase()}${k.slice(1)}`, slices[k][1]]),
    );
    return {
      ...data,
      ...setters,
      user,
      sync,
      signOut: async () => {
        await supabase.auth.signOut();
        // Don't leave financial data cached in this browser after logout
        KEYS.forEach((k) => localStorage.removeItem(`salary:${k}`));
      },
      exportAll: () => data,
      loadAll,
      resetDemo: () => {
        seedCache = createSeed();
        loadAll(seedCache);
      },
      resetEmpty: () => loadAll(emptyData()),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...values, user, sync]);

  if (loading) return <Splash text="Carregando seus dados..." />;
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
