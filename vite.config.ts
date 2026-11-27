import fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const root = path.dirname(fileURLToPath(import.meta.url));
const dataRoot = path.resolve(root, "client_wise_data");

function clientBooks(): Plugin {
  const handle = async (req: IncomingMessage, res: ServerResponse, next: (error?: unknown) => void) => {
    const url = req.url?.split("?")[0];
    if (url !== "/api/client/version" && url !== "/api/client/data") {
      next();
      return;
    }
    if (req.method !== "POST") {
      send(res, 405, { error: "POST only" });
      return;
    }
    try {
      const body = JSON.parse(await readBody(req)) as { code?: unknown };
      const code = typeof body.code === "string" ? body.code.trim() : "";
      if (!/^[A-Za-z][A-Za-z]*_[0-9]{4}$/.test(code)) {
        send(res, 404, { error: "not-found" });
        return;
      }
      const dir = clientDir(code);
      if (!dir) {
        send(res, 404, { error: "not-found" });
        return;
      }
      const versionPath = versionFile(dir);
      if (!versionPath) {
        send(res, 404, { error: "not-found" });
        return;
      }
      const version = JSON.parse(fs.readFileSync(versionPath, "utf8")) as { file?: unknown };
      const file = typeof version.file === "string" ? safeJsonName(version.file) : null;
      if (!file) {
        send(res, 404, { error: "not-found" });
        return;
      }
      if (url === "/api/client/version") {
        send(res, 200, version);
        return;
      }
      const dataPath = path.resolve(dir, file);
      if (!fs.existsSync(dataPath)) {
        send(res, 404, { error: "not-found" });
        return;
      }
      send(res, 200, JSON.parse(fs.readFileSync(dataPath, "utf8")));
    } catch {
      send(res, 400, { error: "unreadable" });
    }
  };
  return {
    name: "client-books",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        void handle(req, res, next);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        void handle(req, res, next);
      });
    },
  };
}

function clientDir(password: string) {
  if (!fs.existsSync(dataRoot)) return null;
  for (const name of fs.readdirSync(dataRoot)) {
    if (!name.startsWith("client_")) continue;
    const dir = path.resolve(dataRoot, name);
    const relative = path.relative(dataRoot, dir);
    if (relative.startsWith("..") || path.isAbsolute(relative) || !fs.existsSync(dir)) continue;
    const versionPath = versionFile(dir);
    if (!versionPath) continue;
    const version = JSON.parse(fs.readFileSync(versionPath, "utf8")) as { password?: unknown };
    if (version.password === password) return dir;
  }
  return null;
}

function versionFile(dir: string) {
  const preferred = path.join(dir, "version.json");
  if (fs.existsSync(preferred)) return preferred;
  const found = fs.readdirSync(dir).filter((name) => name.endsWith(".version.json"));
  return found.length === 1 ? path.join(dir, found[0]) : null;
}

function safeJsonName(file: string) {
  if (file !== path.basename(file)) return null;
  if (!/^[A-Za-z0-9._-]+\.json$/.test(file)) return null;
  return file;
}

function readBody(req: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > 4096) {
        reject(new Error("body"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(body));
}

export default defineConfig({
  plugins: [react(), tailwindcss(), clientBooks()],
  resolve: {
    dedupe: ["react", "react-dom", "react-router"],
  },
  server: {
    port: 5174,
    host: "127.0.0.1",
    // The design package is linked with file:, so its fonts live next door.
    fs: { allow: [root, path.resolve(root, "../cagrmeister-design")] },
    watch: { ignored: ["**/client_wise_data/**"] },
  },
});
