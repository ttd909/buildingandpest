"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { Finding, CapturedPhoto, VoiceNote, Severity } from "@/types";
import { generateId } from "@/lib/utils";
import { PhotoCapture } from "./PhotoCapture";
import { VoiceRecorder } from "./VoiceRecorder";
import { TagSelector } from "./TagSelector";
import { SeveritySelector } from "./SeveritySelector";
import { Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface CaptureCardProps {
  areaName: string;
  onSave: (finding: Omit<Finding, "id" | "capturedAt" | "aiProcessed" | "excludeFromReport">) => void;
}

export function CaptureCard({ areaName, onSave }: CaptureCardProps) {
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [voiceNote, setVoiceNote] = useState<VoiceNote | undefined>();
  const [textNote, setTextNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [severity, setSeverity] = useState<Severity | undefined>();
  const [showTextNote, setShowTextNote] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasContent = photos.length > 0 || voiceNote || textNote.trim() || tags.length > 0;

  const handleSave = () => {
    if (!hasContent) return;

    onSave({
      areaName,
      photos,
      voiceNote,
      textNote: textNote.trim() || undefined,
      tags,
      severity,
    });

    // Reset for next finding
    setPhotos([]);
    setVoiceNote(undefined);
    setTextNote("");
    setTags([]);
    setSeverity(undefined);
    setShowTextNote(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700">New finding — {areaName}</h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Photos */}
        <PhotoCapture photos={photos} onChange={setPhotos} />

        {/* Voice recorder */}
        <VoiceRecorder voiceNote={voiceNote} onChange={setVoiceNote} />

        {/* Optional text note toggle */}
        <button
          onClick={() => setShowTextNote(!showTextNote)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <FileText className="w-4 h-4" />
          {showTextNote ? "Hide" : "Add"} text note
          {showTextNote ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        {showTextNote && (
          <Textarea
            placeholder="Optional — describe what you see..."
            value={textNote}
            onChange={(e) => setTextNote(e.target.value)}
            rows={3}
          />
        )}

        {/* Tags */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Quick tags
          </p>
          <TagSelector selected={tags} onChange={setTags} />
        </div>

        {/* Severity */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Severity
          </p>
          <SeveritySelector value={severity} onChange={setSeverity} />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!hasContent}
          className={cn(
            "w-full h-14 rounded-2xl font-semibold text-base transition-all duration-150 flex items-center justify-center gap-2",
            hasContent
              ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-sm"
              : "bg-slate-100 text-slate-400 cursor-not-allowed",
            saved && "bg-green-500"
          )}
        >
          {saved ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Finding saved
            </>
          ) : (
            "Save finding"
          )}
        </button>
      </div>
    </div>
  );
}
