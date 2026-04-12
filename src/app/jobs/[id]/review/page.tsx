"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Edit3,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Mic,
  FileText,
  Image as ImageIcon,
  SkipForward,
  FileOutput,
} from "lucide-react";
import { useInspectionStore } from "@/lib/store/useInspectionStore";
import { Finding, ReportSection, Severity, InspectionArea } from "@/types";
import { processAllFindings } from "@/lib/ai/service";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SaveIndicator } from "@/components/ui/SaveIndicator";
import { SEVERITY_CONFIG, SECTION_CONFIG, cn } from "@/lib/utils";

const REPORT_SECTIONS: ReportSection[] = [
  "major_defects",
  "minor_defects",
  "safety_hazards",
  "pest_findings",
  "maintenance_items",
  "excluded",
];

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { getInspection, initialize, initialized, updateFinding, updateInspection } =
    useInspectionStore();

  const [processing, setProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState({ done: 0, total: 0 });
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());
  const [editingFindingId, setEditingFindingId] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized) initialize();
  }, [initialized, initialize]);

  const inspection = getInspection(id);

  // Auto-process findings that haven't been processed
  useEffect(() => {
    if (!inspection) return;
    const unprocessed = inspection.areas
      .flatMap((a) => a.findings)
      .filter((f) => !f.aiProcessed);
    if (unprocessed.length > 0 && !processing) {
      handleProcessAll();
    }
    // Track already-processed
    const alreadyDone = inspection.areas
      .flatMap((a) => a.findings)
      .filter((f) => f.aiProcessed)
      .map((f) => f.id);
    setProcessedIds(new Set(alreadyDone));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspection?.id]);

  if (!initialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }
  if (!inspection) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <p className="text-slate-500 text-sm">Job not found.</p>
        <button onClick={() => router.push("/dashboard")} className="text-blue-600 text-sm font-medium">Back to dashboard</button>
      </div>
    );
  }

  const allFindings = inspection.areas.flatMap((a) => a.findings);

  const handleProcessAll = async () => {
    setProcessing(true);
    setProcessProgress({ done: 0, total: allFindings.length });

    try {
      const results = await processAllFindings(inspection, (done, total) => {
        setProcessProgress({ done, total });
      });

      // Update each finding in store
      for (const result of results) {
        const area = inspection.areas.find((a) =>
          a.findings.some((f) => f.id === result.id)
        );
        if (area) {
          updateFinding(id, area.id, result.id, {
            aiTitle: result.aiTitle,
            aiProfessionalWording: result.aiProfessionalWording,
            aiRecommendation: result.aiRecommendation,
            aiSuggestedSection: result.aiSuggestedSection,
            aiProcessed: true,
            finalTitle: result.finalTitle || result.aiTitle,
            finalWording: result.finalWording || result.aiProfessionalWording,
            finalRecommendation: result.finalRecommendation || result.aiRecommendation,
            reportSection: result.reportSection || result.aiSuggestedSection,
          });
          setProcessedIds((prev) => new Set([...prev, result.id]));
        }
      }
    } finally {
      setProcessing(false);
    }
  };

  const updateFindingSection = (
    areaId: string,
    findingId: string,
    section: ReportSection
  ) => {
    updateFinding(id, areaId, findingId, { reportSection: section });
  };

  const toggleExclude = (areaId: string, findingId: string, exclude: boolean) => {
    updateFinding(id, areaId, findingId, { excludeFromReport: exclude });
  };

  const handleProceedToReport = () => {
    updateInspection(id, { status: "ready_for_review" });
    router.push(`/jobs/${id}/report`);
  };

  const totalFindings = allFindings.length;
  const processedCount = allFindings.filter((f) => f.aiProcessed).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/jobs/${id}`)}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-600"
              >
                <ArrowLeft className="w-4.5 h-4.5" />
              </button>
              <div>
                <h1 className="text-base font-bold text-slate-900">Review findings</h1>
                <p className="text-xs text-slate-400">
                  {processedCount}/{totalFindings} processed by AI
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SaveIndicator />
              <Button
                size="sm"
                onClick={handleProceedToReport}
                className="gap-1 rounded-xl"
              >
                <FileOutput className="w-3.5 h-3.5" />
                Report
              </Button>
            </div>
          </div>

          {/* AI processing progress */}
          {processing && (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                <span className="text-xs text-blue-600 font-medium">
                  AI processing findings… {processProgress.done}/{processProgress.total}
                </span>
              </div>
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${processProgress.total > 0
                      ? (processProgress.done / processProgress.total) * 100
                      : 0}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
          {inspection.areas
            .filter((area) => area.findings.length > 0)
            .map((area) => (
              <AreaReviewSection
                key={area.id}
                area={area}
                inspectionId={id}
                editingFindingId={editingFindingId}
                setEditingFindingId={setEditingFindingId}
                onUpdateSection={updateFindingSection}
                onToggleExclude={toggleExclude}
                onUpdateFinding={(areaId, findingId, updates) =>
                  updateFinding(id, areaId, findingId, updates)
                }
                onRegenerate={(finding) => {
                  const area2 = inspection.areas.find((a) =>
                    a.findings.some((f) => f.id === finding.id)
                  );
                  if (area2) {
                    updateFinding(id, area2.id, finding.id, { aiProcessed: false });
                    handleProcessAll();
                  }
                }}
              />
            ))}

          {inspection.areas.every((a) => a.findings.length === 0) && (
            <div className="text-center py-16">
              <Sparkles className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No findings to review</p>
              <p className="text-slate-400 text-sm mt-1">
                Go back to capture findings first
              </p>
              <Button
                className="mt-4"
                onClick={() => router.push(`/jobs/${id}`)}
                variant="secondary"
              >
                Back to capture
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-white border-t border-slate-100 safe-bottom">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <Button
            fullWidth
            size="lg"
            onClick={handleProceedToReport}
            className="gap-2 rounded-2xl"
          >
            <FileOutput className="w-4 h-4" />
            Build report
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Area Review Section ──────────────────────────────────────────────────────

function AreaReviewSection({
  area,
  inspectionId,
  editingFindingId,
  setEditingFindingId,
  onUpdateSection,
  onToggleExclude,
  onUpdateFinding,
  onRegenerate,
}: {
  area: InspectionArea;
  inspectionId: string;
  editingFindingId: string | null;
  setEditingFindingId: (id: string | null) => void;
  onUpdateSection: (areaId: string, findingId: string, section: ReportSection) => void;
  onToggleExclude: (areaId: string, findingId: string, exclude: boolean) => void;
  onUpdateFinding: (areaId: string, findingId: string, updates: Partial<Finding>) => void;
  onRegenerate: (finding: Finding) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 w-full mb-3 group"
      >
        <span className="text-sm font-semibold text-slate-700">{area.name}</span>
        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
          {area.findings.length}
        </span>
        <div className="flex-1 h-px bg-slate-100 mx-2" />
        {collapsed ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {!collapsed && (
        <div className="space-y-3">
          {area.findings.map((finding) => (
            <FindingReviewCard
              key={finding.id}
              finding={finding}
              area={area}
              isEditing={editingFindingId === finding.id}
              onStartEdit={() => setEditingFindingId(finding.id)}
              onStopEdit={() => setEditingFindingId(null)}
              onUpdateSection={(section) => onUpdateSection(area.id, finding.id, section)}
              onToggleExclude={(exclude) => onToggleExclude(area.id, finding.id, exclude)}
              onUpdateFinding={(updates) => onUpdateFinding(area.id, finding.id, updates)}
              onRegenerate={() => onRegenerate(finding)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Individual Finding Review Card ──────────────────────────────────────────

function FindingReviewCard({
  finding,
  area,
  isEditing,
  onStartEdit,
  onStopEdit,
  onUpdateSection,
  onToggleExclude,
  onUpdateFinding,
  onRegenerate,
}: {
  finding: Finding;
  area: InspectionArea;
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onUpdateSection: (section: ReportSection) => void;
  onToggleExclude: (exclude: boolean) => void;
  onUpdateFinding: (updates: Partial<Finding>) => void;
  onRegenerate: () => void;
}) {
  const [showSectionPicker, setShowSectionPicker] = useState(false);
  const [localTitle, setLocalTitle] = useState(finding.finalTitle || finding.aiTitle || "");
  const [localWording, setLocalWording] = useState(
    finding.finalWording || finding.aiProfessionalWording || ""
  );
  const [localRec, setLocalRec] = useState(
    finding.finalRecommendation || finding.aiRecommendation || ""
  );

  const section = finding.reportSection || finding.aiSuggestedSection;
  const sectionCfg = section ? SECTION_CONFIG[section] : null;
  const title = finding.finalTitle || finding.aiTitle;
  const wording = finding.finalWording || finding.aiProfessionalWording;
  const recommendation = finding.finalRecommendation || finding.aiRecommendation;

  const handleSaveEdit = () => {
    onUpdateFinding({
      finalTitle: localTitle,
      finalWording: localWording,
      finalRecommendation: localRec,
    });
    onStopEdit();
  };

  if (!finding.aiProcessed) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center gap-2 text-slate-400">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="text-sm">Processing with AI…</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "bg-white rounded-2xl border shadow-sm overflow-hidden",
          finding.excludeFromReport
            ? "border-slate-100 opacity-60"
            : "border-slate-100"
        )}
      >
        {/* Section badge + title */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start gap-2 justify-between">
            <div className="flex-1 min-w-0">
              {sectionCfg && (
                <button
                  onClick={() => setShowSectionPicker(true)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold mb-2 border",
                    sectionCfg.bg,
                    sectionCfg.color,
                    "border-current/20 hover:opacity-80 transition-opacity"
                  )}
                >
                  {sectionCfg.label}
                  <ChevronDown className="w-3 h-3" />
                </button>
              )}

              {isEditing ? (
                <input
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  className="w-full text-sm font-semibold text-slate-900 border border-blue-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-200"
                />
              ) : (
                <p className="text-sm font-semibold text-slate-900 leading-snug">
                  {title || "Finding"}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {finding.severity && <SeverityBadge severity={finding.severity} size="sm" />}
              {!isEditing && (
                <button
                  onClick={onStartEdit}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Photos strip */}
          {finding.photos.length > 0 && (
            <div className="flex gap-1.5 mt-2 overflow-x-auto hide-scrollbar">
              {finding.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.dataUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Raw capture */}
          {(finding.voiceNote?.transcript || finding.textNote) && !isEditing && (
            <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              {finding.voiceNote?.transcript && (
                <p className="text-xs text-slate-500 flex items-start gap-1.5">
                  <Mic className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <em>"{finding.voiceNote.transcript}"</em>
                </p>
              )}
              {finding.textNote && (
                <p className="text-xs text-slate-500 flex items-start gap-1.5 mt-1">
                  <FileText className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  {finding.textNote}
                </p>
              )}
            </div>
          )}
        </div>

        {/* AI content */}
        <div className="border-t border-slate-50 px-4 py-3 space-y-3">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <Sparkles className="w-3 h-3 text-blue-500" />
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                Professional wording
              </p>
            </div>
            {isEditing ? (
              <textarea
                value={localWording}
                onChange={(e) => setLocalWording(e.target.value)}
                rows={4}
                className="w-full text-sm text-slate-700 border border-blue-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-200 resize-none"
              />
            ) : (
              <p className="text-sm text-slate-700 leading-relaxed">{wording}</p>
            )}
          </div>

          {recommendation && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Recommendation
              </p>
              {isEditing ? (
                <textarea
                  value={localRec}
                  onChange={(e) => setLocalRec(e.target.value)}
                  rows={2}
                  className="w-full text-sm text-slate-600 border border-blue-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                />
              ) : (
                <p className="text-sm text-slate-600 leading-relaxed">{recommendation}</p>
              )}
            </div>
          )}
        </div>

        {/* Action bar */}
        <div className="border-t border-slate-50 flex">
          {isEditing ? (
            <>
              <button
                onClick={handleSaveEdit}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-green-600 hover:bg-green-50 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Save changes
              </button>
              <button
                onClick={onStopEdit}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onRegenerate}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate
              </button>
              <button
                onClick={() => onToggleExclude(!finding.excludeFromReport)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors",
                  finding.excludeFromReport
                    ? "text-blue-600 hover:bg-blue-50"
                    : "text-slate-400 hover:bg-slate-50"
                )}
              >
                <SkipForward className="w-3.5 h-3.5" />
                {finding.excludeFromReport ? "Re-include" : "Exclude"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Section picker modal */}
      <Modal
        open={showSectionPicker}
        onClose={() => setShowSectionPicker(false)}
        title="Move to section"
        size="sm"
      >
        <div className="p-4 space-y-2">
          {REPORT_SECTIONS.map((s) => {
            const cfg = SECTION_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => {
                  onUpdateSection(s);
                  setShowSectionPicker(false);
                }}
                className={cn(
                  "w-full px-4 py-3 rounded-xl text-left text-sm font-semibold transition-colors border",
                  section === s
                    ? `${cfg.bg} ${cfg.color} border-current/20`
                    : "text-slate-700 border-slate-100 hover:bg-slate-50"
                )}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>
      </Modal>
    </>
  );
}
