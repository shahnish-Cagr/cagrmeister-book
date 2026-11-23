import { Link } from "react-router";
import { AS_OF_LABEL, SLEEVES, gainPct, scopeLabel, sumCost, sumValue } from "../book";
import { inr, pct } from "../format";
import { Frame } from "../frame";
import { useBook } from "../scope";
import { Empty, toneClass } from "../ui";

export function Weights() {
  const { rows, scope } = useBook();
  const total = sumValue(rows);

  return (
    <Frame title="Weights" sub={`${scopeLabel(scope)} · ${AS_OF_LABEL}`}>
      {total === 0 ? (
        <Empty>No positions to weigh.</Empty>
      ) : (
        SLEEVES.map((sleeve) => {
          const held = rows.filter((h) => h.sleeve === sleeve.id);
          const cost = sumCost(held);
          const value = sumValue(held);
          const share = value / total;
          const rate = gainPct({ cost, value });
          return (
            <section key={sleeve.id} className="brief-weight">
              <Link to={`/sleeve/${sleeve.id}`} className="weight-head">
                <span>{sleeve.label}</span>
                <b className={toneClass(rate)}>{pct(rate)}</b>
              </Link>
              <div className="brief-bar" role="img" aria-label={`${sleeve.label} is ${pct(share, 1)} of the book`}>
                <i style={{ width: `${Math.min(100, share * 100)}%` }} />
              </div>
              <p>
                <span><b>{pct(share, 1)}</b> of the book</span>
                <span>{inr(value)}</span>
              </p>
              {held.length > 0 && (
                <ul className="sheet">
                  {held.map((h) => {
                    const part = value === 0 ? 0 : h.value / value;
                    return (
                      <li key={h.id}>
                        <Link to={`/name/${h.id}`} className="name-row">
                          <span className="name-row-title">{h.name}</span>
                          <span className="name-row-amt">{pct(part, 1)}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })
      )}
    </Frame>
  );
}
