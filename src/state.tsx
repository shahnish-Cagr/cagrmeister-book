import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import toast, { dismissAll } from "toast-anchor";
import { booksFromOutput } from "./client/adapt";
import { isPassword, loadClient } from "./client/api";
import { readClient, saveClient } from "./client/db";
import { BOOKS, bookGroups, installBooks, type Book, type BookId, type ContextId, type PeriodId } from "./data/book";
import { clearState, readState, writeState } from "./persist";

export type SyncStatus = "ready" | "offline" | "syncing" | "failed" | "done";

type Portal = {
  bookId: BookId;
  setBook: (id: BookId) => void;
  context: ContextId;
  setContext: (id: ContextId) => void;
  hidden: boolean;
  setHidden: (value: boolean) => void;
  period: PeriodId;
  setPeriod: (id: PeriodId) => void;
  offline: boolean;
  setOffline: (value: boolean) => void;
  status: SyncStatus;
  lastSync: string;
  syncNow: () => void;
  contextOpen: boolean;
  setContextOpen: (value: boolean) => void;
  code: string | null;
  booting: boolean;
  gateError: string | null;
  signIn: (code: string) => Promise<string | null>;
  signOut: () => void;
};

const Ctx = createContext<Portal | null>(null);
const CODE_KEY = "cagr-client-code";
const PERIODS = new Set<PeriodId>(["1m", "3m", "6m", "1y", "3y", "5y", "all"]);

type ViewState = { context: string; hidden: boolean; period: PeriodId };

const EMPTY_VIEW: ViewState = { context: "family", hidden: false, period: "1y" };

function isView(value: unknown): value is ViewState {
  if (!value || typeof value !== "object") return false;
  const row = value as ViewState;
  return typeof row.context === "string" && typeof row.hidden === "boolean" && PERIODS.has(row.period);
}

function contextExists(book: Book, id: string) {
  if (id === "family") return true;
  if (id.startsWith("g:")) return bookGroups(book).some((group) => group.id === id.slice(2));
  return book.members.some((member) => member.id === id);
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function versionLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PortalProvider({ children }: { children: ReactNode }) {
  const [bookId, setBookId] = useState<BookId>("bhuta");
  const [context, setContext] = useState<ContextId>("family");
  const [hidden, setHidden] = useState(false);
  const [period, setPeriod] = useState<PeriodId>("1y");
  const [forcedOffline, setForcedOffline] = useState(false);
  const [browserOffline, setBrowserOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );
  const [phase, setPhase] = useState<"idle" | "syncing" | "done" | "failed">("idle");
  const [lastSync, setLastSync] = useState("");
  const [contextOpen, setContextOpen] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [booting, setBooting] = useState(() => Boolean(localStorage.getItem(CODE_KEY)));
  const [gateError, setGateError] = useState<string | null>(null);
  const viewReady = useRef(false);
  const offline = forcedOffline || browserOffline;
  const status: SyncStatus = phase === "syncing"
    ? "syncing"
    : phase === "done"
      ? "done"
      : phase === "failed"
        ? "failed"
        : offline
          ? "offline"
          : "ready";

  function showBook(output: unknown, updatedAt: string, nextCode: string, applySaved: boolean) {
    const books = booksFromOutput(output);
    if (!books.length) return "This client's file could not be read.";
    installBooks(books);
    setBookId(books[0].id);
    if (applySaved) {
      const saved = readState(nextCode, "view", EMPTY_VIEW, isView);
      setContext(contextExists(books[0], saved.context) ? saved.context as ContextId : "family");
      setHidden(saved.hidden);
      setPeriod(saved.period);
    }
    viewReady.current = true;
    setCode(nextCode);
    setLastSync(updatedAt ? versionLabel(updatedAt) : lastSync);
    localStorage.setItem(CODE_KEY, nextCode);
    setGateError(null);
    return null;
  }

  async function openCode(nextCode: string, allowNetwork: boolean, resetContext: boolean) {
    const saved = await readClient(nextCode).catch(() => null);
    if (!allowNetwork) {
      if (!saved) return "You're offline, and this code is not saved on this device.";
      return showBook(saved.output, saved.updatedAt, nextCode, resetContext);
    }
    const result = await loadClient(nextCode, saved?.updatedAt ?? null, saved?.output ?? null);
    if (result.kind === "missing") return "That code was not found.";
    if (result.kind === "unreachable") {
      if (result.output != null) {
        return showBook(result.output, result.version?.updatedAt ?? saved?.updatedAt ?? "", nextCode, resetContext);
      }
      return "The book could not be reached. Try again.";
    }
    if (result.kind === "imported") {
      const updatedAt = result.version.updatedAt ?? "";
      try {
        await saveClient({
          code: nextCode,
          updatedAt,
          clientId: result.version.clientId ?? "",
          file: result.version.file ?? "",
          output: result.output,
          savedAt: new Date().toISOString(),
        });
      } catch {
        // The book still opens. The next login will import it again.
      }
      return showBook(result.output, updatedAt, nextCode, resetContext);
    }
    return showBook(result.output, result.version.updatedAt ?? saved?.updatedAt ?? "", nextCode, resetContext);
  }

  useEffect(() => {
    const on = () => setBrowserOffline(false);
    const off = () => setBrowserOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    if (!offline && phase === "failed") setPhase("idle");
  }, [offline, phase]);

  useEffect(() => {
    const stored = localStorage.getItem(CODE_KEY);
    if (!stored) {
      setBooting(false);
      return;
    }
    let cancel = false;
    setPhase("syncing");
    void openCode(stored, navigator.onLine, true).then((error) => {
      if (cancel) return;
      if (error) {
        localStorage.removeItem(CODE_KEY);
        setCode(null);
        setGateError(error);
        setPhase("idle");
      } else {
        setPhase("idle");
      }
      setBooting(false);
    });
    return () => {
      cancel = true;
    };
    // Restore the saved code once, when the portal opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!code || !viewReady.current) return;
    writeState(code, "view", { context, hidden, period });
  }, [code, context, hidden, period]);

  const api = useMemo<Portal>(() => ({
    bookId,
    setBook: (id: BookId) => {
      setBookId(id);
      setContext("family");
    },
    context,
    setContext,
    hidden,
    setHidden,
    period,
    setPeriod,
    offline,
    setOffline: setForcedOffline,
    status: offline && status !== "syncing" && status !== "failed" ? "offline" : status,
    lastSync,
    contextOpen,
    setContextOpen,
    code,
    booting,
    gateError,
    signIn: async (raw: string) => {
      const nextCode = raw.trim();
      if (!isPassword(nextCode)) return "Use an initial, a surname, and four digits.";
      setPhase("syncing");
      const error = await openCode(nextCode, !offline, true);
      if (error) {
        setPhase("idle");
        return error;
      }
      setPhase("done");
      const name = BOOKS[0]?.name;
      toast.success(name ? `Signed in to ${name}` : "Signed in", {
        description: "Your book is open.",
        showProgress: true,
      });
      window.setTimeout(() => setPhase("idle"), 1800);
      return null;
    },
    signOut: () => {
      viewReady.current = false;
      if (code) clearState(code);
      localStorage.removeItem(CODE_KEY);
      setCode(null);
      setContext("family");
      setHidden(false);
      setPeriod("1y");
      setContextOpen(false);
      setPhase("idle");
      setGateError(null);
      dismissAll();
    },
    syncNow: () => {
      if (!code) return;
      if (offline) {
        setPhase("failed");
        return;
      }
      setPhase("syncing");
      void openCode(code, true, false).then((error) => {
        if (error) {
          setPhase("failed");
          return;
        }
        setPhase("done");
        window.setTimeout(() => setPhase("idle"), 1800);
      });
    },
  }), [bookId, context, hidden, period, offline, status, lastSync, contextOpen, code, booting, gateError]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function usePortal() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePortal outside PortalProvider");
  return ctx;
}
