import { useState } from "react";
import { FIRM, PERIODS, VALUATION_NOTE, bookById, contextName, type PeriodId } from "../data/book";
import { Notice, Sheet } from "../components";
import { usePortal } from "../state";

const PERIOD_COPY: Record<PeriodId, string> = {
  "1m": "1 month",
  "3m": "3 months",
  "6m": "6 months",
  "1y": "1 year",
  "3y": "3 years",
  "5y": "5 years",
  all: "Since inception",
};

const NOTES = {
  currency: ["Currency", "Amounts on this book are in Indian rupees."],
  refresh: ["Data refresh", "The book updates when you sync. It does not refresh on a schedule."],
  privacy: ["Privacy policy and terms", `${FIRM} portfolio reporting. Privacy and terms for a live book will sit with the firm. This screen is a preview.`],
} as const;

type NoteId = keyof typeof NOTES;
type Panel = NoteId | "period" | "help" | null;

export function Settings() {
  const portal = usePortal();
  const book = bookById(portal.bookId);
  const name = contextName(portal.bookId, portal.context);
  const subtitle = portal.context === "family"
    ? book.kind === "single" ? "Portfolio" : "Consolidated family portfolio"
    : portal.context.startsWith("g:") ? "Family group" : book.name;
  const [panel, setPanel] = useState<Panel>(null);
  const [confirm, setConfirm] = useState(false);
  const note = panel && panel in NOTES ? NOTES[panel as NoteId] : null;

  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">Your account</p>
        <h1>Settings</h1>
        <p>Preferences, data and support</p>
      </header>
      <section className="profile-card">
        <div className="profile-avatar" aria-hidden="true">{initials(name)}</div>
        <div>
          <strong>{name}</strong>
          <span>{subtitle}</span>
          <small>Password <span className="num">••••••••</span></small>
        </div>
      </section>

      <section className="settings-group">
        <h2 className="settings-title"><GearIcon /> Preferences</h2>
        <div className="setting-row">
          <span>
            <b>Hide portfolio values</b>
            <small>Mask monetary values across the app</small>
          </span>
          <button
            type="button"
            className={portal.hidden ? "switch on" : "switch"}
            aria-pressed={portal.hidden}
            aria-label="Hide portfolio values"
            onClick={() => portal.setHidden(!portal.hidden)}
          >
            <i />
          </button>
        </div>
        <button type="button" className="setting-row" onClick={() => setPanel("currency")}>
          <span><b>Currency</b></span>
          <em>INR (₹)</em>
          <Caret />
        </button>
        <button type="button" className="setting-row" onClick={() => setPanel("period")}>
          <span><b>Default performance period</b></span>
          <em>{PERIOD_COPY[portal.period]}</em>
          <Caret />
        </button>
      </section>

      <section className="settings-group">
        <h2 className="settings-title"><RefreshIcon /> App & data</h2>
        <div className="setting-row">
          <span>
            <b>Simulate offline mode</b>
            <small>View your cached portfolio experience</small>
          </span>
          <button
            type="button"
            className={portal.offline ? "switch on" : "switch"}
            aria-pressed={portal.offline}
            aria-label="Simulate offline mode"
            onClick={() => portal.setOffline(!portal.offline)}
          >
            <i />
          </button>
        </div>
        <button
          type="button"
          className={portal.status === "syncing" ? "setting-row is-syncing" : "setting-row"}
          onClick={portal.syncNow}
          disabled={portal.status === "syncing"}
        >
          <span>
            <b>Sync portfolio now</b>
            <small>Last synced <span className="num">{portal.lastSync || "—"}</span></small>
          </span>
          <RefreshIcon />
        </button>
        <button type="button" className="setting-row" onClick={() => setPanel("refresh")}>
          <span><b>Data refresh frequency</b></span>
          <em>On request</em>
          <Caret />
        </button>
      </section>

      <section className="settings-group">
        <h2 className="settings-title"><InfoIcon /> Support</h2>
        <a className="setting-row" href="mailto:support@cagrmeister.in">
          <span>
            <b>Contact relationship manager</b>
            <small>support@cagrmeister.in</small>
          </span>
          <Caret />
        </a>
        <button type="button" className="setting-row" onClick={() => setPanel("help")}>
          <span><b>Help & frequently asked questions</b></span>
          <Caret />
        </button>
        <button type="button" className="setting-row" onClick={() => setPanel("privacy")}>
          <span><b>Privacy policy & terms</b></span>
          <Caret />
        </button>
        <button type="button" className="setting-row sign-out-row" onClick={() => setConfirm(true)}>
          <span><b>Sign out</b></span>
        </button>
      </section>

      <div className="company-footer">
        <div className="brand-mark">C</div>
        <strong>{FIRM}</strong>
        <span>Reporting with clarity · Preview</span>
      </div>

      {panel === "period" ? (
        <Sheet title="Default performance period" onClose={() => setPanel(null)}>
          <div className="choices">
            {PERIODS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={item.id === portal.period ? "choice on" : "choice"}
                onClick={() => {
                  portal.setPeriod(item.id);
                  setPanel(null);
                }}
              >
                {PERIOD_COPY[item.id]}
              </button>
            ))}
          </div>
        </Sheet>
      ) : null}
      {panel === "help" ? (
        <Sheet title="Help" onClose={() => setPanel(null)}>
          <p>The date in the header is the version time of the book saved on this device. When that version matches, the saved book opens. A newer version replaces it.</p>
          <p>{VALUATION_NOTE} Where a market price is available, value is price times quantity and unrealised gain is that value minus cost. XIRR uses the same cash flows as the benchmark comparison. Realised gain is sale proceeds minus the average cost of the shares sold.</p>
          <button type="button" className="primary" onClick={() => setPanel(null)}>Done</button>
        </Sheet>
      ) : null}
      {note ? <Notice title={note[0]} body={note[1]} onClose={() => setPanel(null)} /> : null}
      {confirm ? (
        <div className="confirm-back" onClick={() => setConfirm(false)}>
          <div className="confirm" role="dialog" aria-modal="true" aria-labelledby="sign-out-title" onClick={(event) => event.stopPropagation()}>
            <h2 id="sign-out-title">Sign out?</h2>
            <p>Your password will be needed to open this book again.</p>
            <div className="button-row">
              <button type="button" onClick={() => setConfirm(false)}>Stay</button>
              <button type="button" className="sign-out" onClick={portal.signOut}>Sign out</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A8 8 0 0 0 15 6l-.3-2.5h-4L10.4 6a8 8 0 0 0-1.6.9l-2.3-1-2 3.5L6.6 11a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 1.5.9l.3 2.5h4l.3-2.5a8 8 0 0 0 1.6-.9l2.3 1 2-3.5-2.1-1.5a7 7 0 0 0 .1-1z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 7h-5V2" />
      <path d="M20 7a8 8 0 1 0 1 7" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.8 9a2.5 2.5 0 0 1 4.8 1c0 2-2.6 2-2.6 4M12 18h.01" />
    </svg>
  );
}

function Caret() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
