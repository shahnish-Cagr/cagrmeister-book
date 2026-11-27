import { useEffect, useMemo, useRef, useState } from "react";
import { bookById, transactionsFor } from "../data/book";
import { usePersistedState } from "../persist";
import { usePortal } from "../state";

type ReportChoice = {
  mode: "fy" | "month" | "custom";
  fyPick: number;
  monthPick: string;
  browseYear: number;
  from: string | null;
  to: string | null;
  cursor: string;
};

function isReportChoice(value: unknown): value is ReportChoice {
  if (!value || typeof value !== "object") return false;
  const row = value as ReportChoice;
  return (row.mode === "fy" || row.mode === "month" || row.mode === "custom")
    && typeof row.fyPick === "number"
    && typeof row.monthPick === "string"
    && typeof row.browseYear === "number"
    && (row.from === null || typeof row.from === "string")
    && (row.to === null || typeof row.to === "string")
    && typeof row.cursor === "string";
}

const REPORTS = [
  { id: "statement", title: "Portfolio statement", note: "Complete portfolio summary and valuation", format: "PDF" },
  { id: "holdings", title: "Holdings report", note: "Detailed position-level holdings", format: "CSV" },
  { id: "performance", title: "Performance report", note: "Returns and benchmark comparison", format: "PDF" },
  { id: "transactions", title: "Transaction report", note: "All portfolio activity for the period", format: "CSV" },
  { id: "allocation", title: "Asset allocation report", note: "Exposure across assets and sectors", format: "PDF" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function Reports() {
  const portal = usePortal();
  const asOf = bookById(portal.bookId).asOf;
  const earliest = useMemo(() => {
    const dates = transactionsFor(portal.bookId, portal.context).map((txn) => txn.date).filter(Boolean);
    return dates.reduce((min, date) => (date < min ? date : min), asOf);
  }, [portal.bookId, portal.context, asOf]);
  const fyOptions = financialYears(earliest, asOf);
  const monthYears = yearSpan(earliest, asOf);
  const [choice, setChoice] = usePersistedState<ReportChoice>(portal.code, "reports", {
    mode: "fy",
    fyPick: fyStartYear(asOf),
    monthPick: asOf.slice(0, 7),
    browseYear: Number(asOf.slice(0, 4)),
    from: null,
    to: null,
    cursor: asOf.slice(0, 7),
  }, isReportChoice);
  const { mode, fyPick, monthPick, browseYear, from, to, cursor } = choice;
  const patch = (next: Partial<ReportChoice>) => setChoice((current) => ({ ...current, ...next }));
  const setMode = (next: ReportChoice["mode"]) => patch({ mode: next });
  const setFyPick = (fyPick: number) => patch({ fyPick });
  const setBrowseYear = (browseYear: number) => patch({ browseYear });
  const setMonthPick = (monthPick: string) => patch({ monthPick });
  const setCursor = (cursor: string) => patch({ cursor });
  const setFrom = (from: string | null) => patch({ from });
  const setTo = (to: string | null) => patch({ to });
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent) {
      if (!anchor.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const fy = fyOptions.includes(fyPick) ? fyPick : fyOptions[0];
  const shownYear = monthYears.includes(browseYear) ? browseYear : monthYears[0];
  const period = mode === "fy"
    ? fyRange(fy, asOf)
    : mode === "month"
      ? monthRange(monthPick, asOf)
      : customRange(from, to);

  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">Documents</p>
        <h1>Reports</h1>
        <p>Statements and portfolio exports</p>
      </header>
      <div className="report-anchor" ref={anchor}>
        <button type="button" className="report-period" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          <div>
            <CalendarIcon />
            <span>
              {period.kind ? <small>{period.kind}</small> : null}
              {period.label ? <b className="num">{period.label}</b> : null}
            </span>
          </div>
          <Chevron open={open} />
        </button>
        {open ? (
          <div className="report-pop" role="dialog" aria-label="Reporting period">
            <PeriodChoices
              asOf={asOf}
              earliest={earliest}
              mode={mode}
              fy={fy}
              fyOptions={fyOptions}
              monthYears={monthYears}
              shownYear={shownYear}
              monthPick={monthPick}
              cursor={cursor}
              from={from}
              to={to}
              onFy={(year) => { setMode("fy"); setFyPick(year); }}
              onYear={setBrowseYear}
              onMonth={(key) => { setMode("month"); setMonthPick(key); }}
              onCursor={setCursor}
              onPick={(iso) => {
                if (mode !== "custom") {
                  setMode("custom");
                  setFrom(iso);
                  setTo(null);
                  return;
                }
                pickRange(iso, from, to, setFrom, setTo);
              }}
            />
          </div>
        ) : null}
      </div>

      <div className="reports-list">
        {REPORTS.map((report) => (
          <div key={report.id}>
            <span className="report-icon"><FileIcon /></span>
            <span>
              <strong>{report.title}</strong>
              <span>{report.note}</span>
            </span>
            <button type="button">
              <DownloadIcon />
              <span>{report.format}</span>
            </button>
          </div>
        ))}
      </div>
      <p className="method-note with-icon">
        <InfoIcon />
        Report generation is represented for this frontend prototype. No file will be downloaded.
      </p>
    </>
  );
}

function PeriodChoices({
  asOf,
  earliest,
  mode,
  fy,
  fyOptions,
  monthYears,
  shownYear,
  monthPick,
  cursor,
  from,
  to,
  onFy,
  onYear,
  onMonth,
  onCursor,
  onPick,
}: {
  asOf: string;
  earliest: string;
  mode: "fy" | "month" | "custom";
  fy: number;
  fyOptions: number[];
  monthYears: number[];
  shownYear: number;
  monthPick: string;
  cursor: string;
  from: string | null;
  to: string | null;
  onFy: (year: number) => void;
  onYear: (year: number) => void;
  onMonth: (key: string) => void;
  onCursor: (value: string) => void;
  onPick: (iso: string) => void;
}) {
  const [open, setOpen] = useState<"fy" | "month" | "custom" | null>(mode);
  const toggle = (next: "fy" | "month" | "custom") => setOpen((current) => (current === next ? null : next));
  return (
    <>
      <section className="report-block">
        <button type="button" className="report-toggle" aria-expanded={open === "fy"} onClick={() => toggle("fy")}>
          <span className="eyebrow">Financial year</span>
          <Chevron open={open === "fy"} />
        </button>
        {open === "fy" ? (
          <div className="chip-row report-choices" role="group" aria-label="Financial year">
            {fyOptions.map((year) => (
              <button key={year} type="button" className={mode === "fy" && fy === year ? "active" : ""} onClick={() => onFy(year)}>
                FY <span className="num">{year}</span>-<span className="num">{year + 1}</span>
              </button>
            ))}
          </div>
        ) : null}
      </section>
      <section className="report-block">
        <button type="button" className="report-toggle" aria-expanded={open === "month"} onClick={() => toggle("month")}>
          <span className="eyebrow">Month</span>
          <Chevron open={open === "month"} />
        </button>
        {open === "month" ? (
          <>
            <div className="chip-row report-choices" role="group" aria-label="Year">
              {monthYears.map((year) => (
                <button key={year} type="button" className={shownYear === year ? "active" : ""} onClick={() => onYear(year)}>
                  <span className="num">{year}</span>
                </button>
              ))}
            </div>
            <div className="chip-row report-choices" role="group" aria-label="Month">
              {MONTHS.map((name, index) => {
                const key = `${shownYear}-${String(index + 1).padStart(2, "0")}`;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={key > asOf.slice(0, 7) || key < earliest.slice(0, 7)}
                    className={mode === "month" && monthPick === key ? "active" : ""}
                    onClick={() => onMonth(key)}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </>
        ) : null}
      </section>
      <section className="report-block">
        <button type="button" className="report-toggle" aria-expanded={open === "custom"} onClick={() => toggle("custom")}>
          <span className="eyebrow">Custom range</span>
          <Chevron open={open === "custom"} />
        </button>
        {open === "custom" ? (
          <div className="report-calendar">
            <RangeCalendar cursor={cursor} from={mode === "custom" ? from : null} to={mode === "custom" ? to : null} asOf={asOf} onCursor={onCursor} onPick={onPick} />
          </div>
        ) : null}
      </section>
    </>
  );
}

function financialYears(earliest: string, asOf: string) {
  const first = fyStartYear(earliest);
  const last = fyStartYear(asOf);
  const years: number[] = [];
  for (let year = last; year >= first; year -= 1) years.push(year);
  return years.length ? years : [last];
}

function yearSpan(earliest: string, asOf: string) {
  const first = Number(earliest.slice(0, 4));
  const last = Number(asOf.slice(0, 4));
  const years: number[] = [];
  for (let year = last; year >= first; year -= 1) years.push(year);
  return years.length ? years : [last];
}

function fyStartYear(iso: string) {
  const [year, month] = iso.split("-").map(Number);
  return month >= 4 ? year : year - 1;
}

function fyRange(startYear: number, asOf: string) {
  const from = `${startYear}-04-01`;
  const close = `${startYear + 1}-03-31`;
  return {
    kind: <>FY <span className="num">{startYear}</span>-<span className="num">{startYear + 1}</span></>,
    label: rangeLabel(from, close < asOf ? close : asOf),
  };
}

function monthRange(key: string, asOf: string) {
  const [yearText, monthText] = key.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const from = `${key}-01`;
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const close = `${key}-${String(last).padStart(2, "0")}`;
  const name = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-IN", { month: "long", timeZone: "UTC" });
  return {
    kind: <>{name} <span className="num">{year}</span></>,
    label: rangeLabel(from, close < asOf ? close : asOf),
  };
}

function customRange(from: string | null, to: string | null) {
  if (!from) return { kind: "Choose a start date", label: "" };
  if (!to) return { kind: "Choose an end date", label: stamp(from, true) };
  return { kind: null, label: rangeLabel(from, to) };
}

function stamp(iso: string, withYear: boolean) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: withYear ? "numeric" : undefined,
    timeZone: "UTC",
  });
}

function rangeLabel(from: string, to: string) {
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  return `${stamp(from, !sameYear)} – ${stamp(to, true)}`;
}

function pickRange(iso: string, from: string | null, to: string | null, setFrom: (value: string | null) => void, setTo: (value: string | null) => void) {
  if (!from || to) {
    setFrom(iso);
    setTo(null);
    return;
  }
  if (iso < from) {
    setTo(from);
    setFrom(iso);
    return;
  }
  setTo(iso);
}

function RangeCalendar({
  cursor,
  from,
  to,
  asOf,
  onCursor,
  onPick,
}: {
  cursor: string;
  from: string | null;
  to: string | null;
  asOf: string;
  onCursor: (value: string) => void;
  onPick: (iso: string) => void;
}) {
  const [yearText, monthText] = cursor.split("-");
  const year = Number(yearText);
  const month = Number(monthText) - 1;
  const cells = monthCells(year, month);
  const end = to ?? from;
  function shift(step: number) {
    const next = new Date(Date.UTC(year, month + step, 1));
    onCursor(`${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return (
    <div className="calendar">
      <div className="calendar-head">
        <button type="button" aria-label="Previous month" onClick={() => shift(-1)}><Caret dir="left" /></button>
        <strong>{MONTHS[month]} <span className="num">{year}</span></strong>
        <button type="button" aria-label="Next month" onClick={() => shift(1)}><Caret dir="right" /></button>
      </div>
      <div className="calendar-grid" role="grid">
        {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
        {cells.map((cell) => {
          const edge = cell.iso === from || cell.iso === to;
          const inside = Boolean(from && end && cell.iso >= from && cell.iso <= end);
          return (
            <button
              key={cell.iso}
              type="button"
              disabled={cell.iso > asOf}
              className={[cell.outside ? "outside" : "", inside ? "range" : "", edge ? "edge" : ""].filter(Boolean).join(" ")}
              onClick={() => onPick(cell.iso)}
            >
              <span className="num">{cell.day}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function monthCells(year: number, month: number) {
  const first = new Date(Date.UTC(year, month, 1));
  const lead = first.getUTCDay();
  const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: { iso: string; day: number; outside: boolean }[] = [];
  for (let index = 0; index < lead; index += 1) {
    const date = new Date(Date.UTC(year, month, 1 - (lead - index)));
    cells.push({ iso: date.toISOString().slice(0, 10), day: date.getUTCDate(), outside: true });
  }
  for (let day = 1; day <= count; day += 1) {
    cells.push({ iso: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`, day, outside: false });
  }
  while (cells.length % 7 !== 0) {
    const date = new Date(`${cells[cells.length - 1].iso}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + 1);
    cells.push({ iso: date.toISOString().slice(0, 10), day: date.getUTCDate(), outside: true });
  }
  return cells;
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3v4M17 3v4M3 10h18" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 2h9l4 4v16H6z" />
      <path d="M14 2v5h5M9 13h6M9 17h6" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.8 9a2.5 2.5 0 0 1 4.8 1c0 2-2.6 2-2.6 4M12 18h.01" />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className={open ? "open" : ""}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function Caret({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d={dir === "left" ? "m15 18-6-6 6-6" : "m9 6 6 6-6 6"} />
    </svg>
  );
}
