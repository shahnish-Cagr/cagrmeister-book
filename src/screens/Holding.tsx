import { Link, useParams } from "react-router";
import { findPosition, memberIdsFor, memberName, positionsFor, sleeveLabel, totals, transactionsFor } from "../data/book";
import { units } from "../format";
import { Empty, Money, Percent, TxnRow } from "../components";
import { usePortal } from "../state";

export function Holding() {
  const portal = usePortal();
  const { id } = useParams();
  const row = findPosition(portal.bookId, id ?? "");
  if (!row) return <Empty>That holding is not in this book.</Empty>;

  const scopeMembers = memberIdsFor(portal.bookId, portal.context);
  const scope = !scopeMembers || scopeMembers.includes(row.member) ? portal.context : "family";
  const peers = positionsFor(portal.bookId, scope).sort((a, b) => b.value - a.value);
  const book = totals(peers);
  const weight = book.value ? row.value / book.value : 0;
  const rank = peers.findIndex((item) => item.id === row.id) + 1;
  const gain = row.unrealised ?? row.gain;
  const gainPct = row.unrealisedPct ?? row.gainPct;
  const price = row.marketPrice ?? (row.valuedAtCost ? null : row.price);
  const txns = transactionsFor(portal.bookId, row.member)
    .filter((txn) => txn.securityId === row.id)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const subtitle = [row.symbol, memberName(portal.bookId, row.member)].filter(Boolean).join(" · ");

  return (
    <>
      <header className="detail-title">
        <div className="security-avatar large">{initials(row.name)}</div>
        <div>
          <h1>{row.name}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </header>
      <section className="detail-value">
        <span>{row.marketValue != null ? "Current market value" : "Book value"}</span>
        <strong><Money value={row.value} /></strong>
        <p className={gain < 0 ? "holding-move down" : "holding-move up"}>
          <span className="move-tag">Unrealised</span>
          <Percent value={gainPct} />
          {" · "}
          <Money value={gain} signed />
        </p>
      </section>
      <section className="stat-row">
        <div><span>Quantity</span><strong className="num">{units(row.qty)}</strong></div>
        <div><span>Average price</span><Money value={row.avg} /></div>
        <div><span>Current price</span>{price != null ? <Money value={price} /> : <strong className="num">—</strong>}</div>
        <div><span>Portfolio weight</span><strong className="num">{book.value ? `${(weight * 100).toFixed(2)}%` : "—"}</strong></div>
      </section>
      <section className="stat-row">
        <div><span>Realised gain</span><strong><Money value={row.realised} signed /></strong></div>
        <div><span>XIRR</span>{row.xirr != null ? <strong><Percent value={row.xirr} /></strong> : <strong className="num">—</strong>}</div>
      </section>
      <section className="section">
        <p className="eyebrow">Contribution</p>
        <h2>Portfolio impact</h2>
        <div className="impact-grid">
          <div>
            <span>Return contribution</span>
            <b><Percent value={weight * gainPct} /></b>
          </div>
          <div>
            <span>Sleeve</span>
            <b>{sleeveLabel(row.sleeve) || row.sector || "—"}</b>
          </div>
          <div>
            <span>Position rank</span>
            <b><span className="num">#{rank || "—"}</span> of <span className="num">{peers.length}</span></b>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="section-head">
          <div>
            <p className="eyebrow">History</p>
            <h2>Transactions</h2>
          </div>
          {txns.length ? <Link className="text-button" to="/transactions">View all</Link> : null}
        </div>
        {txns[0] ? <TxnRow txn={txns[0]} /> : <Empty>No transactions for this holding.</Empty>}
      </section>
    </>
  );
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}
