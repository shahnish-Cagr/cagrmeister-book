import { useMemo } from "react";
import { Link } from "react-router";
import { AS_OF_LABEL, scopeLabel } from "../book";
import { inr, longDate, px, qty } from "../format";
import { Frame } from "../frame";
import { useBook } from "../scope";
import { Empty } from "../ui";

export function Ledger() {
  const { rows, scope } = useBook();
  const lines = useMemo(() => {
    return rows
      .flatMap((holding) => holding.fills.map((fill) => ({ holding, fill })))
      .sort((a, b) => b.fill.date.localeCompare(a.fill.date) || a.holding.name.localeCompare(b.holding.name));
  }, [rows]);

  let previous = "";

  return (
    <Frame title="Ledger" sub={`${scopeLabel(scope)} · ${AS_OF_LABEL}`}>
      {lines.length === 0 ? (
        <Empty>No trades in this book.</Empty>
      ) : (
        <ul className="sheet">
          {lines.map(({ holding, fill }) => {
            const stamp = fill.date !== previous;
            previous = fill.date;
            return (
              <li key={`${holding.id}-${fill.date}-${fill.price}`}>
                {stamp && <h2 className="kicker">{longDate(fill.date)}</h2>}
                <Link to={`/name/${holding.id}/transactions`} className="name-row">
                  <span className="name-row-title">{holding.name}</span>
                  <span className={`ledger-side ${fill.side}`}>{fill.side === "buy" ? "Buy" : "Sell"}</span>
                  <span className="name-row-meta">{qty(fill.qty)} at {px(fill.price)}</span>
                  <span className="name-row-amt">{inr(fill.amount)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Frame>
  );
}
