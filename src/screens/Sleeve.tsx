import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { SLEEVES, avgOf, gainPct, sumCost, sumValue, type Holding } from "../book";
import { group, inr, pct, px } from "../format";
import { useBook } from "../scope";
import { PhoneHeader } from "../shell";
import { Empty, FilterButton, toneClass } from "../ui";

const SORTS = [
  { id: "listed", label: "As listed" },
  { id: "name", label: "Name" },
  { id: "gain", label: "Gain %" },
  { id: "invested", label: "Amt. Invested" },
] as const;

type SortId = (typeof SORTS)[number]["id"];

export function Sleeve() {
  const { sleeveId } = useParams();
  const sleeve = SLEEVES.find((s) => s.id === sleeveId);
  const { rows } = useBook();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortId>("listed");
  const [sorting, setSorting] = useState(false);
  const all = useMemo(() => rows.filter((h) => h.sleeve === sleeve?.id), [rows, sleeve]);
  const held = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const mine = needle ? all.filter((h) => h.name.toLowerCase().includes(needle)) : [...all];
    if (sort === "name") mine.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "gain") mine.sort((a, b) => gainPct(b) - gainPct(a));
    if (sort === "invested") mine.sort((a, b) => b.cost - a.cost);
    return mine;
  }, [all, q, sort]);

  if (!sleeve) {
    return (
      <>
        <PhoneHeader>
          <header className="sleeve-head">
            <Link to="/book" aria-label="Book">‹</Link>
            <h1>Sleeve</h1>
          </header>
        </PhoneHeader>
        <Empty>That sleeve is not in the book.</Empty>
      </>
    );
  }

  const cost = sumCost(all);
  const value = sumValue(all);
  const gain = value - cost;
  const rate = gainPct({ cost, value });
  const narrowed = sort !== "listed";

  return (
    <>
      <PhoneHeader>
        <header className="sleeve-head">
          <Link to="/book" aria-label="Book">‹</Link>
          <h1>{sleeveTitle(sleeve.id)}</h1>
        </header>
      </PhoneHeader>
      <div className="sleeve-page">
        <section className="home-card worth-card sleeve-summary" aria-label={sleeveTitle(sleeve.id)}>
          <div className="worth-top">
            <div>
              <span>Current Value</span>
              <strong>{inr(value)}</strong>
            </div>
            <div>
              <span>Unrealised Gain %</span>
              <strong className={toneClass(rate)}>{pct(rate)}</strong>
            </div>
          </div>
          <div className="worth-bottom">
            <div>
              <span>Amt. Invested</span>
              <strong>{inr(cost)}</strong>
            </div>
            <div>
              <span>Unrealised Gain</span>
              <strong className={toneClass(gain)}>{inr(gain)}</strong>
            </div>
          </div>
        </section>
        <div className="sleeve-tools">
          <label className="sleeve-search">
            <SearchIcon />
            <input
              type="search"
              value={q}
              placeholder="Search"
              aria-label="Search"
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <div className="home-filter-wrap">
            <FilterButton
              pressed={sorting || narrowed}
              expanded={sorting}
              label="Sort"
              onClick={() => setSorting((open) => !open)}
            />
            {sorting && (
              <section className="sleeve-sort" aria-label="Sort">
                {SORTS.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    aria-pressed={sort === row.id}
                    onClick={() => setSort(row.id)}
                  >
                    {row.label}
                  </button>
                ))}
              </section>
            )}
          </div>
        </div>
        {held.length === 0 ? (
          <Empty>{q ? "Nothing matches." : "No positions in this sleeve."}</Empty>
        ) : (
          <div className="holding-list">
            {held.map((h) => (
              <HoldingCard key={h.id} h={h} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function HoldingCard({ h }: { h: Holding }) {
  const p = gainPct(h);
  return (
    <Link to={`/name/${h.id}`} className="holding-card">
      <div className="holding-card-top">
        <h3>{h.name}</h3>
        <div>
          <span>Unrealised Gain %</span>
          <strong className={toneClass(p)}>{pct(p)}</strong>
        </div>
      </div>
      <div className="holding-stats">
        <div>
          <span>Qty</span>
          <strong>{units(h.qty)}</strong>
        </div>
        <div>
          <span>Avg. Pur. Price</span>
          <strong>{px(avgOf(h))}</strong>
        </div>
        <div>
          <span>Amt. Invested</span>
          <strong>{inr(h.cost)}</strong>
        </div>
      </div>
    </Link>
  );
}

function sleeveTitle(id: string): string {
  if (id === "mf-equity") return "MF (Equity)";
  if (id === "mf-debt") return "MF (Debt)";
  return "Stocks";
}

function units(n: number): string {
  return Number.isInteger(n) ? group(n, 0) : group(n, 2);
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

