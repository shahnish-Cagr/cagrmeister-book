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
      const located = locate(code);
      if (!located) {
        send(res, 404, { error: "not-found" });
        return;
      }
      const version = JSON.parse(fs.readFileSync(located.versionPath, "utf8")) as Record<string, unknown>;
      if (url === "/api/client/version") {
        send(res, 200, publicVersion(version, path.basename(located.book)));
        return;
      }
      if (!fs.existsSync(located.book)) {
        send(res, 404, { error: "not-found" });
        return;
      }
      send(res, 200, JSON.parse(fs.readFileSync(located.book, "utf8")));
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

function locate(password: string) {
  const dir = path.join(dataRoot, `client_${password}`);
  const book = path.join(dir, `${password}.json`);
  const versionPath = path.join(dir, `${password}.version.json`);
  if (!fs.existsSync(book) || !fs.existsSync(versionPath)) return null;
  return { book, versionPath };
}

function publicVersion(version: Record<string, unknown>, file: string) {
  const text = (camel: string, snake: string) => {
    const value = version[camel] ?? version[snake];
    return typeof value === "string" ? value : undefined;
  };
  return {
    clientId: text("clientId", "client_id"),
    updatedAt: text("updatedAt", "updated_at"),
    asOf: text("asOf", "as_of"),
    file,
  };
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
    watch: { ignored: ["**/client_wise_data/**"] },
  },
});
