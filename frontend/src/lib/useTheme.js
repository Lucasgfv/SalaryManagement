import { useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage.js";

// Light/dark theme. Tailwind's `dark:` variant is bound to the `.dark` class on <html>
// (see index.css), so toggling the class switches every component at once.
// First visit follows the OS preference; after that the user's choice is remembered.
export function useTheme() {
  const [theme, setTheme] = useLocalStorage("salary:theme", () =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return [theme, toggle];
}
