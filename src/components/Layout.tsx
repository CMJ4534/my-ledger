// src/components/Layout.tsx
import { Link, Outlet } from "react-router-dom";
import { NavLink } from "react-router-dom";


export default function Layout() {
  return (
    <div>
      <header style={{ padding: 16, borderBottom: "1px solid #eee" }}>
<nav className="page-tabs">
  <NavLink
    to="/"
    end
    className={({ isActive }) =>
      "page-tab" + (isActive ? " page-tab-active" : "")
    }
  >
    통계
  </NavLink>

  <NavLink
    to="/calendar"
    className={({ isActive }) =>
      "page-tab" + (isActive ? " page-tab-active" : "")
    }
  >
    캘린더
  </NavLink>
</nav>
      </header>

      <main style={{ padding: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}
