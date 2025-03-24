
import { createBrowserRouter } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import NotFound from "@/pages/NotFound";
import StationsPage from "@/pages/stations/StationsPage";
import StationForm from "@/pages/stations/StationForm";
import AdminsPage from "@/pages/admins/AdminsPage";
import AdminForm from "@/pages/admins/AdminForm";
import EmployeesPage from "@/pages/employees/EmployeesPage";
import EmployeeForm from "@/pages/employees/EmployeeForm";
import DispenserPage from "@/pages/dispensers/DispenserPage";
import DispenserForm from "@/pages/dispensers/DispenserForm";
import FuelInventoryPage from "@/pages/inventory/FuelInventoryPage";
import FuelInventoryForm from "@/pages/inventory/FuelInventoryForm";
import ShiftsPage from "@/pages/shifts/ShiftsPage";
import ShiftForm from "@/pages/shifts/ShiftForm";
import MeterReadingsForm from "@/pages/shifts/MeterReadingsForm";

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
      // Super Admin routes
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
      // Admin routes
      {
        path: "/employees",
        element: <EmployeesPage />,
      },
      {
        path: "/employees/:id",
        element: <EmployeeForm />,
      },
      {
        path: "/employees/new",
        element: <EmployeeForm />,
      },
      {
        path: "/dispensers",
        element: <DispenserPage />,
      },
      {
        path: "/dispensers/:id",
        element: <DispenserForm />,
      },
      {
        path: "/dispensers/new",
        element: <DispenserForm />,
      },
      // Inventory routes
      {
        path: "/inventory/fuel",
        element: <FuelInventoryPage />,
      },
      {
        path: "/inventory/fuel/:id",
        element: <FuelInventoryForm />,
      },
      {
        path: "/inventory/fuel/new",
        element: <FuelInventoryForm />,
      },
      // Shift management routes
      {
        path: "/shifts",
        element: <ShiftsPage />,
      },
      {
        path: "/shifts/:id",
        element: <ShiftForm />,
      },
      {
        path: "/shifts/new",
        element: <ShiftForm />,
      },
      {
        path: "/meter-readings/:shiftId",
        element: <MeterReadingsForm />,
      },
      // Add more routes as needed
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
