
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { SIDEBAR_ITEMS } from "@/lib/constants";
import * as LucideIcons from "lucide-react";

type IconName = keyof typeof LucideIcons;

interface SidebarProps {
  isOpen: boolean;
  className?: string;
}

export function Sidebar({ isOpen, className }: SidebarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const items = SIDEBAR_ITEMS[user.role] || [];

  // Render the icon using the icon name from constants
  const renderIcon = (iconName: string) => {
    // Make sure the icon exists in Lucide before trying to render it
    if (iconName in LucideIcons) {
      const IconComponent = LucideIcons[iconName as IconName];
      return <IconComponent className="h-5 w-5" />;
    }
    return null;
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-20 flex h-full w-64 flex-col border-r bg-sidebar transition-all duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "md:relative md:translate-x-0",
        className
      )}
    >
      <div className="flex h-16 items-center border-b px-6">
        <div className="font-display text-xl font-bold tracking-tight">
          Fuel Symphony
        </div>
      </div>

      <div className="flex-1 overflow-auto py-4 px-3">
        <div className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Menu
        </div>
        <nav className="space-y-1">
          {items.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                variant="ghost"
                className={cn(
                  "w-full justify-start px-3 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
                onClick={() => navigate(item.path)}
              >
                {renderIcon(item.icon)}
                <span className="ml-3">{item.label}</span>
              </Button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-border p-4">
        <div className="text-xs text-muted-foreground">
          <div className="mb-1 font-medium text-foreground">{user.role}</div>
          {user.station_name && (
            <div className="mb-2">{user.station_name}</div>
          )}
          <div>© {new Date().getFullYear()} Fuel Symphony</div>
        </div>
      </div>
    </aside>
  );
}
