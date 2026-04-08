"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  FileDown,
  Building2,
  User,
  Calendar,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Bug,
  Wrench,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Edit3,
  Check,
} from "lucide-react";
import { useInspectionStore } from "@/lib/store/useInspectionStore";
import { Finding, ReportSection } from "@/types";
import { generateExecutiveSummary } from "@/lib/ai/service";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { Button } from "@/components/ui/Button";
import { SECTION_CONFIG, INSPECTION_TYPE_LABELS, formatDate, cn } from "@/lib/utils";

const SECTION_ORDER: ReportSection[] = [
  "major_defects",
  "safety_hazards",
  "pest_findings",
  "minor_defects",
  "maintenance_items",
];

const SECTION_ICONS: Record<ReportSection, typeof AlertTriangle> = {
  major_defects: AlertTriangle,
  minor_defects: CheckCircle2,
  safety_hazards: ShieldAlert,
  pest_findings: Bug,
  maintenance_items: Wrench,
  excluded: CheckCircle2,
};

export default function ReportBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { getInspection, initialize, initialized, updateInspection } =
    useInspectionStore();

  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [editingSummary, setEditingSummary] = useState(false);
  const [localSummary, setLocalSummary] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    if (!initialized) initialize();
  }, [initialized, initialize]);

  const inspection = getInspection(id);

  useEffect(() => {
    if (inspection && !inspection.executiveSummary) {
      handleGenerateSummary();
    }
    if (inspection?.executiveSummary) {
      setLocalSummary(inspection.executiveSummary);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspection?.id]);

  if (!initialized || !inspection) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

  // Group findings by section
  const allFindings = inspection.areas.flatMap((a) => a.findings);
  const findingsBySection = SECTION_ORDER.reduce((acc, section) => {
    acc[section] = allFindings.filter(
      (f) => !f.excludeFromReport && f.reportSection === section
    );
    return acc;
  }, {} as Record<ReportSection, Finding[]>);

  const totalSignificant =
    (findingsBySection.major_defects?.length || 0) +
    (findingsBySection.safety_hazards?.length || 0);

  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    try {
      const summary = await generateExecutiveSummary(inspection);
      setLocalSummary(summary);
      updateInspection(id, { executiveSummary: summary });
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleSaveSummary = () => {
    updateInspection(id, { executiveSummary: localSummary });
    setEditingSummary(false);
  };

  const handleGeneratePdf = async () => {
    setGeneratingPdf(true);
    try {
      // Dynamically import jsPDF to avoid SSR issues
      const { jsPDF } = await import("jspdf");
      const doc = generatePdfReport(inspection, findingsBySection, localSummary);
      doc.save(`InspectFlow_Report_${inspection.propertyAddress.replace(/[^a-z0-9]/gi, "_")}.pdf`);
      updateInspection(id, {
        status: "completed",
        reportGeneratedAt: new Date().toISOString(),
      });
      router.push(`/jobs/${id}/complete`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      // Fallback: navigate to complete anyway
      updateInspection(id, {
        status: "completed",
        reportGeneratedAt: new Date().toISOString(),
      });
      router.push(`/jobs/${id}/complete`);
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/jobs/${id}/review`)}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-600"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-slate-900">Report builder</h1>
              <p className="text-xs text-slate-400">
                {allFindings.filter((f) => !f.excludeFromReport).length} findings included
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleGeneratePdf}
            loading={generatingPdf}
            className="gap-1 rounded-xl"
          >
            <FileDown className="w-3.5 h-3.5" />
            Generate PDF
          </Button>
        </div>
      </div>

      {/* Report preview */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          {/* Cover card */}
          <div className="bg-blue-700 text-white rounded-2xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">
                  {INSPECTION_TYPE_LABELS[inspection.inspectionType]} Inspection Report
                </p>
                <h2 className="text-xl font-bold leading-snug">
                  {inspection.propertyAddress}
                </h2>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-blue-300 text-xs mb-0.5">Client</p>
                <p className="font-semibold">{inspection.clientName}</p>
              </div>
              <div>
                <p className="text-blue-300 text-xs mb-0.5">Date</p>
                <p className="font-semibold">{formatDate(inspection.inspectionDate)}</p>
              </div>
              <div>
                <p className="text-blue-300 text-xs mb-0.5">Inspector</p>
                <p className="font-semibold">
                  {inspection.inspectorDetails?.name || "—"}
                </p>
              </div>
              <div>
                <p className="text-blue-300 text-xs mb-0.5">Licence</p>
                <p className="font-semibold">
                  {inspection.inspectorDetails?.licenceNumber || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-2">
            {[
              {
                label: "Major",
                count: findingsBySection.major_defects?.length || 0,
                color: "text-red-700",
                bg: "bg-red-50",
              },
              {
                label: "Safety",
                count: findingsBySection.safety_hazards?.length || 0,
                color: "text-amber-700",
                bg: "bg-amber-50",
              },
              {
                label: "Pest",
                count: findingsBySection.pest_findings?.length || 0,
                color: "text-pink-700",
                bg: "bg-pink-50",
              },
              {
                label: "Minor",
                count:
                  (findingsBySection.minor_defects?.length || 0) +
                  (findingsBySection.maintenance_items?.length || 0),
                color: "text-blue-700",
                bg: "bg-blue-50",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`${stat.bg} rounded-xl p-3 text-center`}
              >
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Executive summary */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Executive summary</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleGenerateSummary}
                  disabled={generatingSummary}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  {generatingSummary ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                </button>
                {!editingSummary && (
                  <button
                    onClick={() => {
                      setLocalSummary(
                        inspection.executiveSummary || localSummary
                      );
                      setEditingSummary(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
                {editingSummary && (
                  <button
                    onClick={handleSaveSummary}
                    className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {generatingSummary ? (
              <div className="flex items-center gap-2 py-4 text-slate-400">
                <Sparkles className="w-4 h-4 animate-pulse text-blue-500" />
                <span className="text-sm">AI generating summary…</span>
              </div>
            ) : editingSummary ? (
              <textarea
                value={localSummary}
                onChange={(e) => setLocalSummary(e.target.value)}
                rows={6}
                className="w-full text-sm text-slate-700 border border-blue-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-200 resize-none"
              />
            ) : (
              <p className="text-sm text-slate-700 leading-relaxed">
                {localSummary || inspection.executiveSummary || "No summary generated yet."}
              </p>
            )}
          </div>

          {/* Defect sections */}
          {SECTION_ORDER.map((section) => {
            const findings = findingsBySection[section];
            if (!findings || findings.length === 0) return null;
            const cfg = SECTION_CONFIG[section];
            const Icon = SECTION_ICONS[section];

            return (
              <div key={section} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Section header */}
                <div className={`${cfg.bg} px-4 py-3 flex items-center gap-2 border-b border-slate-100`}>
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                  <h3 className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</h3>
                  <span className={`ml-auto text-xs font-semibold ${cfg.color} opacity-70`}>
                    {findings.length} item{findings.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Findings list */}
                <div className="divide-y divide-slate-50">
                  {findings.map((finding, i) => (
                    <ReportFindingRow key={finding.id} finding={finding} index={i + 1} />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Limitations */}
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">
              Limitations & disclaimer
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              This report was prepared in accordance with Australian Standard AS 4349.1 (Building
              Inspections) and/or AS 4349.3 (Timber Pest Inspections) as applicable. The inspection
              is a visual assessment only and does not include invasive, destructive, or exhaustive
              testing. The inspector is not responsible for defects not visible at the time of
              inspection. This report should be read in full prior to any property transaction
              proceeding.
            </p>
          </div>

          {/* Company details */}
          {inspection.inspectorDetails && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Inspector details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  { label: "Name", value: inspection.inspectorDetails.name },
                  { label: "Company", value: inspection.inspectorDetails.company },
                  { label: "Licence", value: inspection.inspectorDetails.licenceNumber },
                  { label: "Phone", value: inspection.inspectorDetails.phone },
                  { label: "Email", value: inspection.inspectorDetails.email },
                ].map(({ label, value }) =>
                  value ? (
                    <div key={label}>
                      <p className="text-xs text-slate-400">{label}</p>
                      <p className="font-medium text-slate-800">{value}</p>
                    </div>
                  ) : null
                )}
              </div>

              {/* Signature placeholder */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-2">Signature</p>
                <div className="h-12 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center">
                  <span className="text-xs text-slate-400">
                    Digital signature — {inspection.inspectorDetails.name}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="pb-8" />
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-white border-t border-slate-100 safe-bottom">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <Button
            fullWidth
            size="xl"
            onClick={handleGeneratePdf}
            loading={generatingPdf}
            className="gap-2 rounded-2xl"
          >
            <FileDown className="w-5 h-5" />
            Generate & download PDF report
          </Button>
        </div>
      </div>
    </div>
  );
}

function ReportFindingRow({
  finding,
  index,
}: {
  finding: Finding;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const title = finding.finalTitle || finding.aiTitle || "Finding";
  const wording = finding.finalWording || finding.aiProfessionalWording;
  const recommendation = finding.finalRecommendation || finding.aiRecommendation;

  return (
    <div className="px-4 py-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="flex items-start gap-3">
          <span className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0 mt-0.5">
            {index}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-slate-900">{title}</p>
              {finding.severity && <SeverityBadge severity={finding.severity} size="sm" />}
            </div>
            {!expanded && wording && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{wording}</p>
            )}
          </div>
          {expanded ? (
            <span className="text-xs text-slate-400">▲</span>
          ) : (
            <span className="text-xs text-slate-400">▼</span>
          )}
        </div>
      </button>

      {expanded && (
        <div className="mt-3 ml-8 space-y-2">
          {/* Photos */}
          {finding.photos.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
              {finding.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.dataUrl} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
          {wording && (
            <p className="text-sm text-slate-700 leading-relaxed">{wording}</p>
          )}
          {recommendation && (
            <div className="p-2.5 bg-blue-50 rounded-xl">
              <p className="text-xs font-semibold text-blue-700 mb-0.5">Recommendation</p>
              <p className="text-xs text-blue-800">{recommendation}</p>
            </div>
          )}
          {finding.estimatedCost && (
            <p className="text-xs text-slate-500">
              <span className="font-semibold">Estimated cost:</span> {finding.estimatedCost}
            </p>
          )}
          {finding.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {finding.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── PDF generation ───────────────────────────────────────────────────────────

function generatePdfReport(
  inspection: any,
  findingsBySection: Record<ReportSection, Finding[]>,
  executiveSummary: string
): any {
  // Dynamic import needed — caller handles this
  // This function is called after jsPDF is imported
  const { jsPDF } = require("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const pageW = 210;
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = 0;

  const addPage = () => {
    doc.addPage();
    y = 20;
    addFooter();
  };

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > 270) addPage();
  };

  const addFooter = () => {
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `InspectFlow AI · ${inspection.companyName || ""}  ·  Page ${doc.getCurrentPageInfo().pageNumber}`,
      margin,
      290
    );
    doc.setTextColor(0);
  };

  // ── Cover page ──
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, 210, 297, "F");

  doc.setFontSize(10);
  doc.setTextColor(147, 197, 253);
  doc.text(`${REPORT_INSPECTION_TYPE_LABELS[inspection.inspectionType]?.toUpperCase()} INSPECTION REPORT`, margin, 60);

  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  const addressLines = doc.splitTextToSize(inspection.propertyAddress, contentW);
  doc.text(addressLines, margin, 75);

  doc.setFontSize(11);
  doc.setTextColor(147, 197, 253);
  y = 75 + addressLines.length * 10 + 8;
  doc.text(`Client: ${inspection.clientName}`, margin, y);
  doc.text(`Date: ${formatDate(inspection.inspectionDate)}`, margin, y + 8);
  if (inspection.inspectorDetails) {
    doc.text(`Inspector: ${inspection.inspectorDetails.name}`, margin, y + 16);
    doc.text(`Licence: ${inspection.inspectorDetails.licenceNumber || "—"}`, margin, y + 24);
  }

  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("Prepared by InspectFlow AI", margin, 280);

  // ── Page 2 — executive summary ──
  doc.addPage();
  y = 25;
  addFooter();

  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text("Executive Summary", margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  const summaryLines = doc.splitTextToSize(executiveSummary || "", contentW);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 5 + 10;

  // Summary stats table
  const stats = [
    ["Major Defects", String(findingsBySection.major_defects?.length || 0)],
    ["Safety Hazards", String(findingsBySection.safety_hazards?.length || 0)],
    ["Pest Findings", String(findingsBySection.pest_findings?.length || 0)],
    ["Minor Defects", String(findingsBySection.minor_defects?.length || 0)],
    ["Maintenance Items", String(findingsBySection.maintenance_items?.length || 0)],
  ];

  doc.setFontSize(9);
  stats.forEach(([label, count]) => {
    checkPageBreak(8);
    doc.setTextColor(71, 85, 105);
    doc.text(label, margin + 4, y);
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(count, margin + contentW - 10, y, { align: "right" });
    y += 7;
  });

  // ── Defect sections ──
  const sectionColors: Record<string, [number, number, number]> = {
    major_defects: [239, 68, 68],
    safety_hazards: [245, 158, 11],
    pest_findings: [236, 72, 153],
    minor_defects: [59, 130, 246],
    maintenance_items: [99, 102, 241],
  };

  SECTION_ORDER.forEach((section) => {
    const findings = findingsBySection[section];
    if (!findings || findings.length === 0) return;
    const cfg = SECTION_CONFIG[section];
    const [r, g, b] = sectionColors[section] || [100, 100, 100];

    checkPageBreak(20);
    y += 5;

    // Section header
    doc.setFillColor(r, g, b);
    doc.roundedRect(margin, y - 5, contentW, 10, 2, 2, "F");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(cfg.label, margin + 4, y + 1);
    y += 12;

    findings.forEach((finding, i) => {
      checkPageBreak(30);
      const title = finding.finalTitle || finding.aiTitle || "Finding";
      const wording = finding.finalWording || finding.aiProfessionalWording || "";
      const rec = finding.finalRecommendation || finding.aiRecommendation || "";

      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`${i + 1}. ${title}`, margin, y);
      y += 6;

      if (wording) {
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        const lines = doc.splitTextToSize(wording, contentW - 4);
        lines.forEach((line: string) => {
          checkPageBreak(5);
          doc.text(line, margin + 4, y);
          y += 4.5;
        });
      }

      if (rec) {
        checkPageBreak(10);
        y += 1;
        doc.setFontSize(8.5);
        doc.setTextColor(r, g, b);
        doc.text("Recommendation:", margin + 4, y);
        y += 4;
        doc.setTextColor(71, 85, 105);
        const recLines = doc.splitTextToSize(rec, contentW - 8);
        recLines.forEach((line: string) => {
          checkPageBreak(5);
          doc.text(line, margin + 8, y);
          y += 4.5;
        });
      }

      y += 4;
    });
  });

  // ── Disclaimer ──
  checkPageBreak(40);
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("Limitations & Disclaimer", margin, y);
  y += 5;
  doc.setFontSize(8);
  const disclaimer =
    "This report was prepared as a visual inspection only. It is not an exhaustive investigation and is subject to the limitations noted in the full report. This report should be read in its entirety prior to any property transaction proceeding.";
  const dLines = doc.splitTextToSize(disclaimer, contentW);
  dLines.forEach((line: string) => {
    doc.text(line, margin, y);
    y += 4;
  });

  addFooter();
  return doc;
}

const REPORT_INSPECTION_TYPE_LABELS: Record<string, string> = {
  building: "Building",
  pest: "Pest",
  combined: "Combined",
};
