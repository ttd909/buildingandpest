// Core domain types for InspectFlow AI

export type InspectionType = "building" | "pest" | "combined";
export type PropertyType = "house" | "townhouse" | "unit" | "commercial";
export type InspectionStatus = "draft" | "in_progress" | "ready_for_review" | "completed";

export type Severity = "minor" | "major" | "safety" | "monitor" | "pest";

export type ReportSection =
  | "major_defects"
  | "minor_defects"
  | "safety_hazards"
  | "pest_findings"
  | "maintenance_items"
  | "excluded";

export const SEVERITY_LABELS: Record<Severity, string> = {
  minor: "Minor",
  major: "Major",
  safety: "Safety",
  monitor: "Monitor",
  pest: "Pest",
};

export const SEVERITY_COLORS: Record<Severity, string> = {
  minor: "severity-minor",
  major: "severity-major",
  safety: "severity-safety",
  monitor: "severity-monitor",
  pest: "severity-pest",
};

export const REPORT_SECTION_LABELS: Record<ReportSection, string> = {
  major_defects: "Major Defects",
  minor_defects: "Minor Defects",
  safety_hazards: "Safety Hazards",
  pest_findings: "Pest Findings",
  maintenance_items: "Maintenance Items",
  excluded: "Excluded",
};

export const INSPECTION_AREAS = [
  "Front exterior",
  "Rear exterior",
  "Roof exterior",
  "Roof void",
  "Subfloor",
  "Interior",
  "Kitchen",
  "Laundry",
  "Bathroom 1",
  "Bathroom 2",
  "Bedrooms",
  "Living areas",
  "Garage",
  "Site drainage",
  "Fencing",
  "Pest evidence",
  "Other",
] as const;

export type DefaultArea = (typeof INSPECTION_AREAS)[number];

export const QUICK_TAGS = [
  "moisture",
  "cracking",
  "mould",
  "gutters",
  "roofing",
  "drainage",
  "electrical",
  "plumbing",
  "termite risk",
  "pest evidence",
  "structural",
  "safety",
  "doors/windows",
  "sealant",
  "flooring",
  "fencing",
  "ventilation",
  "insulation",
  "general maintenance",
] as const;

export type QuickTag = (typeof QUICK_TAGS)[number];

// ─── Session types (live area capture) ────────────────────────────────────────

/** A one-tap issue marker created during live recording */
export interface IssueMarker {
  id: string;
  /** Seconds since session start */
  timestampSeconds: number;
  /** Optional fast hint — not required, set inline without interrupting flow */
  tagHint?: string;
  severityHint?: Severity;
}

/** A photo taken during a live capture session */
export interface SessionPhoto {
  id: string;
  dataUrl: string;
  /** Seconds since session start */
  timestampSeconds: number;
  capturedAt: string;
  fileName?: string;
}

/** One continuous capture session for a single area */
export interface AreaCaptureSession {
  id: string;
  areaName: string;
  startedAt: string;
  endedAt?: string;
  /** "active" while recording, "processing" while AI groups findings, "done" after */
  status: "active" | "processing" | "done";
  audioBlobUrl?: string;
  /** Raw transcript from STT or placeholder */
  transcript?: string;
  transcriptStatus: "none" | "pending" | "done" | "manual";
  markers: IssueMarker[];
  photos: SessionPhoto[];
}

// ─── Legacy per-finding types (kept for review/report compatibility) ──────────

/** A photo captured on device — used in findings */
export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  capturedAt: string;
  fileName?: string;
}

/** Legacy voice note — kept for demo data compatibility */
export interface VoiceNote {
  id: string;
  audioBlob?: Blob;
  audioBlobUrl?: string;
  transcript?: string;
  transcriptStatus: "pending" | "processing" | "done" | "manual";
  durationSeconds?: number;
  recordedAt: string;
}

/** A single finding — used by review and report screens */
export interface Finding {
  id: string;
  areaName: string;
  photos: CapturedPhoto[];
  voiceNote?: VoiceNote;
  textNote?: string;
  tags: string[];
  severity?: Severity;
  capturedAt: string;

  /** Which session generated this finding (if any) */
  sourceSessionId?: string;

  // AI-generated content
  aiTitle?: string;
  aiProfessionalWording?: string;
  aiRecommendation?: string;
  aiSuggestedSection?: ReportSection;
  aiProcessed: boolean;

  // User overrides in review
  reportSection?: ReportSection;
  finalTitle?: string;
  finalWording?: string;
  finalRecommendation?: string;
  excludeFromReport: boolean;

  estimatedCost?: string;
}

/** An area within an inspection */
export interface InspectionArea {
  id: string;
  name: string;
  isCustom: boolean;
  findings: Finding[];
  completedAt?: string;
  order: number;
  /** Live capture session for this area (replaces manual finding entry) */
  session?: AreaCaptureSession;
}

/** Inspector details */
export interface InspectorDetails {
  name: string;
  licenceNumber?: string;
  company?: string;
  phone?: string;
  email?: string;
  signaturePlaceholder?: string;
}

/** Full inspection/job */
export interface Inspection {
  id: string;
  propertyAddress: string;
  clientName: string;
  clientEmail?: string;
  inspectionDate: string;
  inspectionType: InspectionType;
  propertyType: PropertyType;
  notes?: string;
  status: InspectionStatus;
  areas: InspectionArea[];
  createdAt: string;
  updatedAt: string;

  executiveSummary?: string;
  companyName?: string;
  companyLogo?: string;
  inspectorDetails?: InspectorDetails;
  reportGeneratedAt?: string;
}

// ─── AI service types ─────────────────────────────────────────────────────────

export interface AIProcessingInput {
  areaName: string;
  transcript?: string;
  textNote?: string;
  tags: string[];
  severity?: Severity;
  inspectionType: InspectionType;
}

export interface AIProcessingOutput {
  title: string;
  professionalWording: string;
  recommendation: string;
  suggestedSection: ReportSection;
  suggestedSeverity: Severity;
}

export interface AISessionGroupingInput {
  session: AreaCaptureSession;
  inspectionType: InspectionType;
}

export interface AIExecutiveSummaryInput {
  inspection: Inspection;
  findingsBySection: Record<ReportSection, Finding[]>;
}
