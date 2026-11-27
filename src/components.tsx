import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Link } from "react-router";
import { CartesianGrid, Cell, Legend, Line, LineChart as ReLine, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { inr, longDate, pct, rupee, signedPct, signedRupee, units } from "./format";
import { memberName, sideLabel, type Position, type Transaction } from "./data/book";
import { usePortal } from "./state";

export function Money({ value, signed = false, tone = false }: { value: number; signed?: boolean; tone?: boolean }) {
  const { hidden } = usePortal();
  const text = signed ? signedRupee(value) : rupee(value);
  const toneClass = signed || tone ? toneOf(value) : "";
  return <span className={`num ${toneClass}${hidden ? " privacy-blur" : ""}`}>{text}</span>;
}

export function Percent({ value, digits = 2, tone = true }: { value: number; digits?: number; tone?: boolean }) {
  return <span className={`num${tone ? ` ${toneOf(value)}` : ""}`}>{signedPct(value, digits)}</span>;
}

function toneOf(value: number) {
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "";
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div
        className="context-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" />
        <div className="sheet-head">
          <h2>{title}</h2>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Notice({ title, body, onClose }: { title: string; body: string; onClose: () => void }) {
  return (
    <Sheet title={title} onClose={onClose}>
      <p className="note">{body}</p>
      <button type="button" className="primary" onClick={onClose}>Done</button>
    </Sheet>
  );
}

export function PeriodChips({
  ids,
  value,
  onChange,
}: {
  ids: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="period-tabs" role="tablist">
      {ids.map((item) => (
        <button
          key={item.id}
          type="button"
          className={item.id === value ? "active" : ""}
          aria-pressed={item.id === value}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

type Point = { date: string; value: number };

export const CHART_INK = ["#132f43", "#d97706", "#2563eb", "#287b78", "#b95f57"];

export function LineChart({
  series,
  format,
  toggleRest = false,
}: {
  series: { id: string; label: string; color: string; points: Point[] }[];
  format: (value: number) => string;
  toggleRest?: boolean;
}) {
  const { hidden } = usePortal();
  const [off, setOff] = useState<string[]>(() => {
    if (!toggleRest) return [];
    const keep = series.find((item) => item.label.toLowerCase() === "ardeko")?.id ?? series[0]?.id;
    return series.filter((item) => item.id !== keep).map((item) => item.id);
  });
  const locked = series.find((item) => item.label.toLowerCase() === "ardeko")?.id ?? series[0]?.id;
  const shown = toggleRest ? series.filter((item) => item.id === locked || !off.includes(item.id)) : series;
  const dates = [...new Set(shown.flatMap((item) => item.points.map((point) => point.date)))].sort();
  if (dates.length < 2) return null;
  const lookup = shown.map((item) => new Map(item.points.map((point) => [point.date, point.value])));
  const rows = dates.map((date) => {
    const row: Record<string, string | number | null> = { date };
    shown.forEach((item, index) => {
      row[item.id] = lookup[index].get(date) ?? null;
    });
    return row;
  });
  const tick = (value: number) => axisTick(value);

  return (
    <div className="chart-block">
      {toggleRest && series.length > 1 ? (
        <div className="chips chart-switches" role="group" aria-label="Indexes on the chart">
          {series.map((item) => {
            const pinned = item.id === locked;
            const on = pinned || !off.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                className={on ? "chip on" : "chip"}
                aria-pressed={on}
                onClick={() => {
                  if (pinned) return;
                  setOff((current) => (current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]));
                }}
              >
                <i style={{ background: item.color }} />
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    <div className={hidden ? "chart is-private" : "chart"} role="img" aria-label="Performance chart">
      <ResponsiveContainer width="100%" height="100%">
        <ReLine data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e4e6ea" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={shortAxisDate}
            minTickGap={32}
            tickLine={false}
            axisLine={{ stroke: "#e4e6ea" }}
            tick={{ fill: "#6f685f", fontSize: 11, fontFamily: "IBM Plex Mono, ui-monospace, monospace", fontWeight: 600 }}
          />
          <YAxis
            tickFormatter={tick}
            width={52}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#6f685f", fontSize: 11, fontFamily: "IBM Plex Mono, ui-monospace, monospace", fontWeight: 600 }}
            domain={["auto", "auto"]}
          />
          <Tooltip
            content={(props) => (
              <ChartTip
                active={props.active}
                label={typeof props.label === "number" ? String(props.label) : props.label}
                payload={props.payload?.map((item) => ({
                  dataKey: item.dataKey == null ? undefined : String(item.dataKey),
                  name: item.name == null ? undefined : String(item.name),
                  color: item.color,
                  value: typeof item.value === "number" ? item.value : null,
                }))}
                format={format}
                hidden={hidden}
              />
            )}
            cursor={{ stroke: "#132f43", strokeDasharray: "3 3" }}
          />
          {!toggleRest && shown.length > 1 ? (
            <Legend
              iconType="plainline"
              wrapperStyle={{ fontSize: 12, color: "#6f685f", paddingTop: 8 }}
            />
          ) : null}
          {shown.map((item) => (
            <Line
              key={item.id}
              type="monotone"
              dataKey={item.id}
              name={item.label}
              stroke={item.color}
              strokeWidth={item.id === locked && shown.length > 1 ? 2.5 : 2}
              dot={false}
              connectNulls={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </ReLine>
      </ResponsiveContainer>
    </div>
    </div>
  );
}

function ChartTip({
  active,
  payload,
  label,
  format,
  hidden,
}: {
  active?: boolean;
  payload?: { dataKey?: string | number; name?: string; color?: string; value?: number | string | null }[];
  label?: string | number;
  format: (value: number) => string;
  hidden: boolean;
}) {
  if (!active || !payload?.length || label == null) return null;
  return (
    <div className="chart-pop">
      <span>{longDate(String(label))}</span>
      {payload.map((item) => {
        const value = typeof item.value === "number" ? item.value : null;
        return (
          <span key={String(item.dataKey)}>
            <i style={{ background: item.color }} />
            {item.name}
            <strong className={`num${hidden ? " privacy-blur" : ""}`}>{value == null ? "—" : format(value)}</strong>
          </span>
        );
      })}
    </div>
  );
}

function axisTick(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1e7) return `${(value / 1e7).toFixed(1)} Cr`;
  if (abs >= 1e5) return `${(value / 1e5).toFixed(1)} L`;
  if (abs >= 1000) return `${Math.round(value / 1000)}k`;
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function shortAxisDate(iso: string) {
  const [year, month] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[(month ?? 1) - 1]} ${String(year ?? "").slice(2)}`;
}

const RING = ["#132f43", "#287b78", "#7aa9a0", "#c6a969", "#cbd3d7", "#1c435d"];

export function ConicDonut({
  slices,
  large = false,
  legend = true,
  center,
  onPick,
}: {
  slices: { id: string; label: string; weight: number }[];
  large?: boolean;
  legend?: boolean;
  center?: ReactNode;
  onPick?: (id: string) => void;
}) {
  const shown = slices.filter((slice) => slice.weight > 0);
  if (!shown.length) return null;
  let cursor = 0;
  const stops = shown.map((slice, index) => {
    const start = cursor;
    cursor += slice.weight;
    return { ...slice, color: RING[index % RING.length], start, end: cursor };
  });
  const top = [...stops].sort((a, b) => b.weight - a.weight)[0];
  const background = `conic-gradient(${stops.map((slice) => `${slice.color} ${slice.start * 100}% ${slice.end * 100}%`).join(", ")})`;
  function pick(event: MouseEvent<HTMLDivElement>) {
    if (!onPick) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - (rect.left + rect.width / 2);
    const y = event.clientY - (rect.top + rect.height / 2);
    if (Math.hypot(x, y) < rect.width * 0.28) return;
    let angle = Math.atan2(x, -y);
    if (angle < 0) angle += Math.PI * 2;
    const at = angle / (Math.PI * 2);
    const slice = stops.find((item) => at >= item.start && at < item.end) ?? (at >= stops[stops.length - 1].end ? stops[stops.length - 1] : null);
    if (slice) onPick(slice.id);
  }
  return (
    <div className={large ? "allocation-main" : "allocation-preview"}>
      <div
        className={large ? "donut large-donut" : "donut"}
        style={{ background }}
        onClick={pick}
      >
        <div onClick={(event) => event.stopPropagation()}>
          {center ?? (
            <>
              <b className="num">{pct(top.weight, 1)}</b>
              <span>{top.label}</span>
            </>
          )}
        </div>
      </div>
      {legend ? <div className="allocation-legend">
        {stops.map((slice) => (
          <div key={slice.id}>
            <i style={{ background: slice.color }} />
            <span>{slice.label}</span>
            <b className="num">{pct(slice.weight, 1)}</b>
          </div>
        ))}
      </div> : null}
    </div>
  );
}

export function Spark({
  series,
}: {
  series: { id: string; label: string; color: string; dashed?: boolean; points: { date: string; value: number }[] }[];
}) {
  const gradient = useId().replace(/:/g, "");
  const drawn = series.filter((line) => line.points.length > 1);
  if (!drawn.length) return null;
  const dates = [...new Set(drawn.flatMap((line) => line.points.map((point) => point.date)))].sort();
  const values = drawn.flatMap((line) => line.points.map((point) => point.value));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const width = 320;
  const height = 116;
  function yOf(value: number) {
    return 10 + (1 - (value - min) / span) * (height - 28);
  }
  function xOf(date: string) {
    if (dates.length < 2) return 0;
    return (dates.indexOf(date) / (dates.length - 1)) * width;
  }
  const marks = [0, Math.floor(dates.length / 3), Math.floor((dates.length * 2) / 3), dates.length - 1];
  const area = drawn[0];
  const areaCoords = area.points.map((point) => `${xOf(point.date)},${yOf(point.value)}`);
  const areaEnd = xOf(area.points[area.points.length - 1].date);
  return (
    <div className="chart-wrap">
      <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Portfolio performance chart">
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={area.color} stopOpacity="0.2" />
            <stop offset="1" stopColor={area.color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`M0 28H${width}M0 62H${width}M0 96H${width}`} className="grid-line" />
        <polygon points={`0,${height} ${areaCoords.join(" ")} ${areaEnd},${height}`} fill={`url(#${gradient})`} />
        {[...drawn.filter((line) => line.dashed), ...drawn.filter((line) => !line.dashed)].map((line) => {
          const coords = line.points.map((point) => `${xOf(point.date)},${yOf(point.value)}`).join(" ");
          return <polyline key={line.id} points={coords} className={line.dashed ? "benchmark-line" : "portfolio-line"} style={{ stroke: line.color }} />;
        })}
        <circle cx={areaEnd} cy={yOf(area.points[area.points.length - 1].value)} r="3.5" className="chart-end" style={{ stroke: area.color }} />
      </svg>
      <div className="chart-labels">
        {marks.map((index) => <span key={dates[index]}>{axisLabel(dates[index])}</span>)}
      </div>
    </div>
  );
}

export function windowPoints(points: { date: string; value: number }[], months: number | null, end?: string) {
  if (!points.length) return [];
  const last = end ?? points[points.length - 1].date;
  const capped = points.filter((point) => point.date <= last);
  if (!months) return capped;
  const cursor = new Date(`${last}T00:00:00Z`);
  cursor.setUTCMonth(cursor.getUTCMonth() - months);
  const start = cursor.toISOString().slice(0, 10);
  const sliced = capped.filter((point) => point.date >= start);
  return sliced.length > 1 ? sliced : [];
}

export function sliceSeries(points: { date: string; value: number }[], months: number | null) {
  if (!months || points.length < 2) return points;
  const end = new Date(points[points.length - 1].date);
  end.setMonth(end.getMonth() - months);
  const cut = end.toISOString().slice(0, 10);
  const sliced = points.filter((point) => point.date >= cut);
  return sliced.length > 1 ? sliced : points;
}

export function seriesReturn(points: { date: string; value: number }[]) {
  const first = points[0]?.value;
  const last = points[points.length - 1]?.value;
  if (!first || last == null) return null;
  return last / first - 1;
}

function axisLabel(iso: string) {
  const [year, month] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[(month ?? 1) - 1]} ’${String(year ?? "").slice(2)}`;
}

export function Donut({
  slices,
  active,
  onPick,
}: {
  slices: { id: string; label: string; value: number; color: string; weight: number }[];
  active?: string;
  onPick?: (id: string) => void;
}) {
  const shown = slices.filter((slice) => slice.weight > 0);
  const chosen = shown.find((slice) => slice.id === active) ?? shown[0];
  if (!shown.length) return null;
  return (
    <div className="donut-wrap">
      <div className="donut" role="img" aria-label="Asset allocation">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={shown}
              dataKey="weight"
              nameKey="label"
              innerRadius="64%"
              outerRadius="92%"
              paddingAngle={shown.length > 1 ? 1.5 : 0}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              onClick={(_, index) => {
                const slice = shown[index];
                if (slice) onPick?.(slice.id);
              }}
            >
              {shown.map((slice) => (
                <Cell key={slice.id} fill={slice.color} fillOpacity={!active || active === slice.id ? 1 : 0.35} />
              ))}
            </Pie>
            <Tooltip
              content={(props) => {
                const item = props.payload?.[0];
                if (!props.active || !item) return null;
                const weight = typeof item.value === "number" ? item.value : null;
                const payload = item.payload;
                const color = payload && typeof payload === "object" && "color" in payload ? String(payload.color) : undefined;
                return (
                  <div className="chart-pop">
                    <span>
                      <i style={{ background: color }} />
                      {typeof item.name === "string" ? item.name : ""}
                      <strong className="num">{weight == null ? "—" : pct(weight, 1)}</strong>
                    </span>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {chosen ? <span className="donut-label num">{pct(chosen.weight, 1)}</span> : null}
      </div>
      <ul className="legend">
        {shown.map((slice) => (
          <li key={slice.id}>
            <button type="button" onClick={() => onPick?.(slice.id)} className={active === slice.id ? "on" : ""}>
              <i style={{ background: slice.color }} />
              <span>{slice.label}</span>
              <strong className="num">{pct(slice.weight, 1)}</strong>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Bars({ rows }: { rows: { id: string; label: string; weight: number; value: number }[] }) {
  const max = Math.max(...rows.map((row) => row.weight), 0.01);
  return (
    <div className="bars">
      {rows.map((row) => (
        <div key={row.id} className="bar">
          <div className="bar-top">
            <span>{row.label}</span>
            <strong className="num">{pct(row.weight, 1)}</strong>
          </div>
          <div className="bar-track">
            <i style={{ width: `${(row.weight / max) * 100}%` }} />
          </div>
          <Money value={row.value} />
        </div>
      ))}
    </div>
  );
}

function AlignedPct({ value }: { value: number | null }) {
  if (value == null) return <span className="num aligned">—</span>;
  const sign = value > 0 ? "+" : value < 0 ? "−" : "\u00a0";
  return (
    <span className={`num aligned ${toneOf(value)}`}>
      <span>{sign}</span>
      <span>{pct(Math.abs(value))}</span>
    </span>
  );
}

function AlignedMoney({ value }: { value: number }) {
  const { hidden } = usePortal();
  const sign = value > 0 ? "+" : value < 0 ? "−" : "\u00a0";
  return (
    <span className={`num aligned ${toneOf(value)}${hidden ? " privacy-blur" : ""}`}>
      <span>{sign}</span>
      <span>₹ {inr(Math.abs(value))}</span>
    </span>
  );
}

function initials(name: string) {
  const parts = name.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "•";
}

function HoldLink({ row, cash }: { row: Position; cash: boolean }) {
  const { bookId } = usePortal();
  return (
    <Link className="holding-row" to={`/holdings/${row.id}`}>
      <div className="security-avatar" aria-hidden="true">{initials(row.name)}</div>
      <div className="security-name">
        <strong>{row.name}</strong>
        <span>{cash ? memberName(bookId, row.member) : `${row.symbol} · ${row.sector}`}</span>
      </div>
      <div className="holding-value">
        <strong className="holding-figure"><Money value={row.value} /></strong>
        <span className="holding-account">{memberName(bookId, row.member)}</span>
      </div>
      <span className="holding-figure returns">
        <span className="return-fact">
          <span className="figure-label">Unrealised</span>
          <AlignedPct value={row.unrealisedPct != null ? row.unrealisedPct : row.gainPct ? row.gainPct : null} />
        </span>
        <span className="return-fact">
          <span className="figure-label">XIRR</span>
          <AlignedPct value={row.xirr} />
        </span>
        <span className="return-fact">
          <span className="figure-label">Realised</span>
          <AlignedMoney value={row.realised} />
        </span>
      </span>
      <Caret />
    </Link>
  );
}

export function HoldingRow({ row }: { row: Position }) {
  return <HoldLink row={row} cash={row.asset === "cash"} />;
}

export function TxnRow({ txn }: { txn: Transaction }) {
  return (
    <Link className="transaction-row" to={`/transactions/${txn.id}`}>
      <span className={txn.side === "sell" ? "trade-badge sell" : "trade-badge"}>{sideLabel(txn.side).toUpperCase()}</span>
      <div>
        <strong>{txn.name}</strong>
        <span>
          {longDate(txn.date)}
          {txn.side === "buy" || txn.side === "sell" ? <> · <span className="num">{units(txn.qty)}</span> qty @ <Money value={txn.price} /></> : null}
          {txn.side === "dividend" ? <> · <span className="num">{units(txn.qty)}</span> shares</> : null}
          {txn.side === "inflow" ? " · Capital added" : null}
        </span>
      </div>
      <b><Money value={txn.amount} /></b>
      <Caret />
    </Link>
  );
}

function Caret() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}

export function usePaged<T>(items: T[], size: number, resetKey: string, initialPage = 0, onPage?: (page: number) => void) {
  const [page, setPageState] = useState(initialPage);
  const seen = useRef(resetKey);
  const notify = useRef(onPage);
  notify.current = onPage;
  function setPage(next: number) {
    setPageState(next);
    notify.current?.(next);
  }
  useEffect(() => {
    if (seen.current === resetKey) return;
    seen.current = resetKey;
    setPageState(0);
    notify.current?.(0);
  }, [resetKey]);
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(page, pages - 1);
  const start = current * size;
  return {
    page: current,
    pages,
    start,
    slice: items.slice(start, start + size),
    setPage,
  };
}

export function Pager({
  page,
  pages,
  total,
  start,
  size,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  start: number;
  size: number;
  onPage: (page: number) => void;
}) {
  if (pages <= 1) return null;
  const from = start + 1;
  const to = Math.min(total, start + size);
  return (
    <nav className="pager" aria-label="Pages">
      <button type="button" onClick={() => onPage(page - 1)} disabled={page === 0}>Previous</button>
      <span>
        <span className="num">{from}</span>–<span className="num">{to}</span>
        {" of "}
        <span className="num">{total}</span>
      </span>
      <button type="button" onClick={() => onPage(page + 1)} disabled={page >= pages - 1}>Next</button>
    </nav>
  );
}
