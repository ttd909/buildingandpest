"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "full";
}

export function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-hidden flex flex-col",
          size === "sm" && "sm:max-w-sm",
          size === "md" && "sm:max-w-lg",
          size === "lg" && "sm:max-w-2xl",
          size === "full" && "sm:max-w-4xl"
        )}
      >
        {title && (
          <div className="flex items-center justify-between p-5 border-b border-slate-100 flex-shrink-0">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        {!title && (
          <div className="absolute top-3 right-4 z-10">
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete",
  variant = "danger",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "primary";
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="p-5 space-y-4">
        <p className="text-sm text-slate-600">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              "flex-1 h-11 rounded-xl text-sm font-semibold text-white transition-colors",
              variant === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
