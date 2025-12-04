// src/components/Layout.tsx
import { Link, Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div>
      <header style={{ padding: 16, borderBottom: "1px solid #eee" }}>
        <nav style={{ display: "flex", gap: 12 }}>
          <Link to="/">통계</Link>
          <Link to="/calendar">캘린더</Link>
        </nav>
      </header>

      <main style={{ padding: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}
