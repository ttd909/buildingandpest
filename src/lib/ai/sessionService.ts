import { AreaCaptureSession, Finding, ReportSection, Severity, InspectionType, CapturedPhoto, TranscriptSegment } from "@/types";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface SessionGroupInput {
  session: AreaCaptureSession;
  inspectionType: InspectionType;
}

/**
 * Generate findings from a completed area capture session.
 * Uses real Whisper transcriptSegments when available; falls back to
 * marker-only grouping when audio transcription wasn't possible.
 */
export async function generateFindingsFromSession(
  input: SessionGroupInput
): Promise<Finding[]> {
  const now = new Date().toISOString();
  return generateFromMarkersAndTranscript(input.session, now);
}

function extractSpokenContext(segments: TranscriptSegment[], markerTs: number): string {
  return segments
    .filter((s) => s.start <= markerTs + 20 && s.end >= markerTs - 5)
    .map((s) => s.text)
    .join(" ")
    .trim();
}

function generateFromMarkersAndTranscript(session: AreaCaptureSession, now: string): Finding[] {
  const { markers, photos, transcriptSegments = [], areaName } = session;

  if (markers.length === 0 && transcriptSegments.length === 0) {
    return [
      {
        id: generateId(),
        areaName,
        photos: (photos || []).map((p) => ({
          id: p.id,
          dataUrl: p.dataUrl,
          capturedAt: p.capturedAt,
        })),
        tags: [],
        capturedAt: now,
        sourceSessionId: session.id,
        aiTitle: `Area inspected — ${areaName}`,
        aiProfessionalWording: `The ${areaName} was inspected. No significant defects were observed at the time of inspection.`,
        aiRecommendation: "No immediate action required. Monitor as part of routine maintenance.",
        aiSuggestedSection: "maintenance_items",
        aiProcessed: true,
        reportSection: "maintenance_items",
        finalTitle: `Area inspected — ${areaName}`,
        finalWording: `The ${areaName} was inspected. No significant defects were observed at the time of inspection.`,
        finalRecommendation: "No immediate action required.",
        excludeFromReport: false,
      },
    ];
  }

  const sectionMap: Record<Severity, ReportSection> = {
    minor: "minor_defects",
    major: "major_defects",
    safety: "safety_hazards",
    monitor: "minor_defects",
    pest: "pest_findings",
  };

  return markers.map((marker) => {
    const severity = marker.severityHint || "minor";
    const tags = marker.tagHint ? [marker.tagHint] : [];
    const spokenContext = extractSpokenContext(transcriptSegments, marker.timestampSeconds);

    // Assign each photo to exactly its nearest marker — prevents duplicates across findings
    const nearbyPhotos = (photos || [])
      .filter((p) => {
        const myDist = Math.abs(p.timestampSeconds - marker.timestampSeconds);
        if (myDist > 60) return false; // too far from any marker
        const nearest = markers.reduce((best, m) =>
          Math.abs(p.timestampSeconds - m.timestampSeconds) < Math.abs(p.timestampSeconds - best.timestampSeconds) ? m : best
        );
        return nearest.id === marker.id;
      })
      .slice(0, 3)
      .map((p) => ({ id: p.id, dataUrl: p.dataUrl, capturedAt: p.capturedAt, fileName: p.fileName } as CapturedPhoto));

    const aiOut = deriveAiOutput({ areaName, spokenContext, tags, severity });

    return {
      id: generateId(),
      areaName,
      photos: nearbyPhotos,
      voiceNote: spokenContext
        ? { id: generateId(), transcript: spokenContext, transcriptStatus: "done" as const, recordedAt: session.startedAt }
        : undefined,
      tags,
      severity,
      capturedAt: now,
      sourceSessionId: session.id,
      aiTitle: aiOut.title,
      aiProfessionalWording: aiOut.wording,
      aiRecommendation: aiOut.recommendation,
      aiSuggestedSection: aiOut.section ?? sectionMap[severity],
      aiProcessed: true,
      reportSection: aiOut.section ?? sectionMap[severity],
      finalTitle: aiOut.title,
      finalWording: aiOut.wording,
      finalRecommendation: aiOut.recommendation,
      excludeFromReport: false,
    };
  });
}

function deriveAiOutput(input: {
  areaName: string;
  spokenContext: string;
  tags: string[];
  severity: Severity;
}): { title: string; wording: string; recommendation: string; section: ReportSection | null } {
  const { areaName, spokenContext, tags, severity } = input;
  const text = spokenContext.toLowerCase();

  if (tags.includes("termite risk") || tags.includes("pest evidence") || text.includes("termite") || text.includes("borer")) {
    return {
      title: `Evidence of timber pest activity — ${areaName}`,
      wording: spokenContext
        ? `Evidence of timber pest activity was observed in the ${areaName}. The inspector noted: "${spokenContext}". This requires urgent investigation by a licensed pest controller.`
        : `Evidence of timber pest activity was observed in the ${areaName}. A timber pest inspection is strongly recommended.`,
      recommendation: "Engage a licensed pest controller to conduct a full timber pest inspection and implement an appropriate treatment program.",
      section: "pest_findings",
    };
  }

  if (tags.includes("moisture") || text.includes("moisture") || text.includes("damp") || text.includes("wet") || text.includes("water")) {
    return {
      title: `Elevated moisture — ${areaName}`,
      wording: spokenContext
        ? `Elevated moisture was identified in the ${areaName}. The inspector noted: "${spokenContext}". Unaddressed moisture can cause structural damage and mould growth.`
        : `Elevated moisture levels were detected in the ${areaName}.`,
      recommendation: "Identify and rectify the source of moisture ingress. Engage a licensed waterproofing contractor if required.",
      section: severity === "major" ? "major_defects" : "minor_defects",
    };
  }

  if (tags.includes("structural") || text.includes("structural") || text.includes("crack") || text.includes("cracking")) {
    const isMajor = severity === "major" || text.includes("structural");
    return {
      title: `Cracking or structural movement — ${areaName}`,
      wording: spokenContext
        ? `Cracking was observed in the ${areaName}. The inspector noted: "${spokenContext}".`
        : `Cracking was observed in the ${areaName}.`,
      recommendation: isMajor
        ? "Engage a structural engineer to assess the cracking and advise on remediation."
        : "Monitor for progression and rectify cosmetically as part of routine maintenance.",
      section: isMajor ? "major_defects" : "minor_defects",
    };
  }

  if (tags.includes("safety") || text.includes("safety") || text.includes("hazard") || text.includes("trip")) {
    return {
      title: `Safety hazard — ${areaName}`,
      wording: spokenContext
        ? `A safety hazard was identified in the ${areaName}. The inspector noted: "${spokenContext}".`
        : `A safety hazard was identified in the ${areaName} that poses a risk to occupants.`,
      recommendation: "Rectify the safety hazard as a priority. Engage licensed trades as required.",
      section: "safety_hazards",
    };
  }

  if (tags.includes("roofing") || text.includes("roof") || text.includes("tile") || text.includes("flashing")) {
    return {
      title: `Roofing defect — ${areaName}`,
      wording: spokenContext
        ? `A roofing defect was observed in the ${areaName}. The inspector noted: "${spokenContext}".`
        : `A defect was identified to the roof covering or flashings in the ${areaName}.`,
      recommendation: "Engage a licensed roofing contractor to inspect and carry out all necessary repairs.",
      section: severity === "major" ? "major_defects" : "maintenance_items",
    };
  }

  if (tags.includes("drainage") || text.includes("drain") || text.includes("pool")) {
    return {
      title: `Drainage issue — ${areaName}`,
      wording: spokenContext
        ? `A drainage issue was observed in the ${areaName}. The inspector noted: "${spokenContext}".`
        : `Inadequate drainage was identified in the vicinity of the ${areaName}.`,
      recommendation: "Improve drainage by regrading ground levels or installing surface/subsurface drainage. Consult a drainage contractor.",
      section: "maintenance_items",
    };
  }

  const fallbackSection: Record<Severity, ReportSection> = {
    minor: "minor_defects",
    major: "major_defects",
    safety: "safety_hazards",
    monitor: "minor_defects",
    pest: "pest_findings",
  };
  return {
    title: `Defect noted — ${areaName}`,
    wording: spokenContext
      ? `A defect was identified in the ${areaName}. The inspector noted: "${spokenContext}". Further assessment is recommended.`
      : `A defect was identified in the ${areaName} requiring attention. Refer to photographic record for detail.`,
    recommendation: "Engage a suitably qualified tradesperson to assess and rectify the identified defect.",
    section: fallbackSection[severity],
  };
}
