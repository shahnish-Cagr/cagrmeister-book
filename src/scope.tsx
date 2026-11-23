import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { type BookId, type ScopeId, visibleHoldings, type Holding } from "./book";

type Scope = {
  book: BookId;
  scope: ScopeId;
  setBook: (next: BookId) => void;
  setScope: (next: ScopeId) => void;
  rows: Holding[];
  reset: () => void;
};

const Ctx = createContext<Scope | null>(null);

function readBook(): BookId {
  try {
    return sessionStorage.getItem("cagr-book") === "fo" ? "fo" : "inv";
  } catch {
    return "inv";
  }
}

function readScope(): ScopeId {
  try {
    return sessionStorage.getItem("cagr-scope") === "monica" ? "monica" : "family";
  } catch {
    return "family";
  }
}

function write(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Private mode: the choice lasts for this view only.
  }
}

export function BookProvider({ children }: { children: ReactNode }) {
  const [book, setBookState] = useState<BookId>(readBook);
  const [scope, setScopeState] = useState<ScopeId>(readScope);
  const rows = useMemo(() => visibleHoldings(book, scope), [book, scope]);

  const api = useMemo<Scope>(() => ({
    book,
    scope,
    rows,
    setBook: (next) => {
      write("cagr-book", next);
      setBookState(next);
    },
    setScope: (next) => {
      write("cagr-scope", next);
      setScopeState(next);
    },
    reset: () => {
      try {
        sessionStorage.removeItem("cagr-book");
        sessionStorage.removeItem("cagr-scope");
      } catch {
        // Nothing stored.
      }
      setBookState("inv");
      setScopeState("family");
    },
  }), [book, scope, rows]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useBook(): Scope {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBook outside BookProvider");
  return ctx;
}
