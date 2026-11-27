import { breakdown, positionsFor, totals } from "../data/book";
import { ConicDonut, Money } from "../components";
import { pct, rupee } from "../format";
import { usePersistedState } from "../persist";
import { usePortal } from "../state";

const TABS = ["Asset class", "Sector", "Holdings", "Family"] as const;
type Tab = (typeof TABS)[number];
const RING = ["#132f43", "#287b78", "#7aa9a0", "#c6a969", "#cbd3d7", "#1c435d"];

type AllocChoice = { tab: Tab; picked: string | null };

function isAlloc(value: unknown): value is AllocChoice {
  if (!value || typeof value !== "object") return false;
  const row = value as AllocChoice;
  return (TABS as readonly string[]).includes(row.tab) && (row.picked === null || typeof row.picked === "string");
}

export function Allocation() {
  const portal = usePortal();
  const [choice, setChoice] = usePersistedState<AllocChoice>(portal.code, "allocation", { tab: "Asset class", picked: null }, isAlloc);
  const tab = choice.tab;
  const picked = choice.picked;
  const setPicked = (next: string | null) => setChoice((current) => ({ ...current, picked: next }));
  const rows = positionsFor(portal.bookId, portal.context);
  const portfolio = totals(rows).value;
  const assets = breakdown(rows, "asset", portal.bookId).filter((row) => row.weight > 0);
  const sectors = breakdown(rows.filter((row) => row.asset === "stocks"), "sector", portal.bookId).map((row) => ({
    ...row,
    weight: portfolio ? row.value / portfolio : 0,
  }));
  const members = breakdown(rows, "member", portal.bookId);
  const top = [...rows].filter((row) => row.asset !== "cash").sort((a, b) => b.value - a.value).slice(0, 10);
  const sectorMax = Math.max(...sectors.map((row) => row.weight), 0.01);
  const holdingMax = Math.max(...top.map((row) => (portfolio ? row.value / portfolio : 0)), 0.01);
  return (
    <div className="stack allocation">
      <header className="page-heading">
        <p className="eyebrow">Distribution</p>
        <h1>Allocation</h1>
        <p>How your wealth is distributed</p>
      </header>
      <div className="segmented" role="tablist">
        {TABS.map((name) => (
          <button key={name} type="button" role="tab" aria-selected={tab === name} className={tab === name ? "active" : ""} onClick={() => setChoice({ tab: name, picked: null })}>
            {name}
          </button>
        ))}
      </div>

      {tab === "Asset class" ? (
        <SliceDonut
          rows={assets}
          picked={picked}
          onPick={setPicked}
          centerValue={portfolio}
          centerLabel="Total value"
        />
      ) : null}

      {tab === "Sector" ? (
        <div className="bar-list">
          {sectors.map((row) => (
            <div key={row.id}>
              <div>
                <strong>{row.label}</strong>
                <span><span className="num">{row.count}</span> {row.count === 1 ? "security" : "securities"} · <Money value={row.value} /></span>
              </div>
              <b className="num">{pct(row.weight, 1)}</b>
              <i><em style={{ width: `${(row.weight / sectorMax) * 100}%` }} /></i>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "Holdings" ? (
        <div className="bar-list">
          {top.map((row, index) => {
            const weight = portfolio ? row.value / portfolio : 0;
            return (
              <div key={row.id}>
                <div>
                  <strong><small className="num">{index + 1}</small>{row.name}</strong>
                  <span><Money value={row.value} /></span>
                </div>
                <b className="num">{pct(weight, 1)}</b>
                <i><em style={{ width: `${(weight / holdingMax) * 100}%` }} /></i>
              </div>
            );
          })}
        </div>
      ) : null}

      {tab === "Family" ? (
        <SliceDonut
          rows={members}
          picked={picked}
          onPick={setPicked}
          centerValue={portfolio}
          centerLabel="Family value"
        />
      ) : null}
    </div>
  );
}

function SliceDonut({
  rows,
  picked,
  onPick,
  centerValue,
  centerLabel,
}: {
  rows: { id: string; label: string; value: number; weight: number }[];
  picked: string | null;
  onPick: (id: string | null) => void;
  centerValue: number;
  centerLabel: string;
}) {
  const chosen = rows.find((row) => row.id === picked) ?? null;
  function toggle(id: string) {
    onPick(picked === id ? null : id);
  }
  return (
    <>
      <ConicDonut
        large
        legend={false}
        onPick={toggle}
        slices={rows.map((row) => ({ id: row.id, label: row.label, weight: row.weight }))}
        center={
          chosen ? (
            <>
              <b className="num">{pct(chosen.weight, 1)}</b>
              <span>{chosen.label}</span>
            </>
          ) : (
            <>
              <b><Compact value={centerValue} /></b>
              <span>{centerLabel}</span>
            </>
          )
        }
      />
      <div className="allocation-list">
        {rows.map((row, index) => (
          <button key={row.id} type="button" className={picked === row.id ? "on" : ""} onClick={() => toggle(row.id)}>
            <i style={{ background: RING[index % RING.length] }} />
            <div>
              <strong>{row.label}</strong>
              <span><Money value={row.value} /></span>
            </div>
            <b className="num">{pct(row.weight, 1)}</b>
            <Caret />
          </button>
        ))}
      </div>
    </>
  );
}

function Compact({ value }: { value: number }) {
  const { hidden } = usePortal();
  const abs = Math.abs(value);
  const text = abs >= 1e7 ? `₹ ${(value / 1e7).toFixed(2)} Cr` : abs >= 1e5 ? `₹ ${(value / 1e5).toFixed(2)} L` : rupee(value);
  return <span className={`num${hidden ? " privacy-blur" : ""}`}>{text}</span>;
}

function Caret() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
