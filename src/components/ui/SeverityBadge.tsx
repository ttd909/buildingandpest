import { Severity } from "@/types";
import { SEVERITY_CONFIG } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface SeverityBadgeProps {
  severity: Severity;
  size?: "sm" | "md";
  className?: string;
}

export function SeverityBadge({ severity, size = "md", className }: SeverityBadgeProps) {
  const cfg = SEVERITY_CONFIG[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold border",
        cfg.color,
        cfg.bg,
        cfg.border,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-xs",
        className
      )}
    >
      {cfg.label}
    </span>
  );
}
