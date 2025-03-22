
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/AuthContext";
import { SIDEBAR_ITEMS } from "@/lib/constants";
import { Separator } from "@/components/ui/separator";
import * as Icons from "lucide-react";
import { UserRole } from "@/lib/constants";

type IconName = keyof typeof Icons;

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const { user } = useAuth();
  const location = useLocation();
  
  if (!user) return null;

  const userRole = user.role as UserRole;
  const menuItems = SIDEBAR_ITEMS[userRole] || [];

  const renderIcon = (iconName: string) => {
    const IconComponent = Icons[iconName as IconName];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-20 flex h-full flex-col border-r bg-card/80 backdrop-blur-sm transition-transform duration-300 md:relative md:transition-none",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0", 
        "w-64 shrink-0"
      )}
    >
      <div className="border-b px-4 py-4">
        <h2 className="text-lg font-semibold tracking-tight">Fuel Symphony</h2>
        <p className="text-sm text-muted-foreground">
          {userRole === UserRole.SUPER_ADMIN 
            ? "Super Admin Console" 
            : userRole === UserRole.ADMIN 
            ? user.station_name || "Station Manager" 
            : userRole === UserRole.EMPLOYEE 
            ? "Employee Portal" 
            : "Customer Portal"}
        </p>
      </div>

      <ScrollArea className="flex-1 overflow-auto">
        <nav className="grid items-start px-2 py-4">
          {menuItems.map((item, index) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus:bg-accent",
                location.pathname === item.path ? "bg-accent text-accent-foreground" : "transparent"
              )}
            >
              {renderIcon(item.icon)}
              <span className="ml-3">{item.label}</span>
            </Link>
          ))}
        </nav>
        
        <Separator className="my-2" />
        
        <div className="px-3 py-2">
          <p className="text-xs text-muted-foreground opacity-50">
            © 2024 Fuel Symphony v1.0
          </p>
        </div>
      </ScrollArea>
    </aside>
  );
}
