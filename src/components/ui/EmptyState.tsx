import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";
import { type HTMLAttributes } from "react";
import { Button } from "./Button";

interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

function EmptyState({
  title = "暂无数据",
  description = "当前没有可显示的内容。",
  icon,
  actionLabel,
  onAction,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-forest-200 bg-forest-50/50 p-10 text-center",
        className,
      )}
      {...props}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-forest-100">
        {icon ?? <Inbox className="h-8 w-8 text-forest-500" />}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-forest-900">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-forest-500">{description}</p>
      {actionLabel && onAction && (
        <Button variant="default" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export { EmptyState };
