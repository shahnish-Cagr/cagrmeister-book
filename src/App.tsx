import { Navigate, Route, Routes } from "react-router";
import { BookProvider } from "./scope";
import { Phone } from "./shell";
import { Open } from "./screens/Open";
import { Home } from "./screens/Home";
import { Sleeve } from "./screens/Sleeve";
import { Name } from "./screens/Name";
import { Position } from "./screens/Position";
import { Family } from "./screens/Family";
import { Search } from "./screens/Search";
import { Weights } from "./screens/Weights";
import { Ledger } from "./screens/Ledger";
import { Menu, MenuPage } from "./screens/Menu";

export function App() {
  return (
    <BookProvider>
      <Phone>
        <Routes>
          <Route path="/" element={<Navigate to="/open" replace />} />
          <Route path="/open" element={<Open />} />
          <Route path="/book" element={<Home />} />
          <Route path="/family" element={<Family />} />
          <Route path="/sleeve/:sleeveId" element={<Sleeve />} />
          <Route path="/name/:id" element={<Name />} />
          <Route path="/name/:id/summary" element={<Position mode="summary" />} />
          <Route path="/name/:id/transactions" element={<Position mode="transactions" />} />
          <Route path="/search" element={<Search />} />
          <Route path="/weights" element={<Weights />} />
          <Route path="/ledger" element={<Ledger />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/menu/:page" element={<MenuPage />} />
          <Route path="*" element={<Navigate to="/book" replace />} />
        </Routes>
      </Phone>
    </BookProvider>
  );
}
