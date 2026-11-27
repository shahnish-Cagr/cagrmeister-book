import ledgerFile from "./ledger.json";

export const FIRM = "CAGRMEISTER";
export const VALUATION_NOTE =
  "Market prices are not in the transaction files. Value is the cost still on the books, plus cash when the file records capital inflows.";

export type BookId = string;
export type MemberId = string;
export type ContextId = "family" | MemberId;
export type AssetId = "stocks" | "equity-mf" | "liquid" | "reit" | "invit" | "gold" | "bond" | "cash";
export type Side = "buy" | "sell" | "dividend" | "bonus" | "split" | "merger" | "demerger" | "allotment" | "inflow";
export type FamilyGroup = { id: string; name: string; memberIds: string[] };
export type Category = { id: string; label: string };
export type PeriodId = "1m" | "3m" | "6m" | "1y" | "3y" | "5y" | "all";

export type YearRow = {
  fy: string;
  from: string;
  to: string;
  openingQty: number;
  openingCost: number;
  closingQty: number;
  closingCost: number;
};

export type Position = {
  id: string;
  name: string;
  symbol: string;
  isin: string;
  asset: AssetId;
  sector: string;
  member: MemberId;
  qty: number;
  cost: number;
  avg: number;
  value: number;
  price: number;
  realised: number;
  dividends: number;
  gain: number;
  gainPct: number;
  open: boolean;
  marketPrice: number | null;
  priceDate: string | null;
  priceSource: string | null;
  prevPrice: number | null;
  prevPriceDate: string | null;
  valuedAtCost: boolean | null;
  dayChange: number | null;
  dayChangePct: number | null;
  marketValue: number | null;
  unrealised: number | null;
  unrealisedPct: number | null;
  xirr: number | null;
  returnBasis: string | null;
  firstDate: string | null;
  sleeve: string | null;
  ledgerBook: string | null;
  years: YearRow[];
};

export type Transaction = {
  id: string;
  date: string;
  side: Side;
  qty: number;
  price: number;
  amount: number;
  bookDelta: number;
  cashDelta: number;
  realised: number;
  ref: string;
  securityId: string;
  name: string;
  symbol: string;
  member: MemberId;
  asset: AssetId;
  sector: string;
  note: string | null;
  balQty: number | null;
};

export type MarketQuote = {
  cost: number | null;
  value: number | null;
  gain: number | null;
  gainPct: number | null;
  dayChange: number | null;
  dayChangePct: number | null;
  xirr: number | null;
  returnBasis: string | null;
  realised: number | null;
  dividends: number | null;
  holdings: number | null;
  unpriced: number | null;
  sleeves?: Record<string, MarketQuote>;
};

export type MarketBlock = {
  asOf: string;
  returnsAsOf: string;
  notes: string[];
  indices: { id: string; name: string; last: number; change: number; pct: number; date: string }[];
  benchmark: {
    basis: string;
    heading: string;
    asOf: string;
    note: string;
    rows: { label: string; return: number }[];
    lines: { label: string; points: { date: string; value: number }[] }[];
  };
  inv: MarketQuote;
  fo: MarketQuote;
  members: Record<string, { inv: MarketQuote; fo: MarketQuote }>;
};

export type Book = {
  id: BookId;
  name: string;
  kind?: "family" | "single";
  source: string;
  tracksCash: boolean;
  asOf: string;
  members: { id: MemberId; name: string }[];
  groups?: FamilyGroup[];
  categories?: Category[];
  positions: Position[];
  transactions: Transaction[];
  summary: {
    family: { bookValue: number; realised: number; dividends: number; holdings: number };
    members: Record<string, { bookValue: number; realised: number; dividends: number; holdings: number }>;
  };
  warnings: string[];
  market: MarketBlock | null;
};

type LedgerFile = {
  firm: string;
  valuation: string;
  valuationNote: string;
  assets: { id: AssetId; label: string; color: string }[];
  books: Book[];
};

const ledger = ledgerFile as unknown as LedgerFile;

export const ASSETS = ledger.assets;
export let BOOKS: Book[] = ledger.books;

export function installBooks(next: Book[]) {
  BOOKS = next;
}
export const PERIODS: { id: PeriodId; label: string; months: number | null }[] = [
  { id: "1m", label: "1M", months: 1 },
  { id: "3m", label: "3M", months: 3 },
  { id: "6m", label: "6M", months: 6 },
  { id: "1y", label: "1Y", months: 12 },
  { id: "3y", label: "3Y", months: 36 },
  { id: "5y", label: "5Y", months: 60 },
  { id: "all", label: "All", months: null },
];

export function bookById(id: BookId): Book {
  return BOOKS.find((book) => book.id === id) ?? BOOKS[0];
}

export function asOfLabel(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function membersOf(bookId: BookId) {
  return bookById(bookId).members;
}

export function memberName(bookId: BookId, id: MemberId): string {
  return membersOf(bookId).find((member) => member.id === id)?.name ?? id;
}

export function bookGroups(book: Book): FamilyGroup[] {
  return book.groups ?? [];
}

export function bookCategories(book: Book): Category[] {
  return book.categories ?? [];
}

export function memberIdsFor(bookId: BookId, context: ContextId): string[] | null {
  if (context === "family") return null;
  if (context.startsWith("g:")) {
    const group = bookGroups(bookById(bookId)).find((item) => item.id === context.slice(2));
    return group?.memberIds ?? [];
  }
  return [context];
}

export function contextName(bookId: BookId, id: ContextId): string {
  if (id === "family") return bookById(bookId).name;
  if (id.startsWith("g:")) {
    return bookGroups(bookById(bookId)).find((item) => item.id === id.slice(2))?.name ?? id;
  }
  return memberName(bookId, id);
}

export function marketQuote(bookId: BookId, context: ContextId): MarketQuote | null {
  const market = bookById(bookId).market;
  if (!market || context === "family") return market?.inv ?? null;
  if (context.startsWith("g:")) return null;
  return market.members[context]?.inv ?? null;
}

export function assetLabel(id: AssetId): string {
  return ASSETS.find((asset) => asset.id === id)?.label ?? id;
}

const SLEEVES: Record<string, string> = {
  stocks: "Stocks",
  "mf-equity": "MF (Equity)",
  "mf-debt": "MF (Debt)",
  gold: "Gold",
  "reit-invit": "REIT / InvIT",
  bonds: "Bonds",
  options: "Options",
};

export function sleeveLabel(id: string | null): string {
  if (!id) return "";
  return SLEEVES[id] ?? id;
}

export function basisLabel(basis: string | null): string {
  if (!basis) return "Return";
  if (basis.toUpperCase() === "XIRR") return "XIRR";
  if (basis.toUpperCase() === "ABSOLUTE") return "Absolute return";
  return basis;
}

export function sideLabel(side: Side): string {
  if (side === "buy") return "Buy";
  if (side === "sell") return "Sell";
  if (side === "dividend") return "Dividend";
  if (side === "demerger") return "Demerger";
  if (side === "inflow") return "Capital";
  if (side === "allotment") return "Allotment";
  return side.slice(0, 1).toUpperCase() + side.slice(1);
}

export function positionsFor(bookId: BookId, context: ContextId, openOnly = true): Position[] {
  const members = memberIdsFor(bookId, context);
  const rows = bookById(bookId).positions.filter((row) => !members || members.includes(row.member));
  return openOnly ? rows.filter((row) => row.open) : rows;
}

export function transactionsFor(bookId: BookId, context: ContextId): Transaction[] {
  const members = memberIdsFor(bookId, context);
  const rows = bookById(bookId).transactions;
  return !members ? rows : rows.filter((row) => members.includes(row.member));
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function totals(rows: Position[]) {
  const open = rows.filter((row) => row.open);
  const cost = round2(open.reduce((sum, row) => sum + row.cost, 0));
  const value = round2(open.reduce((sum, row) => sum + row.value, 0));
  const realised = round2(rows.reduce((sum, row) => sum + row.realised, 0));
  const dividends = round2(rows.reduce((sum, row) => sum + row.dividends, 0));
  const priced = open.filter((row) => row.marketValue != null);
  const gain = priced.length ? round2(value - cost) : 0;
  const dayParts = open.filter((row) => row.dayChange != null);
  const dayChange = dayParts.length ? round2(dayParts.reduce((sum, row) => sum + (row.dayChange ?? 0), 0)) : null;
  const unpriced = open.filter((row) => row.valuedAtCost).length;
  return {
    cost,
    value,
    gain,
    gainPct: cost && priced.length ? gain / cost : 0,
    realised,
    dividends,
    count: open.length,
    dayChange,
    unpriced,
    priced: priced.length > 0,
  };
}

export type BreakRow = {
  id: string;
  label: string;
  cost: number;
  value: number;
  gain: number;
  gainPct: number;
  realised: number;
  dividends: number;
  count: number;
  weight: number;
};

export function breakdown(rows: Position[], key: "asset" | "sector" | "member", bookId: BookId): BreakRow[] {
  const open = rows.filter((row) => row.open);
  const all = totals(open).value;
  const groups = new Map<string, Position[]>();
  for (const row of open) {
    const id = row[key];
    groups.set(id, [...(groups.get(id) ?? []), row]);
  }
  return [...groups.entries()]
    .map(([id, list]) => {
      const sum = totals(list);
      const label = key === "asset" ? assetLabel(id as AssetId) : key === "member" ? memberName(bookId, id) : id;
      return { id, label, ...sum, weight: all ? sum.value / all : 0 };
    })
    .sort((a, b) => b.value - a.value);
}

export function highlights(openRows: Position[], allRows: Position[]) {
  const invested = openRows.filter((row) => row.asset !== "cash");
  const byValue = [...invested].sort((a, b) => b.value - a.value);
  const byRealised = [...allRows].sort((a, b) => b.realised - a.realised);
  const total = totals(openRows).value;
  const top5 = byValue.slice(0, 5).reduce((sum, row) => sum + row.value, 0);
  return {
    largest: byValue[0],
    topRealised: byRealised.find((row) => row.realised > 0),
    largestLoss: [...byRealised].reverse().find((row) => row.realised < 0),
    top5Weight: total ? top5 / total : 0,
    largestWeight: total && byValue[0] ? byValue[0].value / total : 0,
    holdingCount: invested.length,
    dividends: round2(allRows.reduce((sum, row) => sum + row.dividends, 0)),
  };
}

export function periodMeta(id: PeriodId) {
  return PERIODS.find((period) => period.id === id) ?? PERIODS[3];
}

export function cutoff(months: number, asOf: string): string {
  const date = new Date(`${asOf}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() - months);
  return date.toISOString().slice(0, 10);
}

export type Point = { date: string; value: number };

export function monthEnds(points: Point[]): Point[] {
  const last = new Map<string, Point>();
  for (const point of points) last.set(point.date.slice(0, 7), point);
  return [...last.values()];
}

export function bookSeries(bookId: BookId, context: ContextId, months: number | null): Point[] {
  const book = bookById(bookId);
  const from = months == null ? "" : cutoff(months, book.asOf);
  const txns = [...transactionsFor(bookId, context)].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  let securities = 0;
  let cash = 0;
  let startValue = 0;
  const points: Point[] = [];
  for (const txn of txns) {
    const nextSecurities = round2(securities + txn.bookDelta);
    const nextCash = book.tracksCash ? round2(cash + txn.cashDelta) : 0;
    const value = round2(nextSecurities + nextCash);
    if (from && txn.date < from) {
      securities = nextSecurities;
      cash = nextCash;
      startValue = value;
      continue;
    }
    securities = nextSecurities;
    cash = nextCash;
    const last = points[points.length - 1];
    if (last?.date === txn.date) last.value = value;
    else points.push({ date: txn.date, value });
  }
  if (from) points.unshift({ date: from, value: startValue });
  if (points.length === 0) points.push({ date: book.asOf, value: startValue });
  if (points[points.length - 1].date !== book.asOf) {
    points.push({ date: book.asOf, value: points[points.length - 1].value });
  }
  return points;
}

export function windowStats(bookId: BookId, context: ContextId, months: number | null) {
  const book = bookById(bookId);
  const from = months == null ? "" : cutoff(months, book.asOf);
  const txns = transactionsFor(bookId, context).filter((txn) => !from || txn.date >= from);
  const series = bookSeries(bookId, context, months);
  return {
    realised: round2(txns.reduce((sum, txn) => sum + txn.realised, 0)),
    dividends: round2(txns.filter((txn) => txn.side === "dividend").reduce((sum, txn) => sum + txn.amount, 0)),
    bookStart: series[0]?.value ?? 0,
    bookEnd: series[series.length - 1]?.value ?? 0,
  };
}

export function securitySeries(bookId: BookId, securityId: string, months: number | null): Point[] {
  const book = bookById(bookId);
  const from = months == null ? "" : cutoff(months, book.asOf);
  const txns = book.transactions
    .filter((txn) => txn.securityId === securityId)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  let value = 0;
  let start = 0;
  const points: Point[] = [];
  for (const txn of txns) {
    if (from && txn.date < from) {
      value = round2(value + txn.bookDelta);
      start = value;
      continue;
    }
    value = round2(value + txn.bookDelta);
    const last = points[points.length - 1];
    if (last?.date === txn.date) last.value = value;
    else points.push({ date: txn.date, value });
  }
  if (from) points.unshift({ date: from, value: start });
  if (points.length === 0) points.push({ date: book.asOf, value: start });
  return points;
}

export function findPosition(bookId: BookId, id: string) {
  return bookById(bookId).positions.find((row) => row.id === id);
}

export function findTransaction(id: string) {
  for (const book of BOOKS) {
    const txn = book.transactions.find((row) => row.id === id);
    if (txn) return { book, txn };
  }
  return null;
}

export function audit() {
  for (const book of BOOKS) {
    let securities = 0;
    let cash = 0;
    const ordered = [...book.transactions].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    for (const txn of ordered) {
      securities = round2(securities + txn.bookDelta);
      cash = round2(cash + txn.cashDelta);
    }
    const open = book.positions.filter((row) => row.open && row.asset !== "cash");
    const securityBook = round2(open.reduce((sum, row) => sum + row.cost, 0));
    if (Math.abs(securities - securityBook) > 1) {
      throw new Error(`${book.id} book ${securities} vs positions ${securityBook}`);
    }
    const cashRow = book.positions.find((row) => row.asset === "cash");
    if (book.tracksCash && !book.market) {
      if (!cashRow || Math.abs((cashRow.marketValue ?? cashRow.cost) - cash) > 1) {
        throw new Error(`${book.id} cash ${cash} vs ${cashRow?.cost}`);
      }
    }
    const family = totals(positionsFor(book.id, "family"));
    const memberValue = round2(book.members.reduce((sum, member) => sum + totals(positionsFor(book.id, member.id)).value, 0));
    if (Math.abs(memberValue - family.value) > 1) {
      throw new Error(`${book.id} members ${memberValue} vs family ${family.value}`);
    }
  }
}
