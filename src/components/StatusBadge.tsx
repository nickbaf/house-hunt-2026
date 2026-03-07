import { STATUS_CONFIG, type PropertyStatus } from "@/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: PropertyStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.bgColor,
        config.color,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
