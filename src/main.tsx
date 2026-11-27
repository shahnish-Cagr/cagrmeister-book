import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { configure } from "toast-anchor";
import { audit } from "./data/book";
import { App } from "./App";
import "./index.css";

configure({
  position: "top-right",
  duration: 4000,
  sound: false,
  showProgress: true,
  theme: {
    success: { bg: "#0c7a45", light: "#e5f3ec" },
  },
  toast: {
    width: "min(316px, calc(100vw - 3rem))",
    color: "#1c1917",
    descColor: "#6f685f",
    borderColor: "#e4e6ea",
  },
});

audit();

const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
