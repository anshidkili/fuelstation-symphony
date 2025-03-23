
import { createBrowserRouter } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import NotFound from "@/pages/NotFound";
import StationsPage from "@/pages/stations/StationsPage";
import StationForm from "@/pages/stations/StationForm";
import AdminsPage from "@/pages/admins/AdminsPage";
import AdminForm from "@/pages/admins/AdminForm";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <DashboardPage />,
      },
      {
        path: "/stations",
        element: <StationsPage />,
      },
      {
        path: "/stations/:id",
        element: <StationForm />,
      },
      {
        path: "/stations/new",
        element: <StationForm />,
      },
      {
        path: "/admins",
        element: <AdminsPage />,
      },
      {
        path: "/admins/:id",
        element: <AdminForm />,
      },
      {
        path: "/admins/new",
        element: <AdminForm />,
      },
      // Add more routes as needed
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
