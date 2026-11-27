import { NavLink, Outlet, useLocation, Link } from "react-router";
import { BOOKS, bookById, bookGroups, contextName, findPosition, positionsFor, totals, type BookId, type ContextId } from "./data/book";
import { Money, Sheet } from "./components";
import { usePersistedState } from "./persist";
import { usePortal } from "./state";

const PRIMARY = [
  { to: "/", label: "Overview", end: true, icon: HomeIcon },
  { to: "/holdings", label: "Holdings", icon: BriefcaseIcon },
  { to: "/performance", label: "Performance", icon: ChartIcon },
  { to: "/transactions", label: "Activity", icon: SwapIcon },
];

const MORE = [
  { to: "/allocation", label: "Allocation" },
  { to: "/family", label: "Family" },
  { to: "/reports", label: "Reports" },
  { to: "/settings", label: "Settings" },
];

type Preview = "mobile" | "ipad" | "computer";

const PREVIEW: { id: Preview; label: string; icon: typeof PhoneIcon }[] = [
  { id: "mobile", label: "Mobile", icon: PhoneIcon },
  { id: "ipad", label: "iPad", icon: TabletIcon },
  { id: "computer", label: "Computer", icon: MonitorIcon },
];

function initialPreview(): Preview {
  if (window.innerWidth >= 1100) return "computer";
  if (window.innerWidth >= 700) return "ipad";
  return "mobile";
}

function isPreview(value: unknown): value is Preview {
  return value === "mobile" || value === "ipad" || value === "computer";
}

export function Shell() {
  const portal = usePortal();
  const location = useLocation();
  const more = location.pathname === "/more" || MORE.some((item) => location.pathname.startsWith(item.to));
  const book = bookById(portal.bookId);
  const name = contextName(portal.bookId, portal.context);
  const subtitle = portal.context === "family"
    ? book.kind === "single" ? "Portfolio" : "Consolidated family portfolio"
    : portal.context.startsWith("g:") ? "Family group" : book.name;
  const holdingId = location.pathname.match(/^\/holdings\/([^/]+)$/)?.[1];
  const holding = holdingId ? findPosition(portal.bookId, decodeURIComponent(holdingId)) : undefined;
  const backHeader = /^\/transactions\/[^/]+$/.test(location.pathname)
    ? { to: "/transactions", title: "Transaction details" }
    : holding
      ? { to: "/holdings", title: holding.name }
    : location.pathname.startsWith("/allocation")
      ? { to: "/more", title: "Portfolio allocation" }
      : location.pathname === "/family"
        ? { to: "/more", title: "Family portfolio" }
        : location.pathname === "/reports"
          ? { to: "/more", title: "Reports" }
          : location.pathname === "/settings"
            ? { to: "/more", title: "Settings" }
            : null;
  const [preview, setPreview] = usePersistedState(portal.code, "preview", initialPreview(), isPreview);

  return (
    <div className={`app-shell view-${preview}`}>
      <aside className="desktop-nav">
        <div className="desktop-brand">
          <div className="brand-mark">C</div>
          <div>
            <strong>CAGRMEISTER</strong>
            <span>PORTFOLIO</span>
          </div>
        </div>
        <nav>
          {PRIMARY.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? "active" : "")}>
              <item.icon />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <NavLink to="/more" className={more ? "active" : ""}>
            <MoreIcon />
            <span>More</span>
          </NavLink>
        </nav>
        <div className="nav-footer">
          <span>Secure client portal</span>
          <small>Saved on this device</small>
        </div>
      </aside>
      <main>
        <div className="device-bar" aria-label="Preview layout">
          <span>Preview</span>
          <div>
            {PREVIEW.map((item) => (
              <button key={item.id} type="button" className={preview === item.id ? "active" : ""} onClick={() => setPreview(item.id)}>
                <item.icon />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
        {portal.offline ? <p className="offline-banner">You're offline. Your last synced portfolio is available.</p> : null}
        <header className="top-header">
          <div className="header-left">
            {backHeader ? (
              <>
                <Link className="icon-button" to={backHeader.to} aria-label="Go back">
                  <BackIcon />
                </Link>
                <span className="plain-title">{backHeader.title}</span>
              </>
            ) : (
              <>
                <div className="brand-mark" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</div>
                <button type="button" className="context-title" onClick={() => portal.setContextOpen(true)}>
                  <span>{name}</span>
                  <Caret />
                  <small>{subtitle}</small>
                </button>
              </>
            )}
          </div>
          <button type="button" className={portal.status === "syncing" ? "sync-pill is-syncing" : "sync-pill"} onClick={portal.syncNow}>
            <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 7h-5V2" />
              <path d="M20 7a8 8 0 1 0 1 7" />
            </svg>
            <span>{statusCopy(portal.status, portal.lastSync)}</span>
          </button>
        </header>
        <div className="screen">
          <Outlet />
        </div>
      </main>
      <nav className="bottom-nav" aria-label="Primary">
        {PRIMARY.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? "active" : "")}>
            <item.icon />
            <span>{item.label}</span>
          </NavLink>
        ))}
        <NavLink to="/more" className={more ? "active" : ""}>
          <MoreIcon />
          <span>More</span>
        </NavLink>
      </nav>
      {portal.contextOpen ? (
        <Sheet title="View" onClose={() => portal.setContextOpen(false)}>
          <ContextList
            bookId={portal.bookId}
            current={portal.context}
            onBook={(id) => {
              portal.setBook(id);
              portal.setContextOpen(false);
            }}
            onPick={(id) => {
              portal.setContext(id);
              portal.setContextOpen(false);
            }}
          />
        </Sheet>
      ) : null}
    </div>
  );
}

function ContextList({
  bookId,
  current,
  onBook,
  onPick,
}: {
  bookId: BookId;
  current: ContextId;
  onBook: (id: BookId) => void;
  onPick: (id: ContextId) => void;
}) {
  const book = bookById(bookId);
  return (
    <div>
      {BOOKS.map((item) => {
        const sum = totals(positionsFor(item.id, "family"));
        const on = item.id === bookId && current === "family";
        return (
          <button key={item.id} type="button" className={on ? "context-option selected" : "context-option"} onClick={() => onBook(item.id)}>
            <div className="member-avatar">{item.name.slice(0, 1)}</div>
            <div>
              <strong>{item.name}</strong>
              <span>{item.kind === "single" ? "Full portfolio" : "Whole family"}</span>
            </div>
            <div><b><Money value={sum.value} /></b></div>
          </button>
        );
      })}
      {bookGroups(book).map((group) => {
        const sum = totals(positionsFor(bookId, `g:${group.id}`));
        const id = `g:${group.id}`;
        return (
          <button key={id} type="button" className={current === id ? "context-option selected" : "context-option"} onClick={() => onPick(id)}>
            <div className="member-avatar">{group.name.slice(0, 1)}</div>
            <div>
              <strong>{group.name}</strong>
              <span>Family group</span>
            </div>
            <div><b><Money value={sum.value} /></b></div>
          </button>
        );
      })}
      {book.members.length > 1
        ? book.members.map((member) => {
            const sum = totals(positionsFor(bookId, member.id));
            return (
              <button key={member.id} type="button" className={current === member.id ? "context-option selected" : "context-option"} onClick={() => onPick(member.id)}>
                <div className="member-avatar">{member.name.slice(0, 1)}</div>
                <div>
                  <strong>{member.name}</strong>
                  <span>{book.name}</span>
                </div>
                <div><b><Money value={sum.value} /></b></div>
              </button>
            );
          })
        : null}
    </div>
  );
}

function statusCopy(status: string, lastSync: string) {
  if (status === "syncing") return "Syncing";
  if (status === "failed") return "Sync failed";
  if (status === "offline") return "Offline";
  const time = lastSync.split(",").pop()?.trim();
  return time ? `Updated ${time}` : "Updated";
}

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3 10 9-7 9 7v10H3z" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}
function BriefcaseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 19V5M4 19h16" />
      <path d="m7 15 4-5 3 3 5-7" />
    </svg>
  );
}
function SwapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7h12l-3-3M17 17H5l3 3" />
    </svg>
  );
}
function MoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </svg>
  );
}
function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
      <path d="M9 12h11" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </svg>
  );
}
function TabletIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M11 18h2" />
    </svg>
  );
}
function MonitorIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}
function Caret() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
