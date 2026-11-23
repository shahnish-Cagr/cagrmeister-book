import type { ReactNode } from "react";
import { Link } from "react-router";
import { gainPct, type Holding } from "./book";
import { inr, pct, qty } from "./format";
import { PhoneHeader } from "./shell";

export function toneClass(n: number): string {
  return n > 0 ? "up" : n < 0 ? "down" : "";
}

export function ScreenHead({ title, sub, to, back }: { title: string; sub?: string; to: string; back: string }) {
  return (
    <PhoneHeader>
      <header className="sleeve-head">
        <Link to={to} aria-label={back}>‹</Link>
        <div>
          <h1>{title}</h1>
          {sub ? <p>{sub}</p> : null}
        </div>
      </header>
    </PhoneHeader>
  );
}

export function FilterButton({ pressed, expanded, onClick, label }: { pressed: boolean; expanded?: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      className={pressed ? "icon-filter on" : "icon-filter"}
      aria-label={label}
      aria-pressed={pressed}
      aria-expanded={expanded}
      onClick={onClick}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M4 6h16M4 12h16M4 18h16" />
        <circle cx="8" cy="6" r="2" fill="currentColor" stroke="none" />
        <circle cx="16" cy="12" r="2" fill="currentColor" stroke="none" />
        <circle cx="10" cy="18" r="2" fill="currentColor" stroke="none" />
      </svg>
    </button>
  );
}

export function SearchField({ value, onChange, placeholder }: { value: string; onChange: (next: string) => void; placeholder: string }) {
  return (
    <div className="seek">
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function NameRow({ h, to }: { h: Holding; to: string }) {
  const p = gainPct(h);
  return (
    <Link to={to} className="name-row">
      <span className="name-row-title">{h.name}</span>
      <span className={toneClass(p)}>{pct(p)}</span>
      <span className="name-row-meta">{qty(h.qty)} · {inr(h.cost)}</span>
      <span className="name-row-amt">{inr(h.value)}</span>
    </Link>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}
