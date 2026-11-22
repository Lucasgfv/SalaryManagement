import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { DataProvider } from "./store.jsx";
import AuthGate from "./components/AuthGate.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthGate>
      {/* key: remount the store (and reload data) when the logged user changes */}
      {(user) => (
        <DataProvider key={user?.id ?? "local"} user={user}>
          <App />
        </DataProvider>
      )}
    </AuthGate>
  </StrictMode>,
);
