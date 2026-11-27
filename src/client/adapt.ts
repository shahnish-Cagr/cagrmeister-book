import { round2, sleeveLabel, type AssetId, type Book, type Category, type FamilyGroup, type MarketQuote, type Position, type Side, type Transaction, type YearRow } from "../data/book";

const ASSET: Record<string, AssetId> = {
  stocks: "stocks",
  "mf-equity": "equity-mf",
  "mf-debt": "liquid",
  gold: "gold",
  bonds: "bond",
  options: "stocks",
};

const SIDE: Record<string, Side> = {
  buy: "buy",
  sell: "sell",
  dividend: "dividend",
  bonus: "bonus",
  split: "split",
  merger_in: "merger",
  merger: "merger",
  demerger: "demerger",
  expiry: "sell",
  other: "allotment",
};

export function booksFromOutput(output: unknown): Book[] {
  if (isPortalLedger(output)) return output.books;
  if (!isRecord(output) || !Array.isArray(output.holdings)) return [];
  const book = demoBook(output);
  return book ? [book] : [];
}

function isPortalLedger(value: unknown): value is { books: Book[] } {
  if (!isRecord(value) || !Array.isArray(value.books) || value.books.length === 0) return false;
  const first = value.books[0];
  return isRecord(first) && Array.isArray(first.positions) && Array.isArray(first.transactions);
}

function demoBook(demo: Record<string, unknown>): Book | null {
  const client = isRecord(demo.client) ? demo.client : {};
  const members = Array.isArray(demo.members) ? demo.members.filter(isRecord) : [];
  if (!members.length) return null;
  const positions: Position[] = [];
  const transactions: Transaction[] = [];
  for (const holding of Array.isArray(demo.holdings) ? demo.holdings.filter(isRecord) : []) {
    const slots = Array.isArray(holding.positions) ? holding.positions.filter(isRecord) : [];
    for (const slot of slots) {
      const member = text(slot.member);
      if (!member) continue;
      const built = positionFrom(holding, slot, member);
      positions.push(built.position);
      transactions.push(...built.transactions);
    }
  }
  transactions.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const summary = isRecord(demo.summary) ? demo.summary : {};
  const all = quoteOf(isRecord(summary.all) ? summary.all : {});
  const clientId = text(field(demo, "clientId", "client_id"));
  const name = text(client.name) || clientId || "Client";
  const kind = text(client.type).toUpperCase() === "FAMILY" || members.length > 1 ? "family" : "single";
  return {
    id: clientId || "client",
    name,
    kind,
    source: clientId || name,
    tracksCash: false,
    asOf: text(field(demo, "asOf", "as_of")),
    members: members.map((member) => ({ id: text(member.id), name: text(member.name) || text(member.id) })),
    groups: groupsOf(demo),
    categories: categoriesOf(demo),
    positions,
    transactions,
    summary: {
      family: headline(all.inv),
      members: Object.fromEntries(members.map((member) => {
        const id = text(member.id);
        return [id, headline(quoteOf(isRecord(summary[id]) ? summary[id] : {}).inv)];
      })),
    },
    warnings: [],
    market: marketBlock(demo, members.map((member) => text(member.id))),
  };
}

function positionFrom(holding: Record<string, unknown>, slot: Record<string, unknown>, member: string) {
  const sleeve = text(holding.sleeve);
  const asset = assetOf(sleeve, text(holding.name));
  const id = `${text(holding.id) || text(holding.isin) || text(holding.name)}:${member}`;
  const cost = num(field(slot, "invested", "cost"));
  const marketValue = numOrNull(field(slot, "currentValue", "value"));
  const raw = (Array.isArray(slot.transactions) ? slot.transactions.filter(isRecord) : [])
    .map((txn, index) => ({
      id: `${id}:${text(txn.row) || index}`,
      date: text(txn.date),
      side: SIDE[text(txn.type)] ?? "allotment",
      qty: num(txn.qty),
      price: num(txn.price),
      amount: num(txn.amount),
      realised: 0,
      ref: txn.row == null || txn.row === "" ? "" : String(txn.row),
      securityId: id,
      name: text(holding.name),
      symbol: text(holding.symbol),
      member,
      asset,
      sector: sleeveLabel(sleeve) || sleeve || "—",
      note: null,
      balQty: numOrNull(field(txn, "balQty", "bal_qty")),
    }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const position: Position = {
    id,
    name: text(holding.name),
    symbol: text(holding.symbol),
    isin: text(holding.isin),
    asset,
    sector: sleeveLabel(sleeve) || sleeve || "—",
    member,
    qty: num(slot.qty),
    cost,
    avg: num(field(slot, "avgPurPrice", "avg_price")),
    value: marketValue ?? cost,
    price: num(field(holding, "currPrice", "price")),
    realised: num(field(slot, "realisedGain", "realised_gain")),
    dividends: num(slot.dividends),
    gain: num(field(slot, "unrealisedGain", "gain")),
    gainPct: num(field(slot, "unrealisedGainPct", "gain_pct")),
    open: holding.open !== false,
    marketPrice: numOrNull(field(holding, "currPrice", "price")),
    priceDate: text(field(holding, "currPriceDate", "priceDate", "price_date")) || null,
    priceSource: text(field(holding, "priceSource", "price_source")) || null,
    prevPrice: numOrNull(field(holding, "prevPrice", "prev_price")),
    prevPriceDate: text(field(holding, "prevPriceDate", "prev_price_date")) || null,
    valuedAtCost: boolOrNull(field(holding, "valuedAtCost", "valued_at_cost")),
    dayChange: numOrNull(field(slot, "todaysGain", "day_change")),
    dayChangePct: numOrNull(field(slot, "todaysGainPct", "day_change_pct")),
    marketValue,
    unrealised: numOrNull(field(slot, "unrealisedGain", "gain")),
    unrealisedPct: numOrNull(field(slot, "unrealisedGainPct", "gain_pct")),
    xirr: numOrNull(field(slot, "xirr", "return")),
    returnBasis: text(field(slot, "returnBasis", "return_basis")) || null,
    firstDate: text(field(slot, "firstDate", "first_date")) || null,
    sleeve: sleeve || null,
    ledgerBook: text(holding.book) || null,
    years: yearsOf(slot.years),
  };
  return { position, transactions: withCost(raw, cost) };
}

function withCost(rows: Omit<Transaction, "bookDelta" | "cashDelta">[], endCost: number): Transaction[] {
  let qty = 0;
  let cost = 0;
  const built: Transaction[] = rows.map((txn) => {
    let bookDelta = 0;
    if (txn.side === "buy" || txn.side === "allotment" || txn.side === "merger" || txn.side === "inflow") {
      bookDelta = txn.amount;
      cost = round2(cost + txn.amount);
      qty = round2(qty + txn.qty);
    } else if (txn.side === "sell") {
      const release = qty > 0 ? round2((cost * txn.qty) / qty) : 0;
      const used = Math.min(cost, Math.max(release, 0));
      bookDelta = -used;
      cost = round2(cost - used);
      qty = round2(Math.max(0, qty - txn.qty));
    } else if (txn.side === "bonus" || txn.side === "split") {
      qty = round2(qty + txn.qty);
    }
    return { ...txn, bookDelta, cashDelta: txn.side === "dividend" ? txn.amount : 0 };
  });
  if (built.length) {
    const drift = round2(endCost - cost);
    if (drift) built[built.length - 1].bookDelta = round2(built[built.length - 1].bookDelta + drift);
  }
  return built;
}

function marketBlock(demo: Record<string, unknown>, memberIds: string[]): Book["market"] {
  const summary = isRecord(demo.summary) ? demo.summary : {};
  const benchmark = isRecord(demo.benchmark) ? demo.benchmark : {};
  const chart = isRecord(benchmark.chart) ? benchmark.chart : {};
  const dates = Array.isArray(chart.dates) ? chart.dates.map((date) => text(date)) : [];
  const lines = Array.isArray(chart.lines) ? chart.lines.filter(isRecord) : [];
  return {
    asOf: text(field(demo, "asOf", "as_of")),
    returnsAsOf: text(field(demo, "returnsAsOf", "returns_as_of")),
    notes: Array.isArray(demo.notes) ? demo.notes.filter((note): note is string => typeof note === "string") : [],
    indices: Array.isArray(demo.indices) ? demo.indices.filter(isRecord).map((row) => ({
      id: text(row.id),
      name: text(row.name),
      last: num(row.last),
      change: num(row.change),
      pct: num(row.pct),
      date: text(row.date),
    })) : [],
    benchmark: {
      basis: text(benchmark.basis) || "XIRR",
      heading: text(benchmark.heading) || "Benchmark",
      asOf: text(field(benchmark, "asOf", "as_of")),
      note: text(benchmark.note),
      rows: Array.isArray(benchmark.rows) ? benchmark.rows.filter(isRecord).map((row) => ({
        label: text(row.label),
        return: num(field(row, "xirr", "return")),
      })) : [],
      lines: lines.map((line) => ({
        label: text(line.label),
        points: dates.flatMap((date, index) => {
          const values = Array.isArray(line.values) ? line.values : [];
          const value = values[index];
          return typeof value === "number" && Number.isFinite(value) ? [{ date, value }] : [];
        }),
      })),
    },
    inv: quoteOf(isRecord(summary.all) ? summary.all : {}).inv,
    fo: quoteOf(isRecord(summary.all) ? summary.all : {}).fo,
    members: Object.fromEntries(memberIds.map((id) => [id, quoteOf(isRecord(summary[id]) ? summary[id] : {})])),
  };
}

function quoteOf(block: Record<string, unknown>) {
  return { inv: quote(block.inv), fo: quote(block.fo) };
}

function quote(value: unknown, nested = false): MarketQuote {
  const block = isRecord(value) ? value : {};
  const sleeves = !nested && isRecord(block.sleeves)
    ? Object.fromEntries(Object.entries(block.sleeves).map(([id, sleeve]) => [id, quote(sleeve, true)]))
    : undefined;
  return {
    cost: numOrNull(field(block, "invested", "cost")),
    value: numOrNull(field(block, "currentValue", "value")),
    gain: numOrNull(field(block, "unrealisedGain", "gain")),
    gainPct: numOrNull(field(block, "unrealisedGainPct", "gain_pct")),
    dayChange: numOrNull(field(block, "todaysGain", "day_change")),
    dayChangePct: numOrNull(field(block, "todaysGainPct", "day_change_pct")),
    xirr: numOrNull(field(block, "xirr", "return")),
    returnBasis: text(field(block, "returnBasis", "return_basis")) || null,
    realised: numOrNull(field(block, "realisedGain", "realised_gain")),
    dividends: numOrNull(block.dividends),
    holdings: numOrNull(block.holdings),
    unpriced: numOrNull(block.unpriced),
    sleeves,
  };
}

function headline(quoteRow: MarketQuote) {
  return {
    bookValue: quoteRow.value ?? 0,
    realised: quoteRow.realised ?? 0,
    dividends: quoteRow.dividends ?? 0,
    holdings: quoteRow.holdings ?? 0,
  };
}

function yearsOf(value: unknown): YearRow[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((row) => ({
    fy: text(row.fy),
    from: text(row.from),
    to: text(row.to),
    openingQty: num(field(row, "openingQty", "opening_qty")),
    openingCost: num(field(row, "openingCost", "opening_cost")),
    closingQty: num(field(row, "closingQty", "closing_qty")),
    closingCost: num(field(row, "closingCost", "closing_cost")),
  }));
}

function groupsOf(demo: Record<string, unknown>): FamilyGroup[] {
  if (!Array.isArray(demo.groups)) return [];
  return demo.groups.filter(isRecord).flatMap((group) => {
    const id = text(group.id);
    const name = text(group.name) || id;
    const memberIds = Array.isArray(group.members) ? group.members.map((member) => text(member)).filter(Boolean) : [];
    return id && memberIds.length ? [{ id, name, memberIds }] : [];
  });
}

function categoriesOf(demo: Record<string, unknown>): Category[] {
  const source = Array.isArray(demo.categories) ? demo.categories : Array.isArray(demo.sleeves) ? demo.sleeves : [];
  return source.filter(isRecord).flatMap((row) => {
    const id = text(row.id);
    const label = text(row.label) || id;
    return id ? [{ id, label }] : [];
  });
}

function assetOf(sleeve: string, name: string): AssetId {
  if (sleeve === "reit-invit") return /invit/i.test(name) ? "invit" : "reit";
  return ASSET[sleeve] ?? "stocks";
}

function field(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(record, key)) return record[key];
  }
  return undefined;
}

function boolOrNull(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function numOrNull(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
