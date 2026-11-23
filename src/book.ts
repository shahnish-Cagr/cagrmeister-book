// Sample book dated 23 Nov 2026.
// Stock lines match the reference book. Fund lines are a split of the equity and debt
// sleeve totals from that book — the reference never named the funds.

export const AS_OF = "2026-11-23";
export const AS_OF_LABEL = "23 Nov 2026";
export const FAMILY = "Monica Shah";
export const FAMILY_GROUP = "Monica Shah Family";

export const FY = {
  id: "fy27",
  label: "1 Apr 2026 – 31 Mar 2027",
  from: "2026-04-01",
  to: "2027-03-31",
} as const;

export type BookId = "inv" | "fo";
export type ScopeId = "family" | "monica";
export type SleeveId = "stocks" | "mf-equity" | "mf-debt";
export type Side = "buy" | "sell";

export const BOOKS: { id: BookId; label: string }[] = [
  { id: "inv", label: "INV" },
  { id: "fo", label: "F&O" },
];

export const SCOPES: { id: ScopeId; label: string }[] = [
  { id: "family", label: "Family Group" },
  { id: "monica", label: "Monica" },
];

export const SLEEVES: { id: SleeveId; label: string }[] = [
  { id: "stocks", label: "Stocks" },
  { id: "mf-equity", label: "MF Equity" },
  { id: "mf-debt", label: "MF Debt" },
];

export type Fill = {
  date: string;
  side: Side;
  qty: number;
  price: number;
  amount: number;
};

export type Holding = {
  id: string;
  name: string;
  book: BookId;
  sleeve: SleeveId;
  portfolio: "monica";
  qty: number;
  cost: number;
  value: number;
  xirr: number | null;
  dayPct: number | null;
  dayAmt: number | null;
  fills: Fill[];
};

export const INDICES = [
  { id: "sensex", name: "Sensex", last: 83595.27, change: -324.44, pct: -0.0039 },
  { id: "nifty", name: "Nifty", last: 25660.4, change: -140.2, pct: -0.0054 },
] as const;

export const HOLDINGS: Holding[] = [
  {
    id: "carraro",
    name: "Carraro India",
    book: "inv",
    sleeve: "stocks",
    portfolio: "monica",
    qty: 1200,
    cost: 522828.5,
    value: 541320,
    xirr: 0.1396,
    dayPct: -0.0134,
    dayAmt: -7380,
    fills: [
      { date: "2026-08-08", side: "buy", qty: 850, price: 429.72, amount: 365262 },
      { date: "2026-09-10", side: "buy", qty: 350, price: 450.19, amount: 157566.5 },
    ],
  },
  {
    id: "pennar",
    name: "Pennar Industries",
    book: "inv",
    sleeve: "stocks",
    portfolio: "monica",
    qty: 2040,
    cost: 479277.6,
    value: 344744.38,
    xirr: null,
    dayPct: null,
    dayAmt: null,
    fills: [{ date: "2026-06-12", side: "buy", qty: 2040, price: 234.94, amount: 479277.6 }],
  },
  {
    id: "pushkar",
    name: "Shree Pushkar Chemicals & Fertilizers",
    book: "inv",
    sleeve: "stocks",
    portfolio: "monica",
    qty: 1290,
    cost: 478848,
    value: 662087.72,
    xirr: null,
    dayPct: null,
    dayAmt: null,
    fills: [{ date: "2026-07-03", side: "buy", qty: 1290, price: 371.2, amount: 478848 }],
  },
  {
    id: "flexi",
    name: "Northline Flexi Cap",
    book: "inv",
    sleeve: "mf-equity",
    portfolio: "monica",
    qty: 1000,
    cost: 42000,
    value: 24890.16,
    xirr: null,
    dayPct: null,
    dayAmt: null,
    fills: [{ date: "2026-05-18", side: "buy", qty: 1000, price: 42, amount: 42000 }],
  },
  {
    id: "smallcap",
    name: "Northline Small Cap",
    book: "inv",
    sleeve: "mf-equity",
    portfolio: "monica",
    qty: 800,
    cost: 26128.16,
    value: 16232.25,
    xirr: null,
    dayPct: null,
    dayAmt: null,
    fills: [{ date: "2026-05-18", side: "buy", qty: 800, price: 32.6602, amount: 26128.16 }],
  },
  {
    id: "corp",
    name: "Northline Corporate Bond",
    book: "inv",
    sleeve: "mf-debt",
    portfolio: "monica",
    qty: 6500,
    cost: 650000,
    value: 674200,
    xirr: null,
    dayPct: null,
    dayAmt: null,
    fills: [{ date: "2026-04-22", side: "buy", qty: 6500, price: 100, amount: 650000 }],
  },
  {
    id: "short",
    name: "Northline Short Duration",
    book: "inv",
    sleeve: "mf-debt",
    portfolio: "monica",
    qty: 4000,
    cost: 449481.24,
    value: 463576.71,
    xirr: null,
    dayPct: null,
    dayAmt: null,
    fills: [{ date: "2026-04-22", side: "buy", qty: 4000, price: 112.37031, amount: 449481.24 }],
  },
];

export function sleeveLabel(id: SleeveId): string {
  return SLEEVES.find((s) => s.id === id)?.label ?? id;
}

export function scopeLabel(id: ScopeId): string {
  return SCOPES.find((s) => s.id === id)?.label ?? id;
}

export function bookLabel(id: BookId): string {
  return BOOKS.find((b) => b.id === id)?.label ?? id;
}

export function visibleHoldings(book: BookId, scope: ScopeId): Holding[] {
  return HOLDINGS.filter((h) => h.book === book && (scope === "family" || h.portfolio === scope));
}

export function holdingById(id: string): Holding | undefined {
  return HOLDINGS.find((h) => h.id === id);
}

export function sumCost(rows: Holding[]): number {
  return rows.reduce((n, h) => n + h.cost, 0);
}

export function sumValue(rows: Holding[]): number {
  return rows.reduce((n, h) => n + h.value, 0);
}

export function gainOf(h: { cost: number; value: number }): number {
  return h.value - h.cost;
}

export function gainPct(h: { cost: number; value: number }): number {
  return h.cost === 0 ? 0 : (h.value - h.cost) / h.cost;
}

export function avgOf(h: Holding): number {
  return h.qty === 0 ? 0 : h.cost / h.qty;
}

export function priceOf(h: Holding): number {
  return h.qty === 0 ? 0 : h.value / h.qty;
}

function near(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.02;
}

function checkBook(): void {
  const inv = HOLDINGS.filter((h) => h.book === "inv");
  if (!near(sumCost(inv), 2648563.5) || !near(sumValue(inv), 2727051.22)) {
    throw new Error("Sample book no longer adds up to the family total.");
  }
  for (const sleeve of SLEEVES) {
    const rows = inv.filter((h) => h.sleeve === sleeve.id);
    for (const h of rows) {
      const filled = h.fills.reduce((n, f) => n + f.amount, 0);
      if (!near(filled, h.cost)) throw new Error(`${h.id} fills do not match cost`);
    }
  }
  const stocks = inv.filter((h) => h.sleeve === "stocks");
  if (!near(sumCost(stocks), 1480954.1) || !near(sumValue(stocks), 1548152.1)) {
    throw new Error("Stock sleeve drifted.");
  }
}

checkBook();
