
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Settings, 
  Users, 
  BarChart3, 
  Store, 
  Layers, 
  Package, 
  CreditCard, 
  FileText, 
  DollarSign,
  LayoutDashboard,
  LogOut,
  HardDrive,
  Clock,
  ShoppingCart,
  Fuel,
  Warehouse,
  Car,
  Activity,
  ReceiptText,
  Bell,
  History,
  AlertTriangle,
  Gauge,
  Calculator,
  CalendarRange,
  Building2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  children?: { path: string; label: string }[];
}

const Sidebar = ({ isOpen = true }: { isOpen?: boolean }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const renderNavItems = () => {
    if (!user) return null;

    // Common items for all roles
    const navItems: NavItem[] = [
      {
        path: '/',
        label: 'Dashboard',
        icon: <LayoutDashboard size={20} />,
      },
    ];

    // Role-specific items
    if (user.role === 'Super Admin') {
      navItems.push(
        {
          path: '/stations',
          label: 'Stations',
          icon: <Store size={20} />,
        },
        {
          path: '/admins',
          label: 'Admins',
          icon: <Users size={20} />,
        },
        {
          path: '/analytics',
          label: 'Analytics',
          icon: <BarChart3 size={20} />,
        },
        {
          path: '/activity-log',
          label: 'Activity Log',
          icon: <History size={20} />,
        }
      );
    } else if (user.role === 'Admin') {
      navItems.push(
        // Staff Management
        {
          path: '/employees',
          label: 'Employees',
          icon: <Users size={20} />,
        },
        
        // Station Operations
        {
          path: '/dispensers',
          label: 'Dispensers',
          icon: <Fuel size={20} />,
        },
        {
          path: '/inventory',
          label: 'Inventory',
          icon: <Warehouse size={20} />,
          children: [
            {
              path: '/inventory/fuel',
              label: 'Fuel Inventory',
            },
            {
              path: '/inventory/products',
              label: 'Products',
            },
          ],
        },
        {
          path: '/shifts',
          label: 'Shifts',
          icon: <Clock size={20} />,
        },
        
        // Sales & Transactions
        {
          path: '/transactions',
          label: 'Transactions',
          icon: <ShoppingCart size={20} />,
        },
        {
          path: '/sales-mismatches',
          label: 'Sales Mismatches',
          icon: <AlertTriangle size={20} />,
        },
        
        // Customer Management
        {
          path: '/customers',
          label: 'Customers',
          icon: <CreditCard size={20} />,
        },
        {
          path: '/invoices',
          label: 'Invoices',
          icon: <FileText size={20} />,
        },
        {
          path: '/payment-reminders',
          label: 'Payment Reminders',
          icon: <Bell size={20} />,
        },
        
        // Financial Management
        {
          path: '/expenses',
          label: 'Expenses',
          icon: <DollarSign size={20} />,
        },
        {
          path: '/reports',
          label: 'Financial Reports',
          icon: <BarChart3 size={20} />,
        }
      );
    } else if (user.role === 'Employee') {
      navItems.push(
        {
          path: '/shifts',
          label: 'Shifts',
          icon: <Clock size={20} />,
        },
        {
          path: '/sales',
          label: 'Sales',
          icon: <ShoppingCart size={20} />,
        },
        {
          path: '/meter-readings',
          label: 'Meter Readings',
          icon: <Gauge size={20} />,
        },
        {
          path: '/sales-mismatches',
          label: 'Sales Mismatches',
          icon: <AlertTriangle size={20} />,
        }
      );
    } else if (user.role === 'Credit Customer') {
      navItems.push(
        {
          path: '/customer-dashboard',
          label: 'My Dashboard',
          icon: <LayoutDashboard size={20} />,
        },
        {
          path: '/invoices',
          label: 'Invoices',
          icon: <FileText size={20} />,
        },
        {
          path: '/payment-reminders',
          label: 'Payment Reminders',
          icon: <Bell size={20} />,
        },
        {
          path: '/vehicles',
          label: 'Vehicles',
          icon: <Car size={20} />,
        }
      );
    }

    // Settings for all roles
    navItems.push({
      path: '/settings',
      label: 'Settings',
      icon: <Settings size={20} />,
    });

    return navItems.map((item) => (
      <div key={item.path} className="mb-1">
        <Link
          to={item.path}
          className={`flex items-center gap-2 p-2 rounded-md text-sm ${
            isActive(item.path)
              ? 'bg-primary text-primary-foreground font-medium'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          {item.icon}
          <span className={isOpen ? 'block' : 'hidden md:block'}>{item.label}</span>
        </Link>
        
        {item.children && isOpen && (
          <div className="ml-8 space-y-1 mt-1">
            {item.children.map((child) => (
              <Link
                key={child.path}
                to={child.path}
                className={`flex items-center gap-2 p-2 rounded-md text-sm ${
                  isActive(child.path)
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></span>
                <span>{child.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    ));
  };

  const sidebarClasses = `h-full border-r border-border bg-card py-4 flex flex-col transition-all duration-300 ${
    isOpen ? 'w-60' : 'w-0 md:w-16 overflow-hidden'
  }`;

  return (
    <div className={sidebarClasses}>
      <div className={`px-4 mb-6 ${!isOpen && 'md:px-2'}`}>
        {isOpen ? (
          <h1 className="text-xl font-bold">Fuel Symphony</h1>
        ) : (
          <h1 className="text-xl font-bold hidden md:flex justify-center">FS</h1>
        )}
      </div>
      <div className="space-y-1 px-3 flex-1 overflow-auto">
        {renderNavItems()}
      </div>
      <div className="mt-auto pt-4 px-3 border-t border-border">
        <button
          onClick={logout}
          className="flex items-center gap-2 p-2 rounded-md text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 w-full"
        >
          <LogOut size={20} />
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
