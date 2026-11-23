import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { AppHeader, ProfileMenu } from "@cagrmeister/design";
import logo from "@cagrmeister/design/logo.png";
import { useBook } from "./scope";
import { PhoneHeader } from "./shell";

export function Frame({ title, sub, action, head, children }: { title: string; sub?: string; action?: ReactNode; head?: string; children: ReactNode }) {
  const navigate = useNavigate();
  const { reset } = useBook();
  return (
    <>
      <PhoneHeader>
        <AppHeader logoSrc={logo} showDate={false}>
          <ProfileMenu
            label="Monica"
            onLogout={() => {
              reset();
              navigate("/open");
            }}
          />
        </AppHeader>
      </PhoneHeader>
      <div className={head ? `page-title ${head}` : "page-title"}>
        <div>
          <h1>{title}</h1>
          {sub ? <p>{sub}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </>
  );
}
