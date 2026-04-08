"use client";

import { QUICK_TAGS } from "@/types";
import { cn } from "@/lib/utils";

interface TagSelectorProps {
  selected: string[];
  onChange: (tags: string[]) => void;
}

const TAG_ICONS: Record<string, string> = {
  moisture: "💧",
  cracking: "🔨",
  mould: "🟢",
  gutters: "🏠",
  roofing: "🔧",
  drainage: "🌊",
  electrical: "⚡",
  plumbing: "🔩",
  "termite risk": "🐜",
  "pest evidence": "🐛",
  structural: "🏗️",
  safety: "⚠️",
  "doors/windows": "🚪",
  sealant: "🔑",
  flooring: "▦",
  fencing: "🚧",
  ventilation: "💨",
  insulation: "🧱",
  "general maintenance": "🔧",
};

export function TagSelector({ selected, onChange }: TagSelectorProps) {
  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_TAGS.map((tag) => {
        const active = selected.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => toggle(tag)}
            className={cn(
              "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-100 active:scale-95",
              active
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <span className="text-xs">{TAG_ICONS[tag] || "•"}</span>
            {tag}
          </button>
        );
      })}
    </div>
  );
}
