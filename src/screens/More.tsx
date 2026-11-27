import { Link } from "react-router";

const LINKS = [
  { to: "/allocation", title: "Allocation", note: "Assets, sectors and concentration", icon: PieIcon },
  { to: "/family", title: "Family portfolio", note: "Members and consolidated wealth", icon: PeopleIcon },
  { to: "/reports", title: "Reports", note: "Statements and exports", icon: FileIcon },
  { to: "/settings", title: "Settings", note: "Preferences, security and support", icon: GearIcon },
];

export function More() {
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">CAGRMEISTER</p>
        <h1>More</h1>
        <p>Portfolio tools and account settings</p>
      </header>
      <div className="more-grid">
        {LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.to} to={link.to}>
              <span aria-hidden="true"><Icon /></span>
              <strong>{link.title}</strong>
              <small>{link.note}</small>
              <Caret />
            </Link>
          );
        })}
      </div>
      <section className="advisor-card">
        <div className="brand-mark">C</div>
        <div>
          <span>Relationship desk</span>
          <strong>CAGRMEISTER</strong>
          <small>support@cagrmeister.in</small>
        </div>
        <a href="mailto:support@cagrmeister.in">Contact</a>
      </section>
    </>
  );
}

function PieIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-9-9v9z" />
      <path d="M15 3.5A9 9 0 0 1 20.5 9H15z" />
    </svg>
  );
}
function PeopleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v2" />
    </svg>
  );
}
function FileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 2h9l4 4v16H6z" />
      <path d="M14 2v5h5M9 13h6M9 17h6" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A8 8 0 0 0 15 6l-.3-2.5h-4L10.4 6a8 8 0 0 0-1.6.9l-2.3-1-2 3.5L6.6 11a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 1.5.9l.3 2.5h4l.3-2.5a8 8 0 0 0 1.6-.9l2.3 1 2-3.5-2.1-1.5a7 7 0 0 0 .1-1z" />
    </svg>
  );
}
function Caret() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
