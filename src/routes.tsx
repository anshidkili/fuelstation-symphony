
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
import ProductsPage from "@/pages/inventory/ProductsPage";
import ProductForm from "@/pages/inventory/ProductForm";
import ShiftsPage from "@/pages/shifts/ShiftsPage";
import ShiftForm from "@/pages/shifts/ShiftForm";
import MeterReadingsForm from "@/pages/shifts/MeterReadingsForm";
import TransactionsPage from "@/pages/transactions/TransactionsPage";
import TransactionForm from "@/pages/transactions/TransactionForm";
import SalesMismatchesPage from "@/pages/reports/SalesMismatchesPage";
import SalesMismatchDetailPage from "@/pages/reports/SalesMismatchDetailPage";
import ExpensesPage from "@/pages/expenses/ExpensesPage";
import ExpenseForm from "@/pages/expenses/ExpenseForm";
import FinancialReportsPage from "@/pages/reports/FinancialReportsPage";
import FinancialReportDetailPage from "@/pages/reports/FinancialReportDetailPage";
import StationComparisonsPage from "@/pages/reports/StationComparisonsPage";
import InvoicesPage from "@/pages/invoices/InvoicesPage";
import InvoiceForm from "@/pages/invoices/InvoiceForm";
import InvoiceDetailPage from "@/pages/invoices/InvoiceDetailPage";
import CustomersPage from "@/pages/customers/CustomersPage";
import CustomerForm from "@/pages/customers/CustomerForm";
import CustomerDashboardPage from "@/pages/customer-dashboard/CustomerDashboardPage";
import VehiclesPage from "@/pages/vehicles/VehiclesPage";
import VehicleForm from "@/pages/vehicles/VehicleForm";
import VehicleDetailPage from "@/pages/vehicles/VehicleDetailPage";
import ActivityLogPage from "@/pages/admin/ActivityLogPage";
import EmployeeSalaryPage from "@/pages/employees/EmployeeSalaryPage";
import PaymentRemindersPage from "@/pages/invoices/PaymentRemindersPage";

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
      {
        path: "/analytics",
        element: <StationComparisonsPage />,
      },
      {
        path: "/activity-log",
        element: <ActivityLogPage />,
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
        path: "/employees/salary/:id",
        element: <EmployeeSalaryPage />,
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
      {
        path: "/inventory/products",
        element: <ProductsPage />,
      },
      {
        path: "/inventory/products/:id",
        element: <ProductForm />,
      },
      {
        path: "/inventory/products/new",
        element: <ProductForm />,
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
      // Transaction routes
      {
        path: "/transactions",
        element: <TransactionsPage />,
      },
      {
        path: "/transactions/new",
        element: <TransactionForm />,
      },
      {
        path: "/sales-mismatches",
        element: <SalesMismatchesPage />,
      },
      {
        path: "/sales-mismatches/:id",
        element: <SalesMismatchDetailPage />,
      },
      // Customer management
      {
        path: "/customers",
        element: <CustomersPage />,
      },
      {
        path: "/customers/:id",
        element: <CustomerForm />,
      },
      {
        path: "/customers/new",
        element: <CustomerForm />,
      },
      // Vehicles routes
      {
        path: "/vehicles",
        element: <VehiclesPage />,
      },
      {
        path: "/vehicles/:id",
        element: <VehicleForm />,
      },
      {
        path: "/vehicles/new",
        element: <VehicleForm />,
      },
      {
        path: "/vehicles/details/:id",
        element: <VehicleDetailPage />,
      },
      // Invoice routes
      {
        path: "/invoices",
        element: <InvoicesPage />,
      },
      {
        path: "/invoices/:id",
        element: <InvoiceDetailPage />,
      },
      {
        path: "/invoices/new",
        element: <InvoiceForm />,
      },
      {
        path: "/payment-reminders",
        element: <PaymentRemindersPage />,
      },
      // Expense routes
      {
        path: "/expenses",
        element: <ExpensesPage />,
      },
      {
        path: "/expenses/:id",
        element: <ExpenseForm />,
      },
      {
        path: "/expenses/new",
        element: <ExpenseForm />,
      },
      // Report routes
      {
        path: "/reports",
        element: <FinancialReportsPage />,
      },
      {
        path: "/reports/:id",
        element: <FinancialReportDetailPage />,
      },
      // Credit customer dashboard
      {
        path: "/customer-dashboard",
        element: <CustomerDashboardPage />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
