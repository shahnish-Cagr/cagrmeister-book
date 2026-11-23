import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { initTheme } from "@cagrmeister/design/theme";
import "@cagrmeister/design/fonts.css";
import "@cagrmeister/design/components.css";
import "@cagrmeister/design/table.css";
import "./index.css";
import { App } from "./App";

initTheme();

const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
