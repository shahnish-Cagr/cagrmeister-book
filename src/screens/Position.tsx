import { useMemo, useState } from "react";
import { Link, NavLink, useParams } from "react-router";
import {
  AS_OF,
  FAMILY,
  FY,
  HOLDINGS,
  avgOf,
  gainOf,
  gainPct,
  holdingById,
  priceOf,
  sumValue,
  type Holding,
  type SleeveId,
} from "../book";
import { inr, pct, px, qty } from "../format";
import { useBook } from "../scope";
import { PhoneHeader } from "../shell";
import { Empty } from "../ui";

export function Position({ mode }: { mode: "summary" | "transactions" }) {
  const { id } = useParams();
  const holding = holdingById(id ?? "");
  const { scope } = useBook();

  if (!holding) {
    return (
      <>
        <PhoneHeader>
          <header className="sleeve-head">
            <Link to="/book" aria-label="Book">‹</Link>
            <h1>Position</h1>
          </header>
        </PhoneHeader>
        <Empty>That name is not in the book.</Empty>
      </>
    );
  }

  const sleeveValue = sumValue(
    HOLDINGS.filter((h) => h.book === holding.book && h.sleeve === holding.sleeve && (scope === "family" || h.portfolio === scope)),
  );

  return (
    <>
      <PhoneHeader>
        <header className="sleeve-head">
          <Link to={`/name/${holding.id}`} aria-label="Back">‹</Link>
          <h1>{holding.name}</h1>
        </header>
      </PhoneHeader>
      <nav className="position-tabs" aria-label="Position">
        <NavLink to={`/name/${holding.id}/summary`}>Summary</NavLink>
        <NavLink to={`/name/${holding.id}/transactions`}>Transactions</NavLink>
      </nav>
      {mode === "summary" ? (
        <Summary holding={holding} sleeveValue={sleeveValue} />
      ) : (
        <Transactions holding={holding} />
      )}
    </>
  );
}

function tone(n: number): string {
  return n > 0 ? "up" : n < 0 ? "down" : "";
}

function Summary({ holding, sleeveValue }: { holding: Holding; sleeveValue: number }) {
  const gain = gainOf(holding);
  const rate = gainPct(holding);
  const share = sleeveValue === 0 ? 0 : holding.value / sleeveValue;
  const day = holding.dayPct;
  const asset = assetLabel(holding.sleeve);
  const other = otherLabel(holding.sleeve);

  return (
    <section className="position-summary">
      <p className="position-asof">
        <CalendarIcon />
        {asOn(AS_OF)}
      </p>
      <div className="position-id">
        <div>
          <span>Portfolio</span>
          <strong>{FAMILY}</strong>
        </div>
        <div>
          <span>Family</span>
          <strong>{FAMILY}</strong>
        </div>
      </div>
      <h2 className="position-title">{holding.name}</h2>
      <div className="position-asset">
        <span>Asset Type</span>
        <strong>{asset}</strong>
      </div>
      <HoldingPie share={share} holdingName={holding.name} other={other} />
      <dl className="position-stats">
        <div>
          <dt>Quantity</dt>
          <dd>{qty(holding.qty)}</dd>
        </div>
        <div>
          <dt>XIRR</dt>
          <dd className={holding.xirr == null ? "flat" : undefined}>{holding.xirr == null ? "—" : pct(holding.xirr)}</dd>
        </div>
        <div>
          <dt>Curr. Value</dt>
          <dd>{inr(holding.value)}</dd>
        </div>
        <div>
          <dt>Amt. Invested</dt>
          <dd>{inr(holding.cost)}</dd>
        </div>
        <div>
          <dt>Curr. Price</dt>
          <dd>{px(priceOf(holding))}</dd>
        </div>
        <div>
          <dt>Avg. Pur. Price</dt>
          <dd>{px(avgOf(holding))}</dd>
        </div>
        <div>
          <dt>Todays Gain %</dt>
          <dd className={day == null ? "flat" : tone(day)}>{day == null ? "—" : pct(day)}</dd>
        </div>
        <div>
          <dt>Unrealised Gain %</dt>
          <dd className={tone(rate)}>{pct(rate)}</dd>
        </div>
        <div>
          <dt>Todays Gain</dt>
          <dd className={holding.dayAmt == null ? "flat" : tone(holding.dayAmt)}>{holding.dayAmt == null ? "—" : inr(holding.dayAmt)}</dd>
        </div>
        <div>
          <dt>Unrealised Gain</dt>
          <dd className={tone(gain)}>{inr(gain)}</dd>
        </div>
      </dl>
    </section>
  );
}

function HoldingPie({ share, holdingName, other }: { share: number; holdingName: string; other: string }) {
  const portion = Math.min(1, Math.max(0, share));
  const paths = piePaths(portion);
  return (
    <figure className="hold-pie" aria-label={`${holdingName} is ${pct(portion, 1)} of the sleeve. The rest is ${other}.`}>
      <span className="hold-pie-label">Holding: {pct(portion, 1)}</span>
      <svg viewBox="0 0 160 160" width="156" height="156" aria-hidden="true">
        {paths.rest ? <path d={paths.rest} fill="#2ec4a0" /> : null}
        {paths.holding ? <path d={paths.holding} fill="#f0a024" /> : null}
      </svg>
      <span className="hold-pie-other">{other}</span>
    </figure>
  );
}

function piePaths(share: number): { holding: string; rest: string } {
  const cx = 80;
  const cy = 80;
  const r = 74;
  if (share <= 0.001) return { holding: "", rest: circle(cx, cy, r) };
  if (share >= 0.999) return { holding: circle(cx, cy, r), rest: "" };
  const sweep = share * Math.PI * 2;
  const start = (200 * Math.PI) / 180;
  return {
    holding: wedge(cx, cy, r, start, start + sweep),
    rest: wedge(cx, cy, r, start + sweep, start + Math.PI * 2),
  };
}

function circle(cx: number, cy: number, r: number): string {
  return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
}

function wedge(cx: number, cy: number, r: number, start: number, end: number): string {
  const point = (angle: number) => {
    const t = angle - Math.PI / 2;
    return [cx + r * Math.cos(t), cy + r * Math.sin(t)];
  };
  const [x0, y0] = point(start);
  const [x1, y1] = point(end);
  const large = end - start > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
}

function assetLabel(id: SleeveId): string {
  if (id === "mf-equity") return "MF (Equity)";
  if (id === "mf-debt") return "MF (Debt)";
  return "Stocks";
}

function otherLabel(id: SleeveId): string {
  if (id === "mf-equity") return "Other Equity";
  if (id === "mf-debt") return "Other Debt";
  return "Other Stocks";
}

function asOn(iso: string): string {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const [y, m, d] = iso.split("-").map(Number);
  return `As on ${months[(m ?? 1) - 1]} ${d}, ${y}`;
}

function monthDate(iso: string): string {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const [y, m, d] = iso.split("-").map(Number);
  return `${months[(m ?? 1) - 1]} ${d}, ${y}`;
}

function slashDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y?.slice(2)}`;
}

function Chevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </svg>
  );
}

function Transactions({ holding }: { holding: Holding }) {
  const [sort, setSort] = useState<"new" | "old">("new");
  const [side, setSide] = useState<"all" | "buy" | "sell">("all");
  const [period, setPeriod] = useState<string>(FY.id);

  const lines = useMemo(() => {
    const ordered = [...holding.fills].sort((a, b) => a.date.localeCompare(b.date));
    let bal = 0;
    const withBal = ordered.map((fill) => {
      bal += fill.side === "buy" ? fill.qty : -fill.qty;
      return { ...fill, bal };
    });
    const directed = sort === "new" ? [...withBal].reverse() : withBal;
    return directed.filter((fill) => side === "all" || fill.side === side);
  }, [holding, sort, side]);

  const closingQty = holding.fills.reduce((n, f) => n + (f.side === "buy" ? f.qty : -f.qty), 0);
  const closingAmt = holding.fills.reduce((n, f) => n + (f.side === "buy" ? f.amount : -f.amount), 0);

  return (
    <section className="ledger">
      <label className="txn-strip">
        <CalendarIcon />
        <select aria-label="Period" value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value={FY.id}>{monthDate(FY.from)} — {monthDate(FY.to)}</option>
        </select>
        <Chevron />
      </label>
      <table className="bal-table">
        <thead>
          <tr>
            <th />
            <th>Quantity</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Opening</th>
            <td>{qty(0)}</td>
            <td>{inr(0)}</td>
          </tr>
          <tr>
            <th>Closing</th>
            <td>{qty(closingQty)}</td>
            <td>{inr(closingAmt)}</td>
          </tr>
        </tbody>
      </table>
      <div className="ledger-controls">
        <div className="ledger-filters" role="group" aria-label="Filter">
          <button type="button" aria-pressed={side === "all"} onClick={() => setSide("all")}>All</button>
          <button type="button" aria-pressed={side === "buy"} onClick={() => setSide("buy")}>Buy</button>
          <button type="button" aria-pressed={side === "sell"} onClick={() => setSide("sell")}>Sell</button>
        </div>
        <div className="ledger-sort" role="group" aria-label="Sort">
          <button type="button" aria-pressed={sort === "new"} onClick={() => setSort("new")}>Newest</button>
          <button type="button" aria-pressed={sort === "old"} onClick={() => setSort("old")}>Oldest</button>
        </div>
      </div>
      {lines.length === 0 ? (
        <Empty>No {side === "all" ? "trades" : `${side}s`} in this period.</Empty>
      ) : (
        <ol className="txn-list">
          {lines.map((fill) => (
            <li key={`${fill.date}-${fill.price}`} id={`fill-${fill.date}`} className="txn-card">
              <header>
                <time dateTime={fill.date}>{slashDate(fill.date)}</time>
                <strong className={fill.side}>{fill.side === "buy" ? "Buy" : "Sell"}</strong>
              </header>
              <div className="txn-cols">
                <div>
                  <span>Qty</span>
                  <strong>{qty(fill.qty)}</strong>
                  <span>Price</span>
                  <strong>{px(fill.price)}</strong>
                </div>
                <div>
                  <span>Amt.</span>
                  <strong>{fill.side === "sell" ? `−${inr(fill.amount)}` : inr(fill.amount)}</strong>
                  <span>Bal. Qty.</span>
                  <strong>{qty(fill.bal)}</strong>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
