// src/app/router.tsx
import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/Layout";
import Dashboard from "../pages/Dashboard";
import TransactionsPage from "../pages/TransactionsPage";
import StatsPage from "../pages/StatsPage";
import CalendarPage from "../pages/CalendarPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/stats", element: <StatsPage /> },
      { path: "calendar", element: <CalendarPage /> }, 
    ],
  },
]);


