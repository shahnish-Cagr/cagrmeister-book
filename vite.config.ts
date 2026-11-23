import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ["react", "react-dom", "react-router"],
  },
  server: {
    port: 5174,
    host: "127.0.0.1",
    // The design package is linked with file:, so its fonts live next door.
    fs: { allow: [root, path.resolve(root, "../cagrmeister-design")] },
  },
});
