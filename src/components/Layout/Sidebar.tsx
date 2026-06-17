import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  FolderKanban,
  Users,
  CreditCard,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { label: "仪表盘", href: "/dashboard", icon: LayoutDashboard },
  { label: "合同管理", href: "/contracts", icon: FileText },
  { label: "项目管理", href: "/projects", icon: FolderKanban },
  { label: "客户管理", href: "/clients", icon: Users },
  { label: "收款追踪", href: "/payments", icon: CreditCard },
  { label: "收入统计", href: "/revenue", icon: BarChart3 },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  className?: string;
}

function Sidebar({
  collapsed: externalCollapsed,
  onCollapsedChange,
  className,
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed =
    externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;

  const toggleCollapsed = () => {
    const newValue = !collapsed;
    if (onCollapsedChange) {
      onCollapsedChange(newValue);
    } else {
      setInternalCollapsed(newValue);
    }
  };

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-forest-200 bg-forest-900 text-forest-100 transition-all duration-300",
        collapsed ? "w-20" : "w-64",
        className,
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-forest-800 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-forest-950">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-base font-semibold text-white">合同管理</span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-forest-950">
            <FileText className="h-5 w-5" />
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-amber-500 text-forest-950"
                    : "text-forest-200 hover:bg-forest-800 hover:text-white",
                  collapsed && "justify-center",
                )
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-forest-800 p-3">
        <button
          onClick={toggleCollapsed}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-forest-200 transition-colors hover:bg-forest-800 hover:text-white",
            collapsed && "justify-center",
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span>收起菜单</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

export { Sidebar };
