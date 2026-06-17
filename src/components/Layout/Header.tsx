import { cn } from "@/lib/utils";
import { Bell, Search } from "lucide-react";
import { type HTMLAttributes } from "react";

interface HeaderProps extends HTMLAttributes<HTMLElement> {
  title?: string;
}

function Header({ title = "仪表盘", className, ...props }: HeaderProps) {
  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between border-b border-forest-200 bg-white px-6",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-forest-900">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-forest-400" />
          <input
            type="text"
            placeholder="搜索..."
            className="w-64 rounded-lg border border-forest-200 bg-forest-50 py-2 pl-10 pr-4 text-sm text-forest-700 placeholder:text-forest-400 focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-200"
          />
        </div>

        <button className="relative flex h-10 w-10 items-center justify-center rounded-lg text-forest-500 transition-colors hover:bg-forest-100 hover:text-forest-700">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-500" />
        </button>

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-forest-500 to-forest-700">
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-white">
              管
            </div>
          </div>
          <div className="hidden flex-col sm:flex">
            <span className="text-sm font-medium text-forest-900">管理员</span>
            <span className="text-xs text-forest-500">admin@example.com</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export { Header };
