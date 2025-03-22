
export enum UserRole {
  SUPER_ADMIN = "Super Admin",
  ADMIN = "Admin",
  EMPLOYEE = "Employee",
  CREDIT_CUSTOMER = "Credit Customer"
}

export const USER_ROLE_DESCRIPTIONS = {
  [UserRole.SUPER_ADMIN]: "Manage all fuel stations, admins, and system-wide settings",
  [UserRole.ADMIN]: "Manage a specific fuel station, employees, and finances",
  [UserRole.EMPLOYEE]: "Handle daily operations and sales at a fuel station",
  [UserRole.CREDIT_CUSTOMER]: "View invoices and consumption statistics"
};

export const SIDEBAR_ITEMS = {
  [UserRole.SUPER_ADMIN]: [
    { label: "Dashboard", path: "/dashboard", icon: "LayoutDashboard" },
    { label: "Stations", path: "/stations", icon: "Building" },
    { label: "Admins", path: "/admins", icon: "Users" },
    { label: "Reports", path: "/reports", icon: "BarChart" },
    { label: "Activity Logs", path: "/logs", icon: "HistoryIcon" },
    { label: "Settings", path: "/settings", icon: "Settings" },
  ],
  [UserRole.ADMIN]: [
    { label: "Dashboard", path: "/dashboard", icon: "LayoutDashboard" },
    { label: "Employees", path: "/employees", icon: "Users" },
    { label: "Customers", path: "/customers", icon: "User" },
    { label: "Dispensers", path: "/dispensers", icon: "Gauge" },
    { label: "Inventory", path: "/inventory", icon: "Package" },
    { label: "Finances", path: "/finances", icon: "DollarSign" },
    { label: "Reports", path: "/reports", icon: "FileText" },
    { label: "Settings", path: "/settings", icon: "Settings" },
  ],
  [UserRole.EMPLOYEE]: [
    { label: "Dashboard", path: "/dashboard", icon: "LayoutDashboard" },
    { label: "My Shifts", path: "/shifts", icon: "Clock" },
    { label: "Sales", path: "/sales", icon: "ShoppingCart" },
    { label: "My Profile", path: "/profile", icon: "User" },
  ],
  [UserRole.CREDIT_CUSTOMER]: [
    { label: "Dashboard", path: "/dashboard", icon: "LayoutDashboard" },
    { label: "Invoices", path: "/invoices", icon: "FileText" },
    { label: "Vehicles", path: "/vehicles", icon: "Car" },
    { label: "My Profile", path: "/profile", icon: "User" },
  ],
};

export const FUEL_TYPES = [
  { label: "Petrol", value: "petrol", color: "text-emerald-500" },
  { label: "Diesel", value: "diesel", color: "text-amber-500" },
  { label: "Power Fuel", value: "power", color: "text-red-500" },
  { label: "Electric", value: "electric", color: "text-blue-500" },
];
