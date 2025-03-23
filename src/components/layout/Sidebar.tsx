
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
  Car
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Sidebar = ({ isOpen = true }: { isOpen?: boolean }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const renderNavItems = () => {
    if (!user) return null;

    // Common items for all roles
    const navItems = [
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
          icon: <Clock size={20} />,
        }
      );
    } else if (user.role === 'Admin') {
      navItems.push(
        {
          path: '/employees',
          label: 'Employees',
          icon: <Users size={20} />,
        },
        {
          path: '/dispensers',
          label: 'Dispensers',
          icon: <Fuel size={20} />,
        },
        {
          path: '/inventory',
          label: 'Inventory',
          icon: <Warehouse size={20} />,
        },
        {
          path: '/products',
          label: 'Products',
          icon: <Package size={20} />,
        },
        {
          path: '/shifts',
          label: 'Shifts',
          icon: <Clock size={20} />,
        },
        {
          path: '/transactions',
          label: 'Transactions',
          icon: <ShoppingCart size={20} />,
        },
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
          path: '/expenses',
          label: 'Expenses',
          icon: <DollarSign size={20} />,
        },
        {
          path: '/reports',
          label: 'Reports',
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
        }
      );
    } else if (user.role === 'Credit Customer') {
      navItems.push(
        {
          path: '/invoices',
          label: 'Invoices',
          icon: <FileText size={20} />,
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
      <Link
        key={item.path}
        to={item.path}
        className={`flex items-center gap-2 p-2 rounded-md text-sm ${
          isActive(item.path)
            ? 'bg-primary text-primary-foreground font-medium'
            : 'text-muted-foreground hover:bg-muted'
        }`}
      >
        {item.icon}
        <span>{item.label}</span>
      </Link>
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
          className="flex items-center gap-2 p-2 rounded-md text-sm text-red-500 hover:bg-red-50 w-full"
        >
          <LogOut size={20} />
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

