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
      await import("jspdf");

      // Normalise every photo to JPEG via canvas so jsPDF can embed them
      // regardless of source format (WebP, HEIC, PNG, etc.)
      const normalisedFindingsBySection: Record<ReportSection, Finding[]> =
        {} as Record<ReportSection, Finding[]>;
      for (const section of SECTION_ORDER) {
        const findings = findingsBySection[section] || [];
        normalisedFindingsBySection[section] = await Promise.all(
          findings.map(async (finding) => ({
            ...finding,
            photos: await Promise.all(
              finding.photos.map(async (photo) => {
                try {
                  return { ...photo, dataUrl: await toJpegDataUrl(photo.dataUrl) };
                } catch {
                  return photo;
                }
              })
            ),
          }))
        );
      }

      const doc = generatePdfReport(inspection, normalisedFindingsBySection, localSummary);
      doc.save(`InspectFlow_Report_${inspection.propertyAddress.replace(/[^a-z0-9]/gi, "_")}.pdf`);
      updateInspection(id, {
        status: "completed",
        reportGeneratedAt: new Date().toISOString(),
      });
      router.push(`/jobs/${id}/complete`);
    } catch (err) {
      console.error("PDF generation failed:", err);
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

// ─── Photo normalisation ──────────────────────────────────────────────────────
// jsPDF only supports JPEG and PNG. Camera photos may arrive as WebP, HEIC, or
// other formats. Convert everything to JPEG via canvas before embedding.

function toJpegDataUrl(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas unavailable"));
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error("image load failed"));
    img.src = dataUrl;
  });
}

// ─── PDF generation ───────────────────────────────────────────────────────────

const SECTION_COLORS: Record<string, [number, number, number]> = {
  major_defects: [239, 68, 68],
  safety_hazards: [245, 158, 11],
  pest_findings: [236, 72, 153],
  minor_defects: [59, 130, 246],
  maintenance_items: [99, 102, 241],
};

function generatePdfReport(
  inspection: any,
  findingsBySection: Record<ReportSection, Finding[]>,
  executiveSummary: string
): any {
  const { jsPDF } = require("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const pageW = 210;
  const pageH = 297;
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = 0;

  const addFooter = () => {
    const pageNum = doc.getCurrentPageInfo().pageNumber;
    doc.setFontSize(8);
    doc.setTextColor(180);
    doc.text(
      `${inspection.inspectorDetails?.company || "InspectFlow AI"}  ·  ${inspection.propertyAddress}`,
      margin,
      pageH - 8
    );
    doc.text(String(pageNum), pageW - margin, pageH - 8, { align: "right" });
    doc.setTextColor(0);
  };

  const addPage = () => {
    doc.addPage();
    y = 25;
    addFooter();
  };

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageH - 18) addPage();
  };

  // ── Page 1: Cover ──────────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, pageH, "F");

  // Accent bar
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, 6, pageH, "F");

  doc.setFontSize(9);
  doc.setTextColor(147, 197, 253);
  doc.text(
    `${REPORT_INSPECTION_TYPE_LABELS[inspection.inspectionType]?.toUpperCase()} INSPECTION REPORT`,
    margin + 6,
    90
  );

  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  const addressLines = doc.splitTextToSize(inspection.propertyAddress, contentW - 6);
  doc.text(addressLines, margin + 6, 102);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(148, 163, 184);
  y = 102 + addressLines.length * 11 + 10;

  const coverFields = [
    ["Client", inspection.clientName],
    ["Date", formatDate(inspection.inspectionDate)],
    ...(inspection.inspectorDetails
      ? [
          ["Inspector", inspection.inspectorDetails.name],
          ["Licence", inspection.inspectorDetails.licenceNumber || "—"],
          ["Company", inspection.inspectorDetails.company || "—"],
        ]
      : []),
  ];
  coverFields.forEach(([label, value]) => {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(label.toUpperCase(), margin + 6, y);
    doc.setFontSize(11);
    doc.setTextColor(226, 232, 240);
    doc.text(value, margin + 6, y + 5);
    y += 13;
  });

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("Prepared by InspectFlow AI", margin + 6, pageH - 14);

  // ── Page 2: Executive Summary ──────────────────────────────────────────────
  doc.addPage();
  y = 25;
  addFooter();

  // Page title bar
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y - 6, contentW, 12, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("EXECUTIVE SUMMARY", margin + 4, y + 1.5);
  doc.setFont("helvetica", "normal");
  y += 14;

  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  const summaryLines = doc.splitTextToSize(executiveSummary || "No summary available.", contentW);
  summaryLines.forEach((line: string) => {
    checkPageBreak(6);
    doc.text(line, margin, y);
    y += 5.5;
  });
  y += 6;

  // Stats grid
  const statItems = [
    { label: "Major Defects", count: findingsBySection.major_defects?.length || 0, color: SECTION_COLORS.major_defects },
    { label: "Safety Hazards", count: findingsBySection.safety_hazards?.length || 0, color: SECTION_COLORS.safety_hazards },
    { label: "Pest Findings", count: findingsBySection.pest_findings?.length || 0, color: SECTION_COLORS.pest_findings },
    { label: "Minor Defects", count: findingsBySection.minor_defects?.length || 0, color: SECTION_COLORS.minor_defects },
    { label: "Maintenance", count: findingsBySection.maintenance_items?.length || 0, color: SECTION_COLORS.maintenance_items },
  ];
  const cellW = contentW / statItems.length;
  statItems.forEach((stat, idx) => {
    const cx = margin + idx * cellW;
    const [r, g, b] = stat.color;
    doc.setFillColor(r, g, b);
    doc.roundedRect(cx, y, cellW - 3, 18, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(String(stat.count), cx + (cellW - 3) / 2, y + 10, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(stat.label, cx + (cellW - 3) / 2, y + 15.5, { align: "center" });
  });
  y += 24;

  // ── Page 3: Table of Contents ──────────────────────────────────────────────
  addPage();

  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y - 6, contentW, 12, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("TABLE OF CONTENTS", margin + 4, y + 1.5);
  doc.setFont("helvetica", "normal");
  y += 16;

  const tocSections = SECTION_ORDER.filter(
    (s) => findingsBySection[s]?.length > 0
  );
  const colW = contentW / 2;
  tocSections.forEach((section, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const cx = margin + col * colW;
    const cy = y + row * 16;
    const [r, g, b] = SECTION_COLORS[section] || [100, 100, 100];
    doc.setFillColor(r, g, b);
    doc.roundedRect(cx, cy, 8, 8, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(String(idx + 1), cx + 4, cy + 5.5, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(SECTION_CONFIG[section].label.toUpperCase(), cx + 11, cy + 5.5);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `${findingsBySection[section].length} item${findingsBySection[section].length !== 1 ? "s" : ""}`,
      cx + colW - 4,
      cy + 5.5,
      { align: "right" }
    );
  });
  y += Math.ceil(tocSections.length / 2) * 16 + 8;

  // ── Finding sections ───────────────────────────────────────────────────────
  SECTION_ORDER.forEach((section) => {
    const findings = findingsBySection[section];
    if (!findings || findings.length === 0) return;
    const cfg = SECTION_CONFIG[section];
    const [r, g, b] = SECTION_COLORS[section] || [100, 100, 100];

    // Section starts on a new page
    addPage();

    // Full-width section header
    doc.setFillColor(r, g, b);
    doc.rect(margin, y - 6, contentW, 13, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(cfg.label.toUpperCase(), margin + 5, y + 2.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      `${findings.length} item${findings.length !== 1 ? "s" : ""}`,
      margin + contentW - 5,
      y + 2.5,
      { align: "right" }
    );
    y += 16;

    findings.forEach((finding, i) => {
      checkPageBreak(24);

      const title = finding.finalTitle || finding.aiTitle || "Finding";
      const wording = finding.finalWording || finding.aiProfessionalWording || "";
      const rec = finding.finalRecommendation || finding.aiRecommendation || "";

      // Item number + title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`Item ${i + 1}`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      const titleLines = doc.splitTextToSize(title, contentW - 22);
      doc.text(titleLines, margin + 22, y);
      y += Math.max(titleLines.length * 5.5, 6);

      // Location
      if (finding.areaName) {
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 116, 139);
        doc.text("Location: ", margin, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text(finding.areaName, margin + 19, y);
        y += 5.5;
      }

      // Severity badge
      if (finding.severity) {
        const sevLabels: Record<string, string> = {
          major: "Major",
          minor: "Minor",
          safety: "Safety Hazard",
          monitor: "Monitor",
          pest: "Pest",
        };
        const sevColors: Record<string, [number, number, number]> = {
          major: [239, 68, 68],
          minor: [59, 130, 246],
          safety: [245, 158, 11],
          monitor: [107, 114, 128],
          pest: [236, 72, 153],
        };
        const [sr, sg, sb] = sevColors[finding.severity] || [100, 100, 100];
        const sevLabel = sevLabels[finding.severity] || finding.severity;
        const badgeW = doc.getTextWidth(sevLabel) + 6;
        doc.setFillColor(sr, sg, sb);
        doc.roundedRect(margin, y, badgeW, 5.5, 1, 1, "F");
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.text(sevLabel, margin + 3, y + 3.8);
        doc.setFont("helvetica", "normal");
        y += 8;
      }

      // Description / wording
      if (wording) {
        checkPageBreak(10);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 116, 139);
        doc.text("Overall Condition:", margin, y);
        doc.setFont("helvetica", "normal");
        y += 5;
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);
        const wordingLines = doc.splitTextToSize(wording, contentW);
        wordingLines.forEach((line: string) => {
          checkPageBreak(5.5);
          doc.text(line, margin, y);
          y += 5.5;
        });
        y += 2;
      }

      // Recommendation
      if (rec) {
        checkPageBreak(14);
        doc.setFillColor(239, 246, 255);
        const recLines = doc.splitTextToSize(rec, contentW - 12);
        const recBoxH = recLines.length * 5 + 10;
        doc.roundedRect(margin, y, contentW, recBoxH, 2, 2, "F");
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(r, g, b);
        doc.text("Recommendation", margin + 4, y + 6);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(9);
        recLines.forEach((line: string, li: number) => {
          doc.text(line, margin + 4, y + 6 + (li + 1) * 5);
        });
        y += recBoxH + 4;
      }

      // Estimated cost
      if (finding.estimatedCost) {
        checkPageBreak(7);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 116, 139);
        doc.text("Estimated cost: ", margin, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 41, 59);
        doc.text(finding.estimatedCost, margin + 31, y);
        y += 6;
      }

      // Photos — 2 per row, below all text
      if (finding.photos && finding.photos.length > 0) {
        const imgW = (contentW - 4) / 2;
        const imgH = Math.round(imgW * 0.65);
        const imgGap = 4;
        for (let pi = 0; pi < finding.photos.length; pi += 2) {
          checkPageBreak(imgH + imgGap);
          try {
            const p1 = finding.photos[pi];
            const fmt1 = p1.dataUrl.includes("image/png") ? "PNG" : "JPEG";
            doc.addImage(p1.dataUrl, fmt1, margin, y, imgW, imgH);
            const p2 = finding.photos[pi + 1];
            if (p2) {
              const fmt2 = p2.dataUrl.includes("image/png") ? "PNG" : "JPEG";
              doc.addImage(p2.dataUrl, fmt2, margin + imgW + imgGap, y, imgW, imgH);
            }
            y += imgH + imgGap;
          } catch {
            // skip unreadable image
          }
        }
      }

      // Divider between findings
      if (i < findings.length - 1) {
        checkPageBreak(8);
        y += 2;
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(margin, y, margin + contentW, y);
        y += 6;
      } else {
        y += 6;
      }
    });
  });

  // ── Disclaimer & Inspector details ─────────────────────────────────────────
  addPage();

  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y - 6, contentW, 12, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("LIMITATIONS & DISCLAIMER", margin + 4, y + 1.5);
  doc.setFont("helvetica", "normal");
  y += 14;

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const fullDisclaimer =
    "This report was prepared in accordance with Australian Standard AS 4349.1 (Building Inspections) and/or AS 4349.3 (Timber Pest Inspections) as applicable. The inspection is a visual assessment only and does not include invasive, destructive, or exhaustive testing. The inspector is not responsible for defects not visible at the time of inspection. This report should be read in full prior to any property transaction proceeding.";
  const dLines = doc.splitTextToSize(fullDisclaimer, contentW);
  dLines.forEach((line: string) => {
    checkPageBreak(5.5);
    doc.text(line, margin, y);
    y += 5.5;
  });
  y += 8;

  if (inspection.inspectorDetails) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentW, 42, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("INSPECTOR DETAILS", margin + 5, y + 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const fields = [
      ["Name", inspection.inspectorDetails.name],
      ["Company", inspection.inspectorDetails.company],
      ["Licence", inspection.inspectorDetails.licenceNumber],
      ["Phone", inspection.inspectorDetails.phone],
      ["Email", inspection.inspectorDetails.email],
    ].filter(([, v]) => v);
    const colHalf = contentW / 2;
    fields.forEach(([label, value], fi) => {
      const col = fi % 2;
      const row = Math.floor(fi / 2);
      const fx = margin + 5 + col * colHalf;
      const fy = y + 14 + row * 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(label!.toUpperCase(), fx, fy);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(value!, fx, fy + 4.5);
    });
    y += 50;

    // Signature line
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + 70, y);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Signature — ${inspection.inspectorDetails.name}`, margin, y + 4.5);
  }

  return doc;
}

const REPORT_INSPECTION_TYPE_LABELS: Record<string, string> = {
  building: "Building",
  pest: "Pest",
  combined: "Combined",
};
