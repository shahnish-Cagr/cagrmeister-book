import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { avgOf, gainOf, gainPct, holdingById } from "../book";
import { group, inr, pct, px } from "../format";
import { PhoneHeader } from "../shell";
import { Empty, FilterButton, toneClass } from "../ui";

const SORTS = [
  { id: "listed", label: "As listed" },
  { id: "name", label: "Name" },
  { id: "gain", label: "Gain %" },
  { id: "invested", label: "Amt. Invested" },
] as const;

type SortId = (typeof SORTS)[number]["id"];

export function Name() {
  const { id } = useParams();
  const holding = holdingById(id ?? "");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortId>("listed");
  const [sorting, setSorting] = useState(false);
  const portfolio = "Monica";
  const show = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? portfolio.toLowerCase().includes(needle) : true;
  }, [q]);

  if (!holding) {
    return (
      <>
        <PhoneHeader>
          <header className="sleeve-head">
            <Link to="/book" aria-label="Book">‹</Link>
            <h1>Name</h1>
          </header>
        </PhoneHeader>
        <Empty>That name is not in the book.</Empty>
      </>
    );
  }

  const gain = gainOf(holding);
  const rate = gainPct(holding);
  const narrowed = sort !== "listed";

  return (
    <>
      <PhoneHeader>
        <header className="sleeve-head">
          <Link to={`/sleeve/${holding.sleeve}`} aria-label="Back">‹</Link>
          <h1>{holding.name}</h1>
        </header>
      </PhoneHeader>
      <div className="sleeve-page">
        <section className="home-card worth-card sleeve-summary" aria-label={holding.name}>
          <div className="worth-top">
            <div>
              <span>Current Value</span>
              <strong>{inr(holding.value)}</strong>
            </div>
            <div>
              <span>Unrealised Gain %</span>
              <strong className={toneClass(rate)}>{pct(rate)}</strong>
            </div>
          </div>
          <div className="worth-bottom">
            <div>
              <span>Amt. Invested</span>
              <strong>{inr(holding.cost)}</strong>
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
                  <button key={row.id} type="button" aria-pressed={sort === row.id} onClick={() => setSort(row.id)}>
                    {row.label}
                  </button>
                ))}
              </section>
            )}
          </div>
        </div>
        {show ? (
          <Link to={`/name/${holding.id}/summary`} className="holding-card">
            <div className="holding-card-top">
              <h3>Portfolio: {portfolio}</h3>
              <div>
                <span>Unrealised Gain %</span>
                <strong className={toneClass(rate)}>{pct(rate)}</strong>
              </div>
            </div>
            <div className="holding-stats">
              <div>
                <span>Qty</span>
                <strong>{units(holding.qty)}</strong>
              </div>
              <div>
                <span>Avg. Pur. Price</span>
                <strong>{px(avgOf(holding))}</strong>
              </div>
              <div>
                <span>Amt. Invested</span>
                <strong>{inr(holding.cost)}</strong>
              </div>
            </div>
          </Link>
        ) : (
          <Empty>Nothing matches.</Empty>
        )}
      </div>
    </>
  );
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

