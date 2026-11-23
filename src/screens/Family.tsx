import { useState } from "react";
import { useNavigate } from "react-router";
import { BOOKS, FAMILY_GROUP, bookLabel, scopeLabel, type BookId } from "../book";
import { SCOPES } from "../book";
import { useBook } from "../scope";
import { Empty, ScreenHead, SearchField } from "../ui";

export function Family() {
  const { book, setBook, scope, setScope } = useBook();
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const needle = q.trim().toLowerCase();
  const list = SCOPES.filter((row) => row.label.toLowerCase().includes(needle));

  return (
    <>
      <ScreenHead title={FAMILY_GROUP} sub={`${bookLabel(book)} · ${scopeLabel(scope)}`} to="/book" back="Book" />
      <nav className="ledger-switch" aria-label="Book">
        {BOOKS.map((row) => (
          <button
            key={row.id}
            type="button"
            className={book === row.id ? "on" : ""}
            aria-pressed={book === row.id}
            onClick={() => setBook(row.id as BookId)}
          >
            {row.label}
          </button>
        ))}
      </nav>
      <SearchField value={q} onChange={setQ} placeholder="Search portfolios" />
      {list.length === 0 ? (
        <Empty>Nothing matches.</Empty>
      ) : (
        <ul className="sheet">
          {list.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                className="name-row pick"
                onClick={() => {
                  setScope(row.id);
                  navigate("/book");
                }}
              >
                <span className="name-row-title">{row.label}</span>
                {scope === row.id ? <span className="name-row-amt">Viewing</span> : <span />}
              </button>
            </li>
          ))}
        </ul>
      )}
      {book === "fo" && <p className="note">No positions in F&O. Choosing a portfolio still sets who you are reading.</p>}
    </>
  );
}
