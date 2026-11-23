import { useMemo, useState } from "react";
import { AS_OF_LABEL, SLEEVES, scopeLabel } from "../book";
import { Frame } from "../frame";
import { useBook } from "../scope";
import { Empty, NameRow, SearchField } from "../ui";

export function Search() {
  const { rows, scope } = useBook();
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const found = useMemo(
    () => (needle ? rows.filter((h) => h.name.toLowerCase().includes(needle)) : rows),
    [rows, needle],
  );

  return (
    <Frame title="Search" sub={`${scopeLabel(scope)} · ${AS_OF_LABEL}`}>
      <SearchField value={q} onChange={setQ} placeholder="Search the book" />
      {rows.length === 0 ? (
        <Empty>No positions in this book.</Empty>
      ) : found.length === 0 ? (
        <Empty>Nothing matches.</Empty>
      ) : (
        SLEEVES.map((sleeve) => {
          const held = found.filter((h) => h.sleeve === sleeve.id);
          if (held.length === 0) return null;
          return (
            <section key={sleeve.id}>
              <h2 className="kicker">{sleeve.label}</h2>
              <ul className="sheet">
                {held.map((h) => (
                  <li key={h.id}><NameRow h={h} to={`/name/${h.id}`} /></li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </Frame>
  );
}
