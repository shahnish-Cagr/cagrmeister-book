import { useEffect, useMemo, useRef, useState } from "react";
import { bookById, transactionsFor, type Side, type Transaction } from "../data/book";
import { Empty, Money, Pager, TxnRow, usePaged } from "../components";
import { usePersistedState } from "../persist";
import { usePortal } from "../state";

const CORPORATE: Side[] = ["split", "merger", "demerger", "bonus"];
const SIDES: { id: "all" | "buy" | "sell" | "dividend" | "corporate"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "buy", label: "Buy" },
  { id: "sell", label: "Sell" },
  { id: "dividend", label: "Dividend" },
  { id: "corporate", label: "Corporate" },
];

function isShown(side: Side) {
  return side === "buy" || side === "sell" || side === "dividend" || CORPORATE.includes(side);
}

function matchesFilter(side: Side, filter: (typeof SIDES)[number]["id"]) {
  if (filter === "all") return true;
  if (filter === "corporate") return CORPORATE.includes(side);
  return side === filter;
}

type TxnSide = (typeof SIDES)[number]["id"];
type TxnFilters = { query: string; side: TxnSide; from: string | null; to: string | null; page: number };

const TXN_DEFAULT: TxnFilters = { query: "", side: "all", from: null, to: null, page: 0 };

function isTxnFilters(value: unknown): value is TxnFilters {
  if (!value || typeof value !== "object") return false;
  const row = value as TxnFilters;
  const sides: TxnSide[] = ["all", "buy", "sell", "dividend", "corporate"];
  return typeof row.query === "string"
    && sides.includes(row.side)
    && (row.from === null || typeof row.from === "string")
    && (row.to === null || typeof row.to === "string")
    && Number.isInteger(row.page)
    && row.page >= 0;
}

export function Transactions() {
  const { bookId, context, code } = usePortal();
  const book = bookById(bookId);
  const source = transactionsFor(bookId, context).filter((txn) => isShown(txn.side));
  const [filters, setFilters] = usePersistedState(code, "transactions", TXN_DEFAULT, isTxnFilters);
  const { query, side, from, to } = filters;
  const setQuery = (next: string) => setFilters((current) => ({ ...current, query: next }));
  const setSide = (next: TxnSide) => setFilters((current) => ({ ...current, side: next }));
  const setFrom = (next: string | null) => setFilters((current) => ({ ...current, from: next }));
  const setTo = (next: string | null) => setFilters((current) => ({ ...current, to: next }));
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => book.asOf.slice(0, 7));
  const dateAnchor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setCursor((from ?? book.asOf).slice(0, 7));
  }, [open, from, book.asOf]);

  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent) {
      if (!dateAnchor.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const end = to ?? from;
    return source.filter((txn) => {
      const hay = `${txn.name} ${txn.symbol}`.toLowerCase();
      if (q && !hay.includes(q)) return false;
      if (!matchesFilter(txn.side, side)) return false;
      if (from && txn.date < from) return false;
      if (end && txn.date > end) return false;
      return true;
    });
  }, [source, query, side, from, to]);

  const buys = visible.filter((txn) => txn.side === "buy");
  const sells = visible.filter((txn) => txn.side === "sell");
  const buyTotal = buys.reduce((sum, txn) => sum + txn.amount, 0);
  const sellTotal = sells.reduce((sum, txn) => sum + txn.amount, 0);
  const pageSize = 8;
  const paged = usePaged(visible, pageSize, `${query}|${side}|${from}|${to}|${bookId}|${context}`, filters.page, (page) => {
    setFilters((current) => (current.page === page ? current : { ...current, page }));
  });
  const active = SIDES.find((item) => item.id === side);

  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">Activity</p>
        <h1>Transactions</h1>
        <p>Portfolio manager activity</p>
      </header>
      <section className="transaction-summary">
        <div><span>Total buys</span><b><Money value={buyTotal} /></b></div>
        <div><span>Total sells</span><b><Money value={sellTotal} /></b></div>
        <div><span>Transactions</span><b className="num">{visible.length}</b></div>
      </section>
      <div className="search-row">
        <label className="search-box">
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search transactions" aria-label="Search transactions" />
        </label>
        <div className="date-anchor" ref={dateAnchor}>
          <button type="button" className={from ? "filter-button on" : "filter-button"} aria-label="Choose a date range" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18" /></svg>
            <span>{from ? <RangeLabel from={from} to={to} /> : "Date"}</span>
          </button>
          {open ? (
            <div className="date-pop" role="dialog" aria-label="Date range">
              <div className="calendar-note">
                <span>{from ? <RangeLabel from={from} to={to} /> : "Start, then end."}</span>
                {from ? <button type="button" onClick={() => { setFrom(null); setTo(null); }}>Clear</button> : null}
              </div>
              <RangeCalendar cursor={cursor} from={from} to={to} onCursor={setCursor} onPick={(iso) => pickRange(iso, from, to, setFrom, setTo)} />
            </div>
          ) : null}
        </div>
      </div>
      <div className="chip-row">
        {SIDES.map((item) => (
          <button key={item.id} type="button" className={side === item.id ? "active" : ""} onClick={() => setSide(item.id)}>{item.label}</button>
        ))}
      </div>
      {visible.length === 0 ? <Empty>No transactions match.</Empty> : (
        <section>
          {side !== "all" && active ? <h2 className="side-label">{active.label}</h2> : null}
          {monthGroups(paged.slice).map((group) => (
            <div key={group.key}>
              <p className="date-label">{group.label}</p>
              {group.txns.map((txn) => <TxnRow key={txn.id} txn={txn} />)}
            </div>
          ))}
        </section>
      )}
      <Pager
        page={paged.page}
        pages={paged.pages}
        total={visible.length}
        start={paged.start}
        size={pageSize}
        onPage={(next) => {
          paged.setPage(next);
          window.scrollTo({ top: 0 });
        }}
      />
    </>
  );
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function monthGroups(txns: Transaction[]) {
  const groups: { key: string; label: string; txns: Transaction[] }[] = [];
  for (const txn of txns) {
    const key = txn.date.slice(0, 7);
    const last = groups[groups.length - 1];
    if (!last || last.key !== key) groups.push({ key, label: monthLabel(txn.date), txns: [txn] });
    else last.txns.push(txn);
  }
  return groups;
}

function monthLabel(iso: string) {
  const [year, month] = iso.split("-");
  return `${MONTHS[Number(month) - 1] ?? ""} ${year}`;
}

const SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function RangeLabel({ from, to }: { from: string; to: string | null }) {
  const end = to ?? from;
  const sameYear = from.slice(0, 4) === end.slice(0, 4);
  if (from === end) return <DateText iso={from} />;
  return <>
    <DateText iso={from} withYear={!sameYear} />
    {" – "}
    <DateText iso={end} withYear={!sameYear} />
  </>;
}

function DateText({ iso, withYear = true }: { iso: string; withYear?: boolean }) {
  const [year, month, day] = iso.split("-");
  return <>
    <span className="num">{Number(day)}</span>
    {` ${SHORT[Number(month) - 1] ?? ""}`}
    {withYear ? <> <span className="num">{year}</span></> : null}
  </>;
}

function pickRange(iso: string, from: string | null, to: string | null, setFrom: (value: string | null) => void, setTo: (value: string | null) => void) {
  if (!from || to) {
    setFrom(iso);
    setTo(null);
    return;
  }
  if (iso < from) {
    setTo(from);
    setFrom(iso);
    return;
  }
  setTo(iso);
}

function RangeCalendar({
  cursor,
  from,
  to,
  onCursor,
  onPick,
}: {
  cursor: string;
  from: string | null;
  to: string | null;
  onCursor: (value: string) => void;
  onPick: (iso: string) => void;
}) {
  const [yearText, monthText] = cursor.split("-");
  const year = Number(yearText);
  const month = Number(monthText) - 1;
  const cells = monthCells(year, month);
  const end = to ?? from;
  function shift(step: number) {
    const next = new Date(Date.UTC(year, month + step, 1));
    onCursor(`${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return (
    <div className="calendar">
      <div className="calendar-head">
        <button type="button" aria-label="Previous month" onClick={() => shift(-1)}><Caret dir="left" /></button>
        <strong>{MONTHS[month]} <span className="num">{year}</span></strong>
        <button type="button" aria-label="Next month" onClick={() => shift(1)}><Caret dir="right" /></button>
      </div>
      <div className="calendar-grid" role="grid">
        {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
        {cells.map((cell) => {
          const edge = cell.iso === from || cell.iso === to;
          const inside = Boolean(from && end && cell.iso >= from && cell.iso <= end);
          return (
            <button
              key={cell.iso}
              type="button"
              className={[cell.outside ? "outside" : "", inside ? "range" : "", edge ? "edge" : ""].filter(Boolean).join(" ")}
              onClick={() => onPick(cell.iso)}
            >
              <span className="num">{cell.day}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function monthCells(year: number, month: number) {
  const first = new Date(Date.UTC(year, month, 1));
  const lead = first.getUTCDay();
  const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: { iso: string; day: number; outside: boolean }[] = [];
  for (let index = 0; index < lead; index += 1) {
    const date = new Date(Date.UTC(year, month, 1 - (lead - index)));
    cells.push({ iso: date.toISOString().slice(0, 10), day: date.getUTCDate(), outside: true });
  }
  for (let day = 1; day <= count; day += 1) {
    cells.push({ iso: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`, day, outside: false });
  }
  while (cells.length % 7 !== 0) {
    const date = new Date(`${cells[cells.length - 1].iso}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + 1);
    cells.push({ iso: date.toISOString().slice(0, 10), day: date.getUTCDate(), outside: true });
  }
  return cells;
}

function Caret({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d={dir === "left" ? "m15 18-6-6 6-6" : "m9 6 6 6-6 6"} />
    </svg>
  );
}
