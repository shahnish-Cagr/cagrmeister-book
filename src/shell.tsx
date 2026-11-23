import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { NavLink, useLocation } from "react-router";

const HeaderSlot = createContext<HTMLElement | null>(null);

/** Renders above the scroller, so the header stays put while the page content moves. */
export function PhoneHeader({ children }: { children: ReactNode }) {
  const slot = useContext(HeaderSlot);
  if (!slot) return null;
  return createPortal(children, slot);
}

const TABS = [
  { to: "/book", label: "Book", end: true, icon: House },
  { to: "/search", label: "Search", end: true, icon: Glass },
  { to: "/weights", label: "Weights", end: true, icon: Bars },
  { to: "/ledger", label: "Ledger", end: true, icon: List },
  { to: "/menu", label: "Menu", end: false, icon: Menu },
] as const;

export function Phone({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const scroller = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const dock = pathname !== "/open";

  useLayoutEffect(() => {
    setSlot(headerRef.current);
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo(0, 0);
  }, [pathname]);

  return (
    <HeaderSlot.Provider value={slot}>
      <div className="phone">
        <div className="phone-header" ref={headerRef} />
        <div className="phone-scroll" ref={scroller}>{children}</div>
        <footer className="book-footer">
          Powered by <span>CAGRMEISTER</span>
        </footer>
        {dock && (
          <nav className="dock" aria-label="Book">
            {TABS.map((tab) => (
              <NavLink key={tab.to} to={tab.to} end={tab.end} className={({ isActive }) => (isActive ? "active" : "")}>
                <tab.icon />
                {tab.label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </HeaderSlot.Provider>
  );
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

function House() {
  return <Icon><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" /></Icon>;
}
function Glass() {
  return <Icon><circle cx="11" cy="11" r="6" /><path d="m20 20-3.5-3.5" /></Icon>;
}
function Bars() {
  return <Icon><path d="M4 7h16M4 12h10M4 17h13" /></Icon>;
}
function List() {
  return <Icon><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></Icon>;
}
function Menu() {
  return <Icon><path d="M4 7h16M4 12h16M4 17h16" /></Icon>;
}
