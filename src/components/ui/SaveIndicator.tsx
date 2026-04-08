"use client";

import { useInspectionStore } from "@/lib/store/useInspectionStore";
import { Check, CloudOff, Loader2 } from "lucide-react";

export function SaveIndicator() {
  const saveStatus = useInspectionStore((s) => s.saveStatus);

  if (saveStatus.status === "idle") return null;

  return (
    <div className="flex items-center gap-1.5 text-xs">
      {saveStatus.status === "saving" && (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
          <span className="text-slate-400">Saving…</span>
        </>
      )}
      {saveStatus.status === "saved" && (
        <>
          <Check className="w-3 h-3 text-green-500" />
          <span className="text-green-600">Saved</span>
        </>
      )}
      {saveStatus.status === "error" && (
        <>
          <CloudOff className="w-3 h-3 text-red-500" />
          <span className="text-red-500">Save failed</span>
        </>
      )}
    </div>
  );
}
