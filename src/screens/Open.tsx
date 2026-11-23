import { useNavigate } from "react-router";
import logo from "@cagrmeister/design/logo.png";
import { AS_OF_LABEL, FAMILY_GROUP } from "../book";

export function Open() {
  const navigate = useNavigate();
  return (
    <div className="open">
      <img src={logo} alt="CAGRMEISTER" className="h-8 w-auto" />
      <p className="open-kicker">Book</p>
      <p className="open-date">{AS_OF_LABEL}</p>
      <p className="open-who">{FAMILY_GROUP}</p>
      <button type="button" className="open-go" onClick={() => navigate("/book")}>Open book</button>
    </div>
  );
}
