import { useNavigate } from "react-router";
import { bookById, bookGroups, positionsFor, totals } from "../data/book";
import { Money, Percent } from "../components";
import { usePortal } from "../state";

export function Family() {
  const portal = usePortal();
  const navigate = useNavigate();
  const book = bookById(portal.bookId);
  const family = totals(positionsFor(portal.bookId, "family"));
  const members = book.members
    .map((member) => ({ ...member, ...totals(positionsFor(portal.bookId, member.id, false)) }))
    .sort((a, b) => b.value - a.value);
  const groups = bookGroups(book).map((group) => ({
    ...group,
    ...totals(positionsFor(portal.bookId, `g:${group.id}`, false)),
  }));
  const peak = Math.max(...members.map((member) => Math.abs(member.gainPct)), 0);

  function openMember(id: string) {
    portal.setContext(id);
    navigate("/");
  }

  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">Family office</p>
        <h1>{book.name}</h1>
        <p>Consolidated across <span className="num">{members.length}</span> {members.length === 1 ? "member" : "members"}</p>
      </header>
      <section className="family-hero">
        <span>Total family wealth</span>
        <strong><Money value={family.value} /></strong>
        <p className={family.gain < 0 ? "family-move down" : "family-move up"}>
          <span className="move-tag">Unrealised</span>
          <Money value={family.gain} signed />
          {" · "}
          <Percent value={family.gainPct} />
        </p>
        <p className="family-realised">
          <span>Realised</span>
          <Money value={family.realised} signed />
        </p>
        <div>
          <span>Invested capital</span>
          <Money value={family.cost} />
        </div>
      </section>
      {groups.length ? (
        <section className="section">
          <div className="section-head">
            <div>
              <p className="eyebrow">Groups</p>
              <h2>Family groups</h2>
            </div>
          </div>
          <div className="family-members">
            {groups.map((group) => {
              const share = family.value ? (group.value / family.value) * 100 : 0;
              return (
                <button key={group.id} type="button" onClick={() => openMember(`g:${group.id}`)}>
                  <span className="member-avatar">{initials(group.name)}</span>
                  <span>
                    <strong>{group.name}</strong>
                    <small><span className="num">{group.memberIds.length}</span> members</small>
                  </span>
                  <span className="member-figures">
                    <Money value={group.value} />
                    <small><span className="num">{share.toFixed(1)}%</span> of family</small>
                  </span>
                  <Caret />
                </button>
              );
            })}
          </div>
        </section>
      ) : null}
      <section className="section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Members</p>
            <h2>Family distribution</h2>
          </div>
        </div>
        <div className="family-members">
          {members.map((member) => {
            const share = family.value ? (member.value / family.value) * 100 : 0;
            return (
              <button key={member.id} type="button" onClick={() => openMember(member.id)}>
                <span className="member-avatar">{initials(member.name)}</span>
                <span>
                  <strong>{member.name}</strong>
                  <small><span className="num">{member.count}</span> holdings</small>
                </span>
                <span className="member-figures">
                  <Money value={member.value} />
                  <small><span className="num">{share.toFixed(1)}%</span> of family</small>
                </span>
                <Caret />
              </button>
            );
          })}
        </div>
      </section>
      <section className="section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Comparison</p>
            <h2>Member performance</h2>
          </div>
        </div>
        <div className="member-bars">
          {members.map((member) => (
            <div key={member.id}>
              <b>{member.name}</b>
              <i><em className={member.gainPct < 0 ? "down" : ""} style={{ width: peak ? `${(Math.abs(member.gainPct) / peak) * 100}%` : "0%" }} /></i>
              <Percent value={member.gainPct} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase();
}

function Caret() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
