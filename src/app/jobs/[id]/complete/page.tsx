"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Download,
  Mail,
  Share2,
  ArrowLeft,
  FileText,
  LayoutGrid,
} from "lucide-react";
import { useInspectionStore } from "@/lib/store/useInspectionStore";
import { Button } from "@/components/ui/Button";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function CompletedReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { getInspection, initialize, initialized } = useInspectionStore();

  useEffect(() => {
    if (!initialized) initialize();
  }, [initialized, initialize]);

  const inspection = getInspection(id);

  if (!initialized || !inspection) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

  const totalFindings = inspection.areas.flatMap((a) => a.findings).length;
  const includedFindings = inspection.areas
    .flatMap((a) => a.findings)
    .filter((f) => !f.excludeFromReport);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Inspection Report — ${inspection.propertyAddress}`,
          text: `InspectFlow AI Inspection Report for ${inspection.propertyAddress}`,
        });
      } catch {
        // User cancelled
      }
    } else {
      // Copy placeholder link
      await navigator.clipboard.writeText(
        `inspectflow.ai/reports/${inspection.id}`
      );
      alert("Share link copied to clipboard");
    }
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(
      `Inspection Report — ${inspection.propertyAddress}`
    );
    const body = encodeURIComponent(
      `Dear ${inspection.clientName},\n\nPlease find attached your inspection report for ${inspection.propertyAddress}.\n\nThis report was prepared by ${inspection.inspectorDetails?.name || "your inspector"}.\n\nKind regards`
    );
    window.location.href = `mailto:${inspection.clientEmail || ""}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-600"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <h1 className="text-base font-bold text-slate-900">Report complete</h1>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-4">
        {/* Success banner */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-9 h-9 text-green-600" />
          </div>
          <h2 className="text-lg font-bold text-green-900 mb-1">Report generated</h2>
          <p className="text-sm text-green-700">
            {inspection.propertyAddress}
          </p>
          {inspection.reportGeneratedAt && (
            <p className="text-xs text-green-600 mt-1">
              {formatDateTime(inspection.reportGeneratedAt)}
            </p>
          )}
        </div>

        {/* Report summary */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Report summary</h3>
          <div className="space-y-2.5 text-sm">
            {[
              { label: "Property", value: inspection.propertyAddress },
              { label: "Client", value: inspection.clientName },
              { label: "Date", value: formatDate(inspection.inspectionDate) },
              { label: "Type", value: inspection.inspectionType.charAt(0).toUpperCase() + inspection.inspectionType.slice(1) },
              { label: "Findings", value: `${includedFindings.length} included (${totalFindings} total)` },
              {
                label: "Inspector",
                value: inspection.inspectorDetails?.name || "—",
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-slate-500">{label}</span>
                <span className="font-medium text-slate-900 text-right max-w-[55%] truncate">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            fullWidth
            size="xl"
            onClick={() => router.push(`/jobs/${id}/report`)}
            className="gap-2 rounded-2xl"
          >
            <Download className="w-5 h-5" />
            Download PDF report
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              fullWidth
              size="lg"
              variant="outline"
              onClick={handleEmail}
              className="gap-2 rounded-2xl"
            >
              <Mail className="w-4 h-4" />
              Email client
            </Button>
            <Button
              fullWidth
              size="lg"
              variant="outline"
              onClick={handleShare}
              className="gap-2 rounded-2xl"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>

          <Button
            fullWidth
            size="lg"
            variant="secondary"
            onClick={() => router.push(`/jobs/${id}/report`)}
            className="gap-2 rounded-2xl"
          >
            <FileText className="w-4 h-4" />
            View report preview
          </Button>

          <Button
            fullWidth
            size="lg"
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="gap-2 rounded-2xl text-slate-600"
          >
            <LayoutGrid className="w-4 h-4" />
            Back to jobs
          </Button>
        </div>
      </div>
    </div>
  );
}
