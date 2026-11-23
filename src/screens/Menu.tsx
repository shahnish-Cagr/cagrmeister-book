import type { ReactNode } from "react";
import { Link, useParams } from "react-router";
import { ThemeToggle } from "@cagrmeister/design";
import { AS_OF_LABEL, FAMILY, FAMILY_GROUP } from "../book";
import { Frame } from "../frame";
import { Empty, ScreenHead } from "../ui";

const BEFORE = [
  { id: "account", label: "My Account" },
  { id: "settings", label: "Settings" },
  { id: "import", label: "Import" },
  { id: "reminders", label: "Reminders" },
  { id: "support", label: "Contact Support" },
  { id: "faqs", label: "FAQs" },
];

const AFTER = [
  { id: "review", label: "Review MProfit" },
  { id: "terms", label: "Terms of Use" },
  { id: "privacy", label: "Privacy Policy" },
];

const ITEMS = [...BEFORE, { id: "about", label: "About" }, ...AFTER];

export function Menu() {
  return (
    <Frame title="Menu">
      <nav className="sheet" aria-label="Account">
        {BEFORE.map((item) => (
          <Link key={item.id} to={`/menu/${item.id}`} className="menu-row">{item.label}</Link>
        ))}
        <p className="menu-part">About</p>
        {AFTER.map((item) => (
          <Link key={item.id} to={`/menu/${item.id}`} className="menu-row">{item.label}</Link>
        ))}
      </nav>
    </Frame>
  );
}

export function MenuPage() {
  const { page } = useParams();
  const item = ITEMS.find((row) => row.id === page);
  return (
    <>
      <ScreenHead title={item?.label ?? "Menu"} to="/menu" back="Menu" />
      {item ? PAGES[item.id] : <Empty>That page is not in the menu.</Empty>}
    </>
  );
}

function Note({ kicker, children }: { kicker?: string; children: ReactNode }) {
  return (
    <section className="prose">
      {kicker ? <h2>{kicker}</h2> : null}
      <div>{children}</div>
    </section>
  );
}

const PAGES: Record<string, ReactNode> = {
  account: (
    <dl className="brief-facts">
      <div><dt>Name</dt><dd>{FAMILY}</dd></div>
      <div><dt>Family</dt><dd>{FAMILY_GROUP}</dd></div>
      <div><dt>Portfolio</dt><dd>Monica</dd></div>
      <div><dt>Books</dt><dd>INV, F&O</dd></div>
    </dl>
  ),
  settings: (
    <Note>
      <p>Light, dark, or match this device. The choice stays in this browser.</p>
      <ThemeToggle />
      <p>Numbers use Indian grouping. Colour is reserved for a gain or a loss.</p>
    </Note>
  ),
  import: (
    <Note>
      A live book is read from registrar files. This preview does not take a file. The sample book is already loaded, as of {AS_OF_LABEL}.
    </Note>
  ),
  reminders: <Note>No reminders set.</Note>,
  support: <Note>This preview has no message desk. In the live apps, support is reached from the signed-in session.</Note>,
  faqs: (
    <>
      <Note kicker="What is unrealised?">Value minus cost. It is not cash until a sale.</Note>
      <Note kicker="Why do Family Group and Monica match?">Monica is the only portfolio in the family, so the family total is her book.</Note>
      <Note kicker="What is the weight?">A name’s value divided by its sleeve: stocks, equity funds, or debt funds. The bar on a summary is that share. It is not a chart of the market.</Note>
      <Note kicker="What is F&O?">A second book. The sample has no futures or options in it.</Note>
    </>
  ),
  about: (
    <Note>
      CAGRMEISTER Book is a reading of one family’s investments: what is held, what it cost, and what it is worth. The figures are a sample dated {AS_OF_LABEL}. Equity and debt fund names are a split of those sleeve totals, so the lists add up. This is not a live feed and not advice.
    </Note>
  ),
  review: <Note>There is no store listing for this preview.</Note>,
  terms: <Note>The sample book is for looking at the interface. It does not open an account, place an order, or show a live holding.</Note>,
  privacy: (
    <Note>
      The preview keeps two choices in this browser: which book you are reading (INV or F&O, family or Monica) and the appearance (light, dark, or system). Nothing is sent to a server.
    </Note>
  ),
};
