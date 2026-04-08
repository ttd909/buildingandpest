"use client";

import { useState } from "react";
import { Edit2, Trash2, Copy, MoveRight, Mic } from "lucide-react";
import { Finding } from "@/types";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { ConfirmModal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

interface FindingCardProps {
  finding: Finding;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onMove?: () => void;
  compact?: boolean;
}

export function FindingCard({
  finding,
  onEdit,
  onDelete,
  onDuplicate,
  onMove,
  compact = false,
}: FindingCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const firstPhoto = finding.photos[0];
  const displayTitle =
    finding.finalTitle || finding.aiTitle || finding.textNote?.slice(0, 60) || "Finding";
  const displayNote = finding.textNote || finding.voiceNote?.transcript;

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex">
          {/* Photo thumbnail */}
          {firstPhoto && !compact && (
            <div className="w-24 h-24 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={firstPhoto.dataUrl}
                alt="Finding"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 p-3 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
                  {displayTitle}
                </p>

                {/* Tags */}
                {finding.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {finding.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                    {finding.tags.length > 3 && (
                      <span className="text-xs text-slate-400">
                        +{finding.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Voice transcript or text note */}
                {displayNote && !compact && (
                  <p className="text-xs text-slate-400 mt-1.5 italic line-clamp-2 flex items-start gap-1">
                    <Mic className="w-3 h-3 flex-shrink-0 mt-0.5 text-slate-300" />
                    <span>"{displayNote}"</span>
                  </p>
                )}

                {/* Indicators */}
                <div className="flex items-center gap-2 mt-1.5">
                  {finding.photos.length > 1 && (
                    <span className="text-xs text-slate-400">
                      {finding.photos.length} photos
                    </span>
                  )}
                </div>
              </div>

              {finding.severity && (
                <SeverityBadge severity={finding.severity} size="sm" />
              )}
            </div>
          </div>
        </div>

        {/* Action bar */}
        {(onEdit || onDelete || onDuplicate || onMove) && (
          <div className="border-t border-slate-100 flex">
            {onEdit && (
              <ActionBtn icon={<Edit2 className="w-3.5 h-3.5" />} label="Edit" onClick={onEdit} />
            )}
            {onDuplicate && (
              <ActionBtn icon={<Copy className="w-3.5 h-3.5" />} label="Copy" onClick={onDuplicate} />
            )}
            {onMove && (
              <ActionBtn icon={<MoveRight className="w-3.5 h-3.5" />} label="Move" onClick={onMove} />
            )}
            {onDelete && (
              <ActionBtn
                icon={<Trash2 className="w-3.5 h-3.5" />}
                label="Delete"
                onClick={() => setConfirmDelete(true)}
                danger
              />
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={onDelete!}
        title="Delete finding?"
        message="This finding will be permanently removed from the inspection."
        confirmLabel="Delete finding"
      />
    </>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
        danger
          ? "text-red-500 hover:bg-red-50"
          : "text-slate-500 hover:bg-slate-50"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
