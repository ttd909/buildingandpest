"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  MapPin,
  User,
  Calendar,
  ChevronRight,
  ClipboardList,
  Filter,
} from "lucide-react";
import { useInspectionStore } from "@/lib/store/useInspectionStore";
import { Inspection, InspectionStatus } from "@/types";
import { formatDate, STATUS_CONFIG, INSPECTION_TYPE_LABELS } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PWAInstallPrompt } from "@/components/ui/PWAInstallPrompt";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: { value: InspectionStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "in_progress", label: "In progress" },
  { value: "ready_for_review", label: "Review" },
  { value: "completed", label: "Done" },
];

export default function DashboardPage() {
  const router = useRouter();
  const { inspections, initialize, initialized } = useInspectionStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InspectionStatus | "all">("all");

  useEffect(() => {
    if (!initialized) initialize();
  }, [initialized, initialize]);

  const filtered = inspections.filter((insp) => {
    const matchesSearch =
      !search ||
      insp.propertyAddress.toLowerCase().includes(search.toLowerCase()) ||
      insp.clientName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || insp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort by updatedAt desc
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-none">InspectFlow</h1>
                <p className="text-xs text-slate-400">AI</p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/jobs/new")}
              size="md"
              className="gap-1.5 rounded-xl"
            >
              <Plus className="w-4 h-4" />
              New job
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search address or client..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:bg-white transition-colors"
            />
          </div>

          {/* Status filter chips */}
          <div className="flex gap-2 mt-3 overflow-x-auto hide-scrollbar pb-0.5">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                  statusFilter === f.value
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Job list */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {!initialized && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />
            ))}
          </div>
        )}

        {initialized && sorted.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-600 font-medium">No inspections found</p>
            <p className="text-slate-400 text-sm mt-1">
              {search ? "Try a different search" : "Create your first inspection to get started"}
            </p>
            {!search && (
              <Button
                onClick={() => router.push("/jobs/new")}
                className="mt-4"
                size="md"
              >
                <Plus className="w-4 h-4" />
                New inspection
              </Button>
            )}
          </div>
        )}

        {initialized &&
          sorted.map((insp) => (
            <JobCard
              key={insp.id}
              inspection={insp}
              onClick={() => router.push(`/jobs/${insp.id}`)}
            />
          ))}
      </div>

      {/* Stats footer */}
      {initialized && inspections.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 pb-8 pt-2">
          <p className="text-xs text-slate-400 text-center">
            {inspections.length} inspection{inspections.length !== 1 ? "s" : ""} total
          </p>
        </div>
      )}

      {/* PWA install prompt */}
      <PWAInstallPrompt />
    </div>
  );
}

function JobCard({
  inspection,
  onClick,
}: {
  inspection: Inspection;
  onClick: () => void;
}) {
  const statusCfg = STATUS_CONFIG[inspection.status];
  const typeCfg = INSPECTION_TYPE_LABELS[inspection.inspectionType];
  const totalFindings = inspection.areas.reduce(
    (acc, a) => acc + a.findings.length,
    0
  );

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-4 transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                "inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold",
                statusCfg.bg,
                statusCfg.color
              )}
            >
              {statusCfg.label}
            </span>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {typeCfg}
            </span>
          </div>

          <p className="font-semibold text-slate-900 text-sm leading-snug line-clamp-1">
            {inspection.propertyAddress}
          </p>

          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {inspection.clientName}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(inspection.inspectionDate)}
            </span>
          </div>

          {totalFindings > 0 && (
            <p className="text-xs text-slate-400 mt-1.5">
              {totalFindings} finding{totalFindings !== 1 ? "s" : ""} captured
            </p>
          )}
        </div>

        <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}
