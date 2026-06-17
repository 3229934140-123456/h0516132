import { cn } from "@/lib/utils";
import { useState, type HTMLAttributes } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface LayoutProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
}

const pageTitleMap: Record<string, string> = {
  "/": "仪表盘",
  "/contracts": "合同管理",
  "/contracts/new": "新建合同",
  "/projects": "项目管理",
  "/clients": "客户管理",
  "/payments": "收款追踪",
  "/statistics": "收入统计",
};

function Layout({ className, ...props }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  let title = pageTitleMap[location.pathname];
  if (!title) {
    if (location.pathname.startsWith("/contracts/")) title = "合同详情";
    else if (location.pathname.startsWith("/projects/")) title = "项目详情";
    else if (location.pathname.startsWith("/clients/")) title = "客户详情";
    else title = "工作台";
  }

  return (
    <div className={cn("flex h-screen w-full bg-warm-white", className)} {...props}>
      <Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export { Layout };
export { Sidebar } from "./Sidebar";
export { Header } from "./Header";
export default Layout;
