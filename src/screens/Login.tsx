import { useState, type FormEvent } from "react";
import { isPassword } from "../client/api";
import logo from "@cagrmeister/design/logo.png";
import { usePortal } from "../state";

export function Login() {
  const portal = usePortal();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(portal.gateError);
  const [busy, setBusy] = useState(false);
  const opening = portal.booting || busy;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const message = await portal.signIn(code);
    setError(message);
    setBusy(false);
  }

  return (
    <main className="gate">
      <form className="gate-card" onSubmit={(event) => void submit(event)}>
        <img src={logo} alt="CAGRMEISTER" className="mark" />
        <header className="page-head">
          <h1>Open your book</h1>
          <p>Enter the password from your adviser.</p>
        </header>
        <label className="field">
          Password
          <input
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/[^A-Za-z0-9_]/g, "").slice(0, 32))}
            type="password"
            autoComplete="current-password"
            autoFocus
            disabled={opening}
            aria-label="Password"
          />
        </label>
        {error ? <p className="gate-error">{error}</p> : null}
        <button type="submit" className="primary" disabled={opening || !isPassword(code)}>
          {opening ? "Checking version" : "Open book"}
        </button>
      </form>
    </main>
  );
}
