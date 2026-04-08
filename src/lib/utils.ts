import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Severity, ReportSection, InspectionStatus, InspectionType } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; color: string; bg: string; border: string }
> = {
  minor: {
    label: "Minor",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  major: {
    label: "Major",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  safety: {
    label: "Safety",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  monitor: {
    label: "Monitor",
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
  },
  pest: {
    label: "Pest",
    color: "text-pink-700",
    bg: "bg-pink-50",
    border: "border-pink-200",
  },
};

export const STATUS_CONFIG: Record<
  InspectionStatus,
  { label: string; color: string; bg: string }
> = {
  draft: { label: "Draft", color: "text-gray-600", bg: "bg-gray-100" },
  in_progress: { label: "In Progress", color: "text-blue-700", bg: "bg-blue-100" },
  ready_for_review: { label: "Ready for Review", color: "text-amber-700", bg: "bg-amber-100" },
  completed: { label: "Completed", color: "text-green-700", bg: "bg-green-100" },
};

export const SECTION_CONFIG: Record<
  ReportSection,
  { label: string; color: string; bg: string }
> = {
  major_defects: { label: "Major Defects", color: "text-red-700", bg: "bg-red-50" },
  minor_defects: { label: "Minor Defects", color: "text-blue-700", bg: "bg-blue-50" },
  safety_hazards: { label: "Safety Hazards", color: "text-amber-700", bg: "bg-amber-50" },
  pest_findings: { label: "Pest Findings", color: "text-pink-700", bg: "bg-pink-50" },
  maintenance_items: { label: "Maintenance", color: "text-indigo-700", bg: "bg-indigo-50" },
  excluded: { label: "Excluded", color: "text-gray-500", bg: "bg-gray-50" },
};

export const INSPECTION_TYPE_LABELS: Record<InspectionType, string> = {
  building: "Building",
  pest: "Pest",
  combined: "Combined",
};

export function pluralise(count: number, word: string): string {
  return `${count} ${word}${count !== 1 ? "s" : ""}`;
}
