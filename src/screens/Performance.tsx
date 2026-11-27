import { PERIODS, asOfLabel, bookById, periodMeta, type PeriodId } from "../data/book";
import { Percent, PeriodChips, Spark, seriesReturn, windowPoints } from "../components";
import { usePersistedState } from "../persist";
import { usePortal } from "../state";

function isLabels(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

const BENCH_INK = ["#2c6cb0", "#6b4c9a", "#c6a969", "#b95f57"];

export function Performance() {
  const portal = usePortal();
  const [picked, setPicked] = usePersistedState(portal.code, "performance", [] as string[], isLabels);
  const months = periodMeta(portal.period).months;
  const market = bookById(portal.bookId).market;
  const source = market?.benchmark.lines ?? [];
  const end = source[0]?.points.at(-1)?.date;
  const portfolio = source[0]
    ? {
        id: source[0].label,
        label: "Portfolio",
        color: "#287b78",
        points: windowPoints(source[0].points, months, end),
      }
    : null;
  const indices = source.slice(1).map((line, index) => ({
    id: line.label,
    label: line.label,
    color: BENCH_INK[index % BENCH_INK.length],
    dashed: true,
    points: windowPoints(line.points, months, end),
  }));
  const chosen = picked.filter((label) => indices.some((line) => line.label === label));
  const shown = [portfolio, ...indices.filter((line) => chosen.includes(line.label))].filter((line): line is NonNullable<typeof portfolio> => line != null && line.points.length > 1);
  const lead = portfolio ? seriesReturn(portfolio.points) : null;
  const compared = indices.find((line) => chosen.includes(line.label));
  const bench = compared ? seriesReturn(compared.points) : null;
  const periodLabel = portal.period === "all" ? "Since inception" : periodMeta(portal.period).label;

  function toggle(label: string) {
    setPicked((current) => current.includes(label) ? current.filter((item) => item !== label) : [...current, label]);
  }

  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">Analytics</p>
        <h1>Performance</h1>
        <p>Measured against your selected benchmark</p>
      </header>
      <section className="performance-hero">
        <div>
          <span>Portfolio return · {periodMeta(portal.period).label}</span>
          <strong>{lead != null ? <Percent value={lead} /> : "—"}</strong>
        </div>
        <div>
          <span>Outperformance</span>
          <b>{lead != null && bench != null ? <Percent value={lead - bench} /> : "—"}</b>
          <small>{compared ? `vs ${compared.label}` : "Choose an index below"}</small>
        </div>
      </section>
      {source[0] ? (
        <section className="section chart-section">
          <div className="section-head">
            <div>
              <p className="eyebrow">Growth of ₹ 100</p>
              <h2>Portfolio vs benchmark</h2>
            </div>
          </div>
          {indices.length ? (
            <div className="compare-picks" role="group" aria-label="Indexes to compare">
              {indices.map((line) => (
                <button key={line.id} type="button" className={chosen.includes(line.label) ? "on" : ""} aria-pressed={chosen.includes(line.label)} onClick={() => toggle(line.label)}>
                  <i style={{ background: line.color }} />
                  {line.label}
                </button>
              ))}
            </div>
          ) : null}
          <div className="chart-legend">
            {portfolio ? (
              <span><i className="legend-dot" style={{ background: portfolio.color }} />{portfolio.label} {lead != null ? <b><Percent value={lead} tone={false} /></b> : null}</span>
            ) : null}
            {indices.filter((line) => chosen.includes(line.label)).map((line) => {
              const value = seriesReturn(line.points);
              return (
                <span key={line.id}><i className="legend-dot" style={{ background: line.color }} />{line.label} {value != null ? <b><Percent value={value} tone={false} /></b> : null}</span>
              );
            })}
          </div>
          {shown.length ? <Spark series={shown} /> : <p className="quiet">No points in this period.</p>}
          <PeriodChips ids={PERIODS.map((period) => ({ id: period.id, label: period.label }))} value={portal.period} onChange={(id) => portal.setPeriod(id as PeriodId)} />
        </section>
      ) : null}
      {portfolio && indices.length ? (
        <section className="section">
          <div className="section-head">
            <div>
              <p className="eyebrow">Return comparison</p>
              <h2>{periodLabel}</h2>
            </div>
          </div>
          <div className="return-table">
            <div className="return-head">
              <span>Index</span>
              <span>Portfolio</span>
              <span>Benchmark</span>
              <span>Difference</span>
            </div>
            {indices.map((line) => {
              const value = seriesReturn(line.points);
              return (
                <div className="return-row" key={line.id}>
                  <b>{line.label}</b>
                  <span>{lead != null ? <Percent value={lead} /> : "—"}</span>
                  <span>{value != null ? <Percent value={value} /> : "—"}</span>
                  <span>{lead != null && value != null ? <Percent value={lead - value} /> : "—"}</span>
                </div>
              );
            })}
          </div>
          {end ? <p className="method-note">Growth of ₹ 100 over this period, through <span className="num">{asOfLabel(end)}</span>.</p> : null}
        </section>
      ) : null}
    </>
  );
}
