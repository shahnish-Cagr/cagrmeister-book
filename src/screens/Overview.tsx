import { Link } from "react-router";
import { asOfLabel, bookById, breakdown, highlights, periodMeta, positionsFor, totals, type PeriodId } from "../data/book";
import { inr } from "../format";
import { ConicDonut, Money, Percent, PeriodChips, Spark, seriesReturn, sliceSeries } from "../components";
import { greeting, usePortal } from "../state";

export function Overview() {
  const portal = usePortal();
  const book = bookById(portal.bookId);
  const rows = positionsFor(portal.bookId, portal.context);
  const all = positionsFor(portal.bookId, portal.context, false);
  const sum = totals(all);
  const facts = highlights(rows, all);
  const assets = breakdown(rows, "asset", portal.bookId);
  const largestSector = [...breakdown(rows, "sector", portal.bookId)].sort((a, b) => b.weight - a.weight)[0];
  const months = periodMeta(portal.period).months;
  const market = book.market;
  const lines = (market?.benchmark.lines ?? []).slice(0, 2).map((line, index) => ({
    id: line.label,
    label: line.label,
    color: index === 0 ? "#287b78" : "#9ba9ad",
    dashed: index > 0,
    points: sliceSeries(line.points, months),
  }));
  const leadReturn = lines[0] ? seriesReturn(lines[0].points) : null;
  const benchReturn = lines[1] ? seriesReturn(lines[1].points) : null;

  return (
    <>
      {market ? (
        <section className="section market-first">
          <div className="section-head">
            <div>
              <p className="eyebrow">Markets today</p>
              <h2>Market snapshot</h2>
            </div>
            <span className="timestamp"><span className="num">{asOfLabel(market.indices[0]?.date ?? market.asOf)}</span></span>
          </div>
          <div className="market-row">
            {market.indices.map((row) => (
              <div key={row.id}>
                <span>{row.name}</span>
                <strong className="num">{inr(row.last)}</strong>
                <small><Percent value={row.pct} /></small>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="welcome-row">
        <div>
          <p className="eyebrow">{greeting()}</p>
          <h1>Your wealth, at a glance</h1>
        </div>
        <button type="button" className="icon-button notification" aria-label="Notifications">
          <BellIcon />
          <i />
        </button>
      </div>

      <section className="wealth-card">
        <div className="wealth-label">
          <span>{sum.priced ? "Current portfolio value" : "Book value"}</span>
          <button type="button" aria-label="Toggle value visibility" onClick={() => portal.setHidden(!portal.hidden)}>
            <Eye off={portal.hidden} />
          </button>
        </div>
        <div className="wealth-value"><Money value={sum.value} /></div>
        <div className="as-of">
          {sum.priced && market ? <>As of <span className="num">{asOfLabel(market.asOf)}</span>, close</> : <>At cost · <span className="num">{asOfLabel(book.asOf)}</span></>}
        </div>
        <div className="wealth-metrics">
          {sum.priced ? <div className="metric"><span>Invested</span><strong><Money value={sum.cost} /></strong></div> : null}
          <div className="metric">
            <span>Unrealised gain</span>
            <strong><Money value={sum.gain} tone /></strong>
          </div>
          <div className="metric">
            <span>Realised gain</span>
            <strong><Money value={sum.realised} signed /></strong>
          </div>
        </div>
      </section>

      {lines[0]?.points.length ? (
        <section className="section chart-section">
          <div className="section-head">
            <div>
              <p className="eyebrow">Performance</p>
              <h2>Portfolio growth</h2>
            </div>
            <Link className="text-button" to="/performance">View analysis</Link>
          </div>
          <div className="chart-legend">
            <span><i className="legend-dot portfolio-dot" />Portfolio {leadReturn != null ? <b><Percent value={leadReturn} tone={false} /></b> : null}</span>
          </div>
          <Spark series={[lines[0]]} />
          <PeriodChips ids={periodIds()} value={portal.period} onChange={(id) => portal.setPeriod(id as PeriodId)} />
        </section>
      ) : null}

      {lines.length ? (
        <section className="benchmark-strip">
          <div><span>Portfolio</span><strong>{leadReturn != null ? <Percent value={leadReturn} /> : "—"}</strong></div>
          {lines[1] ? <div><span>{lines[1].label}</span><strong>{benchReturn != null ? <Percent value={benchReturn} tone={false} /> : "—"}</strong></div> : null}
          {leadReturn != null && benchReturn != null ? <div><span>Outperformance</span><strong className="accent"><Percent value={leadReturn - benchReturn} tone={false} /></strong></div> : null}
        </section>
      ) : null}

      <section className="section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Distribution</p>
            <h2>Asset allocation</h2>
          </div>
          <Link className="text-button" to="/allocation">Explore</Link>
        </div>
        <ConicDonut slices={assets.map((row) => ({ id: row.id, label: row.label, weight: row.weight }))} />
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Portfolio highlights</p>
            <h2>What stands out</h2>
          </div>
        </div>
        <div className="highlight-grid">
          <div>
            <span>Largest holding</span>
            <b>{facts.largest?.name ?? "—"}</b>
            <small><span className="num">{(facts.largestWeight * 100).toFixed(2)}%</span> of portfolio</small>
          </div>
          <div>
            <span>Top contributor</span>
            <b className={facts.topRealised && facts.topRealised.realised < 0 ? "down" : "up"}>{facts.topRealised?.name ?? "None"}</b>
            <small>{facts.topRealised ? <Money value={facts.topRealised.realised} signed /> : "—"}</small>
          </div>
          <div>
            <span>Top 5 concentration</span>
            <b className="num">{(facts.top5Weight * 100).toFixed(2)}%</b>
            <small>{facts.top5Weight < 0.25 ? "Well diversified" : "Concentrated"}</small>
          </div>
          <div>
            <span>Largest sector</span>
            <b>{largestSector?.label ?? "—"}</b>
            <small>{largestSector ? <><span className="num">{(largestSector.weight * 100).toFixed(1)}%</span> exposure</> : "—"}</small>
          </div>
        </div>
      </section>
    </>
  );
}

function periodIds() {
  return [
    { id: "1m", label: "1M" },
    { id: "3m", label: "3M" },
    { id: "6m", label: "6M" },
    { id: "1y", label: "1Y" },
    { id: "3y", label: "3Y" },
    { id: "5y", label: "5Y" },
    { id: "all", label: "All" },
  ];
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function Eye({ off }: { off: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12" />
      <circle cx="12" cy="12" r="2.5" />
      {off ? <path d="m4 4 16 16" /> : null}
    </svg>
  );
}
