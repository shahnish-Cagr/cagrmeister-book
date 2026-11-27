import { useLayoutEffect, useRef } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router";
import logo from "@cagrmeister/design/logo.png";
import { PortalProvider, usePortal } from "./state";
import { Login } from "./screens/Login";
import { Shell } from "./shell";
import { Overview } from "./screens/Overview";
import { Holdings } from "./screens/Holdings";
import { Holding } from "./screens/Holding";
import { Performance } from "./screens/Performance";
import { Allocation } from "./screens/Allocation";
import { Transactions } from "./screens/Transactions";
import { Transaction } from "./screens/Transaction";
import { Family } from "./screens/Family";
import { Reports } from "./screens/Reports";
import { Settings } from "./screens/Settings";
import { More } from "./screens/More";

function Restore() {
  return (
    <main className="gate restore" aria-busy="true" aria-live="polite">
      <img src={logo} alt="" className="mark" />
      <p>Opening your book</p>
    </main>
  );
}

function LoginHistory() {
  const { code, booting } = usePortal();
  const location = useLocation();
  const navigate = useNavigate();
  const signedIn = useRef(false);
  const trap = useRef(false);
  const skip = useRef(false);

  useLayoutEffect(() => {
    if (booting) return;
    if (code) {
      signedIn.current = true;
      trap.current = false;
      skip.current = false;
      return;
    }
    if (signedIn.current) {
      trap.current = true;
      signedIn.current = false;
    }
    if (location.pathname !== "/") {
      trap.current = true;
      navigate("/", { replace: true });
      return;
    }
    if (!trap.current || skip.current) {
      skip.current = false;
      return;
    }
    skip.current = true;
    navigate("/");
  }, [booting, code, location.key, location.pathname, navigate]);

  return null;
}

function Gate() {
  const portal = usePortal();
  if (!portal.code) {
    return portal.booting ? <Restore /> : <Login />;
  }
  return (
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<Overview />} />
          <Route path="/holdings" element={<Holdings />} />
          <Route path="/holdings/:id" element={<Holding />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/allocation" element={<Allocation />} />
          <Route path="/allocation/:asset" element={<Allocation />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/transactions/:id" element={<Transaction />} />
          <Route path="/family" element={<Family />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/more" element={<More />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
  );
}

export function App() {
  return (
    <PortalProvider>
      <LoginHistory />
      <Gate />
    </PortalProvider>
  );
}
