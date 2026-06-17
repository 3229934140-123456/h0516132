import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  PauseCircle,
  type LucideIcon,
} from "lucide-react";
import { type HTMLAttributes } from "react";

export type StatusType =
  | "active"
  | "pending"
  | "completed"
  | "cancelled"
  | "overdue"
  | "paused";

export type StatusCategory = "contract" | "project" | "payment";

interface StatusBadgeProps extends HTMLAttributes<HTMLDivElement> {
  status: StatusType;
  category?: StatusCategory;
  showIcon?: boolean;
}

const statusConfig: Record<
  StatusType,
  { label: Record<StatusCategory, string>; className: string; icon: LucideIcon }
> = {
  active: {
    label: { contract: "执行中", project: "进行中", payment: "已付款" },
    className: "bg-forest-100 text-forest-700",
    icon: CheckCircle2,
  },
  pending: {
    label: { contract: "待签署", project: "待启动", payment: "待付款" },
    className: "bg-amber-100 text-amber-700",
    icon: Clock,
  },
  completed: {
    label: { contract: "已完成", project: "已完成", payment: "已结清" },
    className: "bg-forest-700 text-white",
    icon: CheckCircle2,
  },
  cancelled: {
    label: { contract: "已终止", project: "已取消", payment: "已取消" },
    className: "bg-gray-100 text-gray-600",
    icon: XCircle,
  },
  overdue: {
    label: { contract: "已过期", project: "已延期", payment: "已逾期" },
    className: "bg-red-100 text-red-700",
    icon: AlertTriangle,
  },
  paused: {
    label: { contract: "已暂停", project: "已暂停", payment: "已暂停" },
    className: "bg-yellow-100 text-yellow-700",
    icon: PauseCircle,
  },
};

function StatusBadge({
  status,
  category = "contract",
  showIcon = true,
  className,
  ...props
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        config.className,
        className,
      )}
      {...props}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      <span>{config.label[category]}</span>
    </div>
  );
}

export { StatusBadge };
