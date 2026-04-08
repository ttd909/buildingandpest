"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  CheckCircle2,
  Circle,
  Plus,
  Sparkles,
  X,
  Mic,
  Camera,
  Flag,
  Play,
  RotateCcw,
} from "lucide-react";
import { useInspectionStore } from "@/lib/store/useInspectionStore";
import { InspectionArea, AreaCaptureSession, Finding } from "@/types";
import { generateId } from "@/lib/utils";
import { LiveAreaCapture } from "@/components/capture/LiveAreaCapture";
import { FindingCard } from "@/components/capture/FindingCard";
import { SaveIndicator } from "@/components/ui/SaveIndicator";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { generateFindingsFromSession } from "@/lib/ai/sessionService";
import { cn } from "@/lib/utils";

type PageState =
  | { mode: "overview" }
  | { mode: "capturing"; areaId: string }
  | { mode: "processing"; areaId: string }
  | { mode: "done"; areaId: string };

export default function InspectionWorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const {
    getInspection,
    initialize,
    initialized,
    saveSession,
    updateSession,
    addFindings,
    deleteFinding,
    addArea,
    setStatus,
  } = useInspectionStore();

  const [pageState, setPageState] = useState<PageState>({ mode: "overview" });
  const [showAreaPicker, setShowAreaPicker] = useState(false);
  const [showAddArea, setShowAddArea] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");

  useEffect(() => {
    if (!initialized) initialize();
  }, [initialized, initialize]);

  const inspection = getInspection(id);

  if (!initialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading…</div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-slate-600">Inspection not found</p>
        <Button onClick={() => router.push("/dashboard")}>Back to dashboard</Button>
      </div>
    );
  }

  const areasWithSessions = inspection.areas.filter(
    (a) => a.session?.status === "done" || a.findings.length > 0
  );
  const progress = Math.round(
    (areasWithSessions.length / Math.max(inspection.areas.length, 1)) * 100
  );
  const totalFindings = inspection.areas.reduce((acc, a) => acc + a.findings.length, 0);

  const handleStartCapture = (areaId: string) => {
    setShowAreaPicker(false);
    setPageState({ mode: "capturing", areaId });
  };

  const handleSessionFinished = async (session: AreaCaptureSession, areaId: string) => {
    // 1. Save session
    saveSession(id, areaId, session);
    setStatus(id, "in_progress");

    // 2. Show processing state
    setPageState({ mode: "processing", areaId });

    // 3. Generate findings from session
    const area = inspection.areas.find((a) => a.id === areaId);
    const findings = await generateFindingsFromSession({
      session,
      inspectionType: inspection.inspectionType,
    });

    // 4. Save findings and mark session done
    addFindings(id, areaId, findings);
    updateSession(id, areaId, { status: "done" });

    // 5. Show done state briefly, then return to overview
    setPageState({ mode: "done", areaId });
    setTimeout(() => setPageState({ mode: "overview" }), 1800);
  };

  const handleAddCustomArea = () => {
    if (!newAreaName.trim()) return;
    addArea(id, newAreaName.trim(), true);
    setNewAreaName("");
    setShowAddArea(false);
  };

  const handleGoToReview = () => {
    setStatus(id, "ready_for_review");
    router.push(`/jobs/${id}/review`);
  };

  // ── Live capture overlay ─────────────────────────────────────────────────────
  if (pageState.mode === "capturing") {
    const area = inspection.areas.find((a) => a.id === pageState.areaId);
    if (!area) {
      setPageState({ mode: "overview" });
      return null;
    }
    return (
      <LiveAreaCapture
        areaName={area.name}
        existingSession={area.session}
        onFinish={(session) => handleSessionFinished(session, area.id)}
        onCancel={() => setPageState({ mode: "overview" })}
      />
    );
  }

  // ── Processing overlay ───────────────────────────────────────────────────────
  if (pageState.mode === "processing" || pageState.mode === "done") {
    const area = inspection.areas.find((a) => a.id === pageState.areaId);
    const isDone = pageState.mode === "done";
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center px-8">
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-500",
          isDone ? "bg-green-500" : "bg-blue-500/20"
        )}>
          {isDone ? (
            <CheckCircle2 className="w-10 h-10 text-white" />
          ) : (
            <Sparkles className="w-10 h-10 text-blue-400 animate-pulse" />
          )}
        </div>
        <p className="text-white text-xl font-bold mb-2">
          {isDone ? "Findings generated" : "AI grouping findings…"}
        </p>
        <p className="text-white/50 text-sm text-center">
          {isDone
            ? `${inspection.areas.find(a => a.id === pageState.areaId)?.findings.length ?? 0} findings ready for review`
            : `Processing ${area?.name}…`}
        </p>
        {!isDone && (
          <div className="mt-8 flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-blue-500"
                style={{ animation: `pulse 1s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Overview (main screen) ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/dashboard")}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-600"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate max-w-[180px]">
                  {inspection.propertyAddress}
                </p>
                <p className="text-xs text-slate-400">
                  {totalFindings} finding{totalFindings !== 1 ? "s" : ""} · {areasWithSessions.length}/{inspection.areas.length} areas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SaveIndicator />
              {totalFindings > 0 && (
                <Button size="sm" onClick={handleGoToReview} className="gap-1 rounded-xl">
                  <Sparkles className="w-3.5 h-3.5" />
                  Review
                </Button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-slate-400 tabular-nums">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
          {/* Next area CTA */}
          <NextAreaCta
            areas={inspection.areas}
            onStart={handleStartCapture}
            onOpenPicker={() => setShowAreaPicker(true)}
          />

          {/* Completed areas */}
          {areasWithSessions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-1">
                Captured areas
              </p>
              {inspection.areas
                .filter((a) => a.session?.status === "done" || a.findings.length > 0)
                .map((area) => (
                  <CompletedAreaRow
                    key={area.id}
                    area={area}
                    inspectionId={id}
                    onRecapture={() => handleStartCapture(area.id)}
                    onDeleteFinding={(findingId) => deleteFinding(id, area.id, findingId)}
                  />
                ))}
            </div>
          )}

          {/* Empty state */}
          {areasWithSessions.length === 0 && (
            <div className="text-center pt-4 pb-8">
              <p className="text-slate-400 text-sm">
                Select an area above to begin
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-white border-t border-slate-100 safe-bottom">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setShowAreaPicker(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
            All areas
          </button>
          <div className="flex-1" />
          <Button
            size="md"
            onClick={handleGoToReview}
            disabled={totalFindings === 0}
            className="gap-1.5 rounded-xl"
          >
            <Sparkles className="w-4 h-4" />
            Finish &amp; review
          </Button>
        </div>
      </div>

      {/* Area picker modal */}
      <Modal
        open={showAreaPicker}
        onClose={() => setShowAreaPicker(false)}
        title="Choose area"
        size="md"
      >
        <div className="p-4 space-y-1.5 pb-2">
          {inspection.areas.map((area) => {
            const done = area.session?.status === "done" || area.findings.length > 0;
            return (
              <button
                key={area.id}
                onClick={() => handleStartCapture(area.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors text-left",
                  done
                    ? "hover:bg-green-50 border border-transparent"
                    : "hover:bg-blue-50 border border-transparent hover:border-blue-200"
                )}
              >
                {done ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{area.name}</p>
                  {done && (
                    <p className="text-xs text-slate-500">
                      {area.findings.length} finding{area.findings.length !== 1 ? "s" : ""} · tap to recapture
                    </p>
                  )}
                </div>
                <Play className="w-4 h-4 text-blue-500 flex-shrink-0" />
              </button>
            );
          })}

          {/* Add custom area */}
          {showAddArea ? (
            <div className="flex gap-2 pt-1">
              <input
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCustomArea()}
                placeholder="Custom area name…"
                autoFocus
                className="flex-1 h-11 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-400"
              />
              <button
                onClick={handleAddCustomArea}
                className="h-11 px-4 bg-blue-600 text-white rounded-xl text-sm font-semibold"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddArea(false)}
                className="h-11 w-11 flex items-center justify-center rounded-xl hover:bg-slate-100"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddArea(true)}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-colors mt-1"
            >
              <Plus className="w-4 h-4" />
              Add custom area
            </button>
          )}
        </div>
        <div className="px-4 pb-5 pt-2">
          <Button fullWidth size="lg" onClick={handleGoToReview} disabled={totalFindings === 0} className="gap-2 rounded-xl">
            <Sparkles className="w-4 h-4" />
            Finish &amp; review
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// ─── Next area CTA ────────────────────────────────────────────────────────────

function NextAreaCta({
  areas,
  onStart,
  onOpenPicker,
}: {
  areas: InspectionArea[];
  onStart: (areaId: string) => void;
  onOpenPicker: () => void;
}) {
  const nextArea = areas.find(
    (a) => a.session?.status !== "done" && a.findings.length === 0
  );

  if (!nextArea) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
        <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-green-800">All areas captured</p>
        <p className="text-xs text-green-600 mt-0.5">Head to review when ready</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Primary: start next area */}
      <button
        onClick={() => onStart(nextArea.id)}
        className="w-full bg-blue-600 text-white rounded-2xl p-5 flex items-center gap-4 active:scale-[0.98] transition-transform shadow-lg shadow-blue-600/20"
      >
        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Mic className="w-7 h-7 text-white" />
        </div>
        <div className="text-left flex-1 min-w-0">
          <p className="text-white/70 text-xs font-medium mb-0.5">Next area</p>
          <p className="text-white font-bold text-lg leading-tight truncate">{nextArea.name}</p>
          <p className="text-white/60 text-xs mt-0.5">Tap to start capture</p>
        </div>
      </button>

      {/* Secondary: choose different area */}
      <button
        onClick={onOpenPicker}
        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-3 text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors active:scale-[0.99]"
      >
        <ChevronDown className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-medium">Choose a different area</span>
      </button>
    </div>
  );
}

// ─── Completed area row ───────────────────────────────────────────────────────

function CompletedAreaRow({
  area,
  inspectionId,
  onRecapture,
  onDeleteFinding,
}: {
  area: InspectionArea;
  inspectionId: string;
  onRecapture: () => void;
  onDeleteFinding: (findingId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      >
        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">{area.name}</p>
          <p className="text-xs text-slate-400">
            {area.findings.length} finding{area.findings.length !== 1 ? "s" : ""}
            {area.session && area.session.markers.length > 0 && (
              <> · {area.session.markers.length} marker{area.session.markers.length !== 1 ? "s" : ""}</>
            )}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRecapture();
          }}
          className="flex items-center gap-1 text-xs text-blue-600 font-medium bg-blue-50 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Redo
        </button>
      </button>

      {expanded && area.findings.length > 0 && (
        <div className="border-t border-slate-50 px-3 pb-3 space-y-2 pt-2">
          {area.findings.map((finding) => (
            <FindingCard
              key={finding.id}
              finding={finding}
              compact
              onDelete={() => onDeleteFinding(finding.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
