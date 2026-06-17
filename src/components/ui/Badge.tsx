import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

type Variant = "default" | "secondary" | "outline" | "amber";

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

const variantStyles: Record<Variant, string> = {
  default: "bg-forest-700 text-white",
  secondary: "bg-forest-100 text-forest-800",
  outline:
    "border border-forest-300 text-forest-700 bg-white",
  amber: "bg-amber-500 text-forest-950",
};

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
