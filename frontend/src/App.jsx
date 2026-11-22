import { useEffect, useState } from "react";
import { Briefcase, Cloud, House, Languages as LanguagesIcon, LayoutGrid, Lightbulb } from "lucide-react";
import Sidebar from "./components/Sidebar.jsx";
import Home from "./pages/Home.jsx";
import CloudPage from "./pages/Cloud.jsx";
import Apps from "./pages/Apps.jsx";
import Ideas from "./pages/Ideas.jsx";
import Languages from "./pages/Languages.jsx";
import Freelances from "./pages/Freelances.jsx";
import { useData } from "./store.jsx";

const PAGES = [
  { id: "home", label: "Início", icon: House, Component: Home },
  { id: "freelas", label: "Freelas", icon: Briefcase, Component: Freelances },
  { id: "cloud", label: "Cloud", icon: Cloud, Component: CloudPage },
  { id: "apps", label: "Apps", icon: LayoutGrid, Component: Apps },
  { id: "ideas", label: "Ideias", icon: Lightbulb, Component: Ideas },
  { id: "languages", label: "Línguas", icon: LanguagesIcon, Component: Languages },
];

// Tiny hash router (#/home, #/cloud...) — no need for react-router in a 6-page app.
function useHashRoute() {
  const read = () => window.location.hash.replace("#/", "") || "home";
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onChange = () => setRoute(read());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

export default function App() {
  const route = useHashRoute();
  const data = useData();
  const page = PAGES.find((p) => p.id === route) ?? PAGES[0];

  const { Component } = page;

  // Small counters next to each menu item (like "Roles 9" in the reference)
  const badges = {
    freelas: data.freelances.filter((f) => f.status === "pendente").length,
    apps: data.apps.length,
    ideas: data.ideas.filter((i) => i.status !== "feito").length,
  };
  const pages = PAGES.map((p) => ({ ...p, badge: badges[p.id] }));

  // Home is a one-screen dashboard on desktop: the content column is locked to the
  // viewport height (h-dvh) and <main> takes whatever is left (flex-1 + min-h-0).
  const fit = page.id === "home";
  return (
    <div className="lg:flex">
      <Sidebar pages={pages} current={page.id} data={data} />
      <div className={`mx-auto flex w-full max-w-7xl min-w-0 flex-col px-4 py-5 sm:px-6 lg:py-6 ${fit ? "lg:h-dvh" : "min-h-dvh"}`}>
        <main className="min-h-0 flex-1">
          <Component />
        </main>
        <footer className={`text-center text-xs text-zinc-400 ${fit ? "mt-3" : "mt-10"}`}>
          {data.user ? "Dados sincronizados na Supabase" : "Dados salvos neste navegador (localStorage)"} · exporte
          um backup pelo menu da conta
        </footer>
      </div>
    </div>
  );
}
