"use client";

import { Severity } from "@/types";
import { SEVERITY_CONFIG } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface SeveritySelectorProps {
  value?: Severity;
  onChange: (severity: Severity | undefined) => void;
}

const SEVERITIES: Severity[] = ["minor", "major", "safety", "monitor", "pest"];

export function SeveritySelector({ value, onChange }: SeveritySelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SEVERITIES.map((severity) => {
        const cfg = SEVERITY_CONFIG[severity];
        const active = value === severity;
        return (
          <button
            key={severity}
            onClick={() => onChange(active ? undefined : severity)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-semibold transition-all duration-100 border active:scale-95",
              active
                ? `${cfg.bg} ${cfg.color} ${cfg.border} shadow-sm`
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            )}
          >
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}
