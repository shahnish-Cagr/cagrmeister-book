import { useMemo, useState } from "react";
import { Link } from "react-router";
import { AS_OF_LABEL, BOOKS, INDICES, SCOPES, SLEEVES, bookLabel, gainPct, scopeLabel, sumCost, sumValue, type BookId, type ScopeId } from "../book";
import { inr, pct } from "../format";
import { Frame } from "../frame";
import { useBook } from "../scope";
import { Empty, FilterButton, NameRow, toneClass } from "../ui";

export function Home() {
  const { book, setBook, scope, setScope, rows } = useBook();
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState(false);
  const needle = q.trim().toLowerCase();
  const found = useMemo(
    () => (needle ? rows.filter((h) => h.name.toLowerCase().includes(needle)) : rows),
    [rows, needle],
  );
  const cost = sumCost(rows);
  const value = sumValue(rows);
  const gain = value - cost;
  const rate = cost === 0 ? 0 : gain / cost;
  const narrowed = book !== "inv" || scope !== "family";

  return (
    <Frame title={bookLabel(book)} sub={`${scopeLabel(scope)} · ${AS_OF_LABEL}`}>
      <div className="home-tools">
        <label className="home-search">
          <input
            type="search"
            value={q}
            placeholder="Search names"
            aria-label="Search names"
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <div className="home-filter-wrap">
          <FilterButton
            pressed={filters || narrowed}
            expanded={filters}
            label="Filter"
            onClick={() => setFilters((open) => !open)}
          />
          {filters && (
            <section className="home-filters" aria-label="Filters">
              <div>
                <span>Book</span>
                <div className="ledger-filters" role="group" aria-label="Book">
                  {BOOKS.map((row) => (
                    <button key={row.id} type="button" aria-pressed={book === row.id} onClick={() => setBook(row.id as BookId)}>
                      {row.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span>Reading</span>
                <div className="ledger-filters" role="group" aria-label="Reading">
                  {SCOPES.map((row) => (
                    <button key={row.id} type="button" aria-pressed={scope === row.id} onClick={() => setScope(row.id as ScopeId)}>
                      {row.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
      <div className="home-stack">
        <section className="home-card worth-card" aria-label="Net worth">
          <div className="worth-top">
            <div>
              <span>Net Worth</span>
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
        {!needle && (
          <section className="market-grid" aria-label="Market">
            {INDICES.map((row) => (
              <article key={row.id} className="market-box">
                <div className="market-box-top">
                  <span>{row.name}</span>
                  <strong className={toneClass(row.pct)}>{pct(row.pct)}</strong>
                </div>
                <div className="market-box-bottom">
                  <span>{inr(row.last)}</span>
                  <strong className={toneClass(row.change)}>{inr(row.change)}</strong>
                </div>
              </article>
            ))}
          </section>
        )}
        {needle ? (
          <section className="home-card">
            <h2>Names</h2>
            {found.length === 0 ? (
              <Empty>Nothing matches.</Empty>
            ) : (
              <ul className="sheet">
                {found.map((h) => (
                  <li key={h.id}><NameRow h={h} to={`/name/${h.id}`} /></li>
                ))}
              </ul>
            )}
          </section>
        ) : rows.length === 0 ? (
          <section className="home-card">
            <Empty>No positions in this book.</Empty>
          </section>
        ) : (
          SLEEVES.map((sleeve) => {
            const held = rows.filter((h) => h.sleeve === sleeve.id);
            const sleeveCost = sumCost(held);
            const sleeveValue = sumValue(held);
            const p = gainPct({ cost: sleeveCost, value: sleeveValue });
            return (
              <Link key={sleeve.id} to={`/sleeve/${sleeve.id}`} className="sleeve-card">
                <div className="sleeve-card-top">
                  <h3>{sleeveTitle(sleeve.id)}</h3>
                  <div className="sleeve-card-gain">
                    <span>Unrealised Gain %</span>
                    <strong className={toneClass(p)}>{pct(p)}</strong>
                  </div>
                </div>
                <div className="sleeve-card-bottom">
                  <div>
                    <span>Amt. Invested</span>
                    <strong>{inr(sleeveCost)}</strong>
                  </div>
                  <div>
                    <span>Current Value</span>
                    <strong>{inr(sleeveValue)}</strong>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </Frame>
  );
}

function sleeveTitle(id: string): string {
  if (id === "mf-equity") return "MF (Equity)";
  if (id === "mf-debt") return "MF (Debt)";
  return "Stocks";
}

