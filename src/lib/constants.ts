
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
  { label: "AdBlue", value: "adblue", color: "text-blue-300" },
  { label: "LPG", value: "lpg", color: "text-purple-500" },
];

export const PRODUCT_CATEGORIES = [
  { label: "Lubricants", value: "lubricants" },
  { label: "Vehicle Care", value: "vehicle_care" },
  { label: "Spare Parts", value: "spare_parts" },
  { label: "Accessories", value: "accessories" },
  { label: "Snacks", value: "snacks" },
  { label: "Beverages", value: "beverages" },
  { label: "Tobacco", value: "tobacco" },
  { label: "Other", value: "other" }
];

export const EXPENSE_TYPES = [
  { label: "Utilities", value: "utilities" },
  { label: "Maintenance", value: "maintenance" },
  { label: "Salaries", value: "salaries" },
  { label: "Rent", value: "rent" },
  { label: "Supplies", value: "supplies" },
  { label: "Fuel Purchase", value: "fuel_purchase" },
  { label: "Product Purchase", value: "product_purchase" },
  { label: "Taxes", value: "taxes" },
  { label: "Insurance", value: "insurance" },
  { label: "Marketing", value: "marketing" },
  { label: "Bank Deposit", value: "bank_deposit" },
  { label: "Other", value: "other" }
];

export const PAYMENT_METHODS = [
  { label: "Cash", value: "cash" },
  { label: "Credit Card", value: "credit_card" },
  { label: "Debit Card", value: "debit_card" },
  { label: "Mobile Payment", value: "mobile_payment" },
  { label: "Credit Account", value: "credit" },
  { label: "Check", value: "check" }
];

export const TRANSACTION_TYPES = [
  { label: "Sale", value: "sale" },
  { label: "Refund", value: "refund" },
  { label: "Credit", value: "credit" }
];
