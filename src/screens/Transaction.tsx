import { Link, useParams } from "react-router";
import { assetLabel, findTransaction, memberName, sideLabel } from "../data/book";
import { longDate, units } from "../format";
import { Empty, Money } from "../components";

export function Transaction() {
  const { id } = useParams();
  const found = findTransaction(id ?? "");
  if (!found) return <Empty>That transaction is not in this book.</Empty>;
  const { book, txn } = found;
  const sell = txn.side === "sell";
  const kind = sideLabel(txn.side).toUpperCase();
  const meta = [txn.symbol, assetLabel(txn.asset)].filter(Boolean).join(" · ");

  return (
    <article className="receipt-screen">
      <div className={sell ? "receipt-icon sell" : "receipt-icon"} aria-hidden="true">
        <svg width="26" height="26" viewBox="0 0 24 24">
          <path d={sell ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"} />
        </svg>
      </div>
      <span className={sell ? "trade-badge sell" : "trade-badge"}>{kind} TRANSACTION</span>
      <h1>{txn.name}</h1>
      {meta ? <p className="receipt-meta">{meta}</p> : null}
      <div className="receipt-amount">
        <span>Total amount</span>
        <strong><Money value={txn.amount} /></strong>
      </div>
      <div className="receipt-fields">
        <div><span>Transaction date</span><b className="num">{longDate(txn.date)}</b></div>
        {txn.side === "inflow" ? null : <div><span>Quantity</span><b className="num">{units(txn.qty)} shares</b></div>}
        {txn.side === "buy" || txn.side === "sell" || txn.side === "dividend" ? (
          <div><span>Execution price</span><b><Money value={txn.price} /></b></div>
        ) : null}
        <div><span>Gross amount</span><b><Money value={txn.amount} /></b></div>
        {txn.balQty != null ? <div><span>Balance quantity</span><b className="num">{units(txn.balQty)}</b></div> : null}
        {txn.realised ? <div><span>Realised</span><b><Money value={txn.realised} signed /></b></div> : null}
        <div><span>Portfolio / member</span><b>{memberName(book.id, txn.member)}</b></div>
      </div>
      {txn.note ? <p className="quiet">{txn.note}</p> : null}
      <Link className="secondary-button full" to="/transactions">
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m15 18-6-6 6-6" />
          <path d="M9 12h11" />
        </svg>
        Back to transactions
      </Link>
    </article>
  );
}
