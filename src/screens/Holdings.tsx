import { useMemo } from "react";
import { bookById, bookCategories, highlights, positionsFor, totals } from "../data/book";
import { Empty, HoldingRow, Money, Pager, usePaged } from "../components";
import { usePersistedState } from "../persist";
import { usePortal } from "../state";

const SORTS = [
  { id: "name", label: "Name" },
  { id: "value", label: "Value" },
  { id: "unrealised", label: "Return" },
] as const;

const PHONE_SORTS = [
  { id: "name", label: "Name" },
  { id: "value", label: "Value" },
  { id: "unrealised", label: "Unrealised %" },
  { id: "realised", label: "Realised ₹" },
] as const;

type SortId = (typeof PHONE_SORTS)[number]["id"];
type SortDir = "asc" | "desc";
type HoldingsFilters = {
  query: string;
  category: string;
  result: "all" | "up" | "down";
  sort: SortId;
  dir: SortDir;
  page: number;
};

const HOLDINGS_DEFAULT: HoldingsFilters = {
  query: "",
  category: "all",
  result: "all",
  sort: "value",
  dir: "desc",
  page: 0,
};

function isHoldings(value: unknown): value is HoldingsFilters {
  if (!value || typeof value !== "object") return false;
  const row = value as HoldingsFilters;
  return typeof row.query === "string"
    && typeof row.category === "string"
    && (row.result === "all" || row.result === "up" || row.result === "down")
    && (row.sort === "name" || row.sort === "value" || row.sort === "unrealised" || row.sort === "realised")
    && (row.dir === "asc" || row.dir === "desc")
    && Number.isInteger(row.page)
    && row.page >= 0;
}

export function Holdings() {
  const { bookId, context, code } = usePortal();
  const book = bookById(bookId);
  const rows = positionsFor(bookId, context);
  const all = positionsFor(bookId, context, false);
  const facts = highlights(rows, all);
  const [filters, setFilters] = usePersistedState(code, "holdings", HOLDINGS_DEFAULT, isHoldings);
  const { query, category, result, sort, dir } = filters;
  const setQuery = (next: string) => setFilters((current) => ({ ...current, query: next }));
  const setCategory = (next: string) => setFilters((current) => ({ ...current, category: next }));
  const setResult = (next: HoldingsFilters["result"]) => setFilters((current) => ({ ...current, result: next }));
  const sectors = [...new Set(rows.map((row) => row.sector))];
  const categories = bookCategories(book).length
    ? bookCategories(book)
    : [...new Map(rows.filter((row) => row.sleeve).map((row) => [row.sleeve, { id: row.sleeve as string, label: row.sector || row.sleeve as string }])).values()];
  const selected = categories.some((item) => item.id === category) ? category : "all";
  const scoped = selected === "all" ? all : all.filter((row) => row.sleeve === selected);
  const sum = totals(scoped);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      const hay = `${row.name} ${row.symbol} ${row.sector}`.toLowerCase();
      if (q && !hay.includes(q)) return false;
      if (selected !== "all" && row.sleeve !== selected) return false;
      const move = row.unrealisedPct ?? row.gainPct;
      if (result === "up" && move <= 0) return false;
      if (result === "down" && move >= 0) return false;
      return true;
    });
    const copy = [...filtered];
    copy.sort((a, b) => {
      const raw = sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "realised"
          ? a.realised - b.realised
          : sort === "value"
            ? a.value - b.value
            : (a.unrealisedPct ?? a.gainPct) - (b.unrealisedPct ?? b.gainPct);
      return dir === "asc" ? raw : -raw;
    });
    return copy;
  }, [rows, query, selected, result, sort, dir]);

  const pageSize = 8;
  const paged = usePaged(visible, pageSize, `${query}|${selected}|${result}|${sort}|${dir}|${bookId}|${context}`, filters.page, (page) => {
    setFilters((current) => (current.page === page ? current : { ...current, page }));
  });
  function turn(next: number) {
    paged.setPage(next);
    window.scrollTo({ top: 0 });
  }
  function pick(next: SortId) {
    setFilters((current) => (
      next === current.sort
        ? { ...current, dir: current.dir === "asc" ? "desc" : "asc" }
        : { ...current, sort: next, dir: "asc" }
    ));
  }

  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">Portfolio</p>
        <h1>Holdings</h1>
        <p><span className="num">{facts.holdingCount}</span> securities across <span className="num">{sectors.length}</span> sectors</p>
      </header>
      {categories.length ? (
        <div className="chip-row category-row" role="group" aria-label="Category">
          <button type="button" className={selected === "all" ? "active" : ""} onClick={() => setCategory("all")}>All</button>
          {categories.map((item) => (
            <button key={item.id} type="button" className={selected === item.id ? "active" : ""} onClick={() => setCategory(item.id)}>{item.label}</button>
          ))}
        </div>
      ) : null}
      <section className="summary-band">
        <div className="metric"><span>{sum.priced ? "Current value" : "Book value"}</span><strong><Money value={sum.value} /></strong></div>
        <div className="metric"><span>Unrealised gain</span><strong><Money value={sum.gain} signed /></strong></div>
        <div className="metric"><span>Realised gain</span><strong><Money value={sum.realised} signed /></strong></div>
      </section>
      <div className="search-row">
        <label className="search-box">
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search holdings" aria-label="Search holdings" />
        </label>
      </div>
      <div className="chip-row" role="group" aria-label="Result">
        {([["all", "All"], ["up", "Gainers"], ["down", "Decliners"]] as const).map(([id, label]) => (
          <button key={id} type="button" className={result === id ? "active" : ""} onClick={() => setResult(id)}>{label}</button>
        ))}
      </div>
      <div className="list-head"><span><span className="num">{visible.length}</span> holdings</span></div>
      <div className="sort-pills" role="group" aria-label="Sort holdings">
        {PHONE_SORTS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={sort === item.id ? "on" : ""}
            aria-sort={sort === item.id ? (dir === "asc" ? "ascending" : "descending") : "none"}
            onClick={() => pick(item.id)}
          >
            {item.label}
            <SortChevron dir={sort === item.id ? dir : "desc"} />
          </button>
        ))}
      </div>
      <div className="holding-list">
        <div className="holding-columns" role="group" aria-label="Sort holdings">
          <span />
          {SORTS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={sort === item.id ? "on" : ""}
              aria-sort={sort === item.id ? (dir === "asc" ? "ascending" : "descending") : "none"}
              onClick={() => pick(item.id)}
            >
              {item.label}
              <SortArrows active={sort === item.id} dir={dir} />
            </button>
          ))}
          <span />
        </div>
        {visible.length === 0 ? <Empty>Nothing matches this search.</Empty> : paged.slice.map((row) => <HoldingRow key={row.id} row={row} />)}
      </div>
      <Pager page={paged.page} pages={paged.pages} total={visible.length} start={paged.start} size={pageSize} onPage={turn} />
    </>
  );
}

function SortChevron({ dir }: { dir: SortDir }) {
  return (
    <svg className="sort-chevron" viewBox="0 0 10 10" aria-hidden="true">
      <path d={dir === "asc" ? "M2 6.5 5 3.5 8 6.5" : "M2 3.5 5 6.5 8 3.5"} />
    </svg>
  );
}

function SortArrows({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className="sort-arrows" aria-hidden="true">
      <svg className={active && dir === "desc" ? "on" : ""} viewBox="0 0 8 14"><path d="M4 1v8M2.2 6.2 4 12.4 5.8 6.2" /></svg>
      <svg className={active && dir === "asc" ? "on" : ""} viewBox="0 0 8 14"><path d="M4 13V5M2.2 7.8 4 1.6l1.6 6.2" /></svg>
    </span>
  );
}
