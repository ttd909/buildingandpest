/**
 * AI Session Service
 *
 * Groups a completed AreaCaptureSession (transcript + markers + photos)
 * into suggested Findings for inspector review.
 *
 * Currently uses rule-based mock logic with realistic Australian inspection language.
 *
 * To connect a real LLM:
 * - Replace `mockGroupSession` with an API call that receives the full session context
 * - The prompt should include transcript, marker timestamps, and photo count/timestamps
 * - Parse structured JSON response into Finding[]
 */

import { AreaCaptureSession, Finding, ReportSection, Severity, InspectionType, CapturedPhoto } from "@/types";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Input to the session grouping function */
export interface SessionGroupInput {
  session: AreaCaptureSession;
  inspectionType: InspectionType;
}

/**
 * Generate suggested findings from a completed area capture session.
 * Called after the inspector taps "Finish Area Capture".
 */
export async function generateFindingsFromSession(
  input: SessionGroupInput
): Promise<Finding[]> {
  // TODO: Replace with LLM call
  // const prompt = buildSessionPrompt(input);
  // const response = await callLLM(prompt);
  // return parseFindings(response);

  await delay(900);
  return mockGroupSession(input);
}

// ─── Transcript-based demo transcripts per area ────────────────────────────────

const DEMO_TRANSCRIPTS: Record<string, { transcript: string; findings: MockFindingSpec[] }> = {
  "Front exterior": {
    transcript:
      "Right, front exterior. Gutters blocked with leaf debris, significant buildup. Noticed some minor cracks to brick veneer on the left side, probably just settlement. Timber fascia boards look okay, bit of peeling paint. Concrete path to front door has a significant crack, slight trip hazard.",
    findings: [
      {
        title: "Blocked gutters — front elevation",
        wording:
          "Gutters at the front elevation were found blocked with significant accumulation of leaf debris and organic matter. Overflowing gutters can direct water into wall cavities and saturate footings.",
        recommendation:
          "Clean and clear all gutters and downpipes. Inspect downpipes for obstruction. Consider gutter guard installation.",
        tags: ["gutters", "general maintenance"],
        severity: "minor",
        section: "maintenance_items",
      },
      {
        title: "Minor cracking to brick veneer — front elevation",
        wording:
          "Minor hairline cracking was observed to the brick veneer on the left side of the front elevation. The cracking appears consistent with normal building movement and settlement.",
        recommendation:
          "Monitor for any progression. Repoint and seal cracks as part of routine maintenance.",
        tags: ["cracking"],
        severity: "monitor",
        section: "minor_defects",
      },
      {
        title: "Cracked concrete path — safety hazard",
        wording:
          "A significant crack was observed to the concrete path at the front entry. This presents a potential trip hazard for occupants and visitors.",
        recommendation:
          "Repair or replace the affected section of concrete path. Ensure surface is level and free of trip hazards.",
        tags: ["safety", "general maintenance"],
        severity: "safety",
        section: "safety_hazards",
      },
    ],
  },
  "Roof exterior": {
    transcript:
      "Roof exterior. Loose flashing at the chimney junction, definitely a concern. Couple of cracked tiles on the south-facing slope, water could get in. Ridge capping looks okay, mortar a bit weathered in sections. Some moss growth on southern tiles.",
    findings: [
      {
        title: "Loose roof flashing — chimney junction",
        wording:
          "Loose roof flashing was observed at the chimney junction. This condition may allow water penetration into the roof space and internal wall linings. Rectification is recommended prior to the next wet season.",
        recommendation:
          "Engage a licensed roofing contractor to re-secure and re-seal the flashing at the chimney junction. Inspect surrounding roof cladding for signs of water ingress.",
        tags: ["roofing", "moisture"],
        severity: "major",
        section: "major_defects",
      },
      {
        title: "Cracked roof tiles — south-facing slope",
        wording:
          "Several cracked roof tiles were observed on the south-facing slope. Cracked tiles can allow water ingress into the roof space and may cause damage to ceiling linings and structural timbers if not addressed.",
        recommendation:
          "Engage a licensed roofing contractor to replace cracked tiles and inspect for additional damage.",
        tags: ["roofing"],
        severity: "major",
        section: "major_defects",
      },
    ],
  },
  "Subfloor": {
    transcript:
      "In the subfloor now. Evidence of old termite workings to the central bearer, no live activity visible. Some moisture present on the ground, insufficient ventilation in the southern corner. A couple of floor joists look like they have minor rot at their ends near the bearer plate.",
    findings: [
      {
        title: "Past termite workings — subfloor bearer",
        wording:
          "Evidence of past termite workings was observed to a subfloor bearer. No live termite activity was noted at the time of inspection; however, this indicates the property has been subject to prior termite attack. A timber pest inspection is strongly recommended.",
        recommendation:
          "Engage a licensed pest controller to conduct a full timber pest inspection and recommend an appropriate treatment and monitoring program.",
        tags: ["termite risk", "pest evidence", "structural"],
        severity: "pest",
        section: "pest_findings",
      },
      {
        title: "Elevated moisture and poor ventilation — subfloor",
        wording:
          "Elevated moisture levels were observed within the subfloor space, with insufficient ventilation noted in the southern corner. Inadequate ventilation and moisture can accelerate timber decay and attract timber pests.",
        recommendation:
          "Improve subfloor ventilation by installing additional vents. Consider a subfloor ventilation system if moisture issues persist. Address any sub-floor drainage issues contributing to moisture.",
        tags: ["moisture", "ventilation"],
        severity: "major",
        section: "major_defects",
      },
      {
        title: "Timber rot to floor joists",
        wording:
          "Minor timber rot was observed to the ends of several floor joists at the bearer plate. This is likely associated with elevated moisture within the subfloor.",
        recommendation:
          "Engage a structural engineer or licensed builder to assess the extent of decay and determine whether replacement of affected joists is required.",
        tags: ["structural", "moisture"],
        severity: "major",
        section: "major_defects",
      },
    ],
  },
  "Bathroom 1": {
    transcript:
      "Bathroom one. High moisture readings to the lower shower wall, tiles sounding hollow when tapped, likely waterproofing failure. Sealant around bath deteriorated and pulling away. Exhaust fan is there but doesn't seem very effective.",
    findings: [
      {
        title: "Elevated moisture — shower wall",
        wording:
          "Elevated moisture readings were detected to the lower shower wall. Tiles were noted to sound hollow when tapped, indicating possible delamination and waterproofing failure behind the tile substrate. If unaddressed, moisture penetration may cause significant damage to wall framing.",
        recommendation:
          "Engage a licensed waterproofing contractor to assess the shower recess. Full retiling and waterproofing may be required. Do not use the shower until assessed.",
        tags: ["moisture", "sealant"],
        severity: "major",
        section: "major_defects",
      },
      {
        title: "Deteriorated bath sealant",
        wording:
          "Sealant around the bath was observed to be deteriorated, cracked, and pulling away from surfaces. This allows water to penetrate behind wall linings.",
        recommendation:
          "Remove and replace deteriorated sealant with a suitable flexible sealant. Ensure all junctions between the bath and wall are fully sealed.",
        tags: ["sealant"],
        severity: "minor",
        section: "maintenance_items",
      },
    ],
  },
  "Kitchen": {
    transcript:
      "Kitchen. Sealant to sink area is deteriorating, pulling away from the bench. Cabinet under the sink has some water staining, probably a slow leak at some point. Exhaust rangehood works fine.",
    findings: [
      {
        title: "Deteriorated sealant — kitchen sink",
        wording:
          "Sealant around the kitchen sink was observed to be deteriorated and separating from the bench surface. This may allow water to penetrate behind and beneath the benchtop.",
        recommendation:
          "Remove and replace deteriorated sealant around the sink. Check for any underlying water damage to the substrate.",
        tags: ["sealant", "moisture"],
        severity: "minor",
        section: "maintenance_items",
      },
      {
        title: "Water staining to under-sink cabinet",
        wording:
          "Water staining was observed to the interior of the under-sink cabinet, indicating a past or ongoing leak. The source of the staining should be investigated.",
        recommendation:
          "Inspect all plumbing connections under the sink for leaks. Replace any defective waste or supply connections. Allow cabinet to dry thoroughly.",
        tags: ["moisture", "plumbing"],
        severity: "minor",
        section: "minor_defects",
      },
    ],
  },
  "Site drainage": {
    transcript:
      "Site drainage. Standing water in the rear yard adjacent to the back fence line, clearly pooling after rain. Ground slopes slightly toward the house on the east side, not ideal. Downpipes discharge onto the ground, no drainage connection.",
    findings: [
      {
        title: "Poor site drainage — rear boundary",
        wording:
          "Evidence of inadequate site drainage was observed adjacent to the rear fence line, with visible water pooling following recent rainfall. Poor drainage may contribute to subfloor moisture, footing movement, and structural issues.",
        recommendation:
          "Improve site drainage by regrading ground levels away from the structure. Consider installation of surface or subsurface drainage. Consult a landscaper or civil contractor.",
        tags: ["drainage"],
        severity: "minor",
        section: "minor_defects",
      },
      {
        title: "Unconnected downpipes — surface discharge",
        wording:
          "Downpipes were found to discharge directly onto the ground surface rather than connecting to an underground drainage system. This concentrates stormwater adjacent to the structure and may contribute to footing movement.",
        recommendation:
          "Connect all downpipes to appropriate stormwater drainage. Engage a licensed plumber or drainage contractor.",
        tags: ["drainage", "plumbing"],
        severity: "minor",
        section: "maintenance_items",
      },
    ],
  },
  "Fencing": {
    transcript:
      "Fencing. Western boundary timber fence is in poor shape — posts rotting at the base, a few panels leaning or fallen. Eastern side colourbond is fine. Rear fence seems okay.",
    findings: [
      {
        title: "Deteriorated timber fencing — western boundary",
        wording:
          "Timber fencing along the western boundary was found to be in a deteriorated condition, with evidence of rot at the base of posts and several panels leaning or displaced. The fencing is approaching the end of its serviceable life.",
        recommendation:
          "Engage a fencing contractor to replace deteriorated posts and panels as required. Obtain a quotation for full replacement if necessary.",
        tags: ["fencing", "general maintenance"],
        severity: "minor",
        section: "maintenance_items",
      },
    ],
  },
};

interface MockFindingSpec {
  title: string;
  wording: string;
  recommendation: string;
  tags: string[];
  severity: Severity;
  section: ReportSection;
}

function mockGroupSession(input: SessionGroupInput): Finding[] {
  const { session } = input;
  const now = new Date().toISOString();

  // Check if we have demo data for this area
  const demoData = DEMO_TRANSCRIPTS[session.areaName];

  if (demoData) {
    // Use realistic demo findings, attaching any session photos
    return demoData.findings.map((spec, i) => {
      // Distribute photos across findings
      const sessionPhotos = session.photos || [];
      const photosForFinding = sessionPhotos
        .slice(i * 2, i * 2 + 2)
        .map((p) => ({
          id: p.id,
          dataUrl: p.dataUrl,
          capturedAt: p.capturedAt,
          fileName: p.fileName,
        } as CapturedPhoto));

      return {
        id: generateId(),
        areaName: session.areaName,
        photos: photosForFinding,
        textNote: spec.wording.split(".")[0] + ".",
        tags: spec.tags,
        severity: spec.severity,
        capturedAt: now,
        sourceSessionId: session.id,
        aiTitle: spec.title,
        aiProfessionalWording: spec.wording,
        aiRecommendation: spec.recommendation,
        aiSuggestedSection: spec.section,
        aiProcessed: true,
        reportSection: spec.section,
        finalTitle: spec.title,
        finalWording: spec.wording,
        finalRecommendation: spec.recommendation,
        excludeFromReport: false,
      };
    });
  }

  // Fallback: generate findings from markers and transcript
  return generateFromMarkersAndTranscript(session, now);
}

function generateFromMarkersAndTranscript(
  session: AreaCaptureSession,
  now: string
): Finding[] {
  const { markers, photos, transcript, areaName } = session;

  if (markers.length === 0 && !transcript) {
    // No content — return one generic finding
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

  // Create one finding per marker, plus one for any general transcript content
  const findings: Finding[] = markers.map((marker, i) => {
    const severity = marker.severityHint || "minor";
    const tags = marker.tagHint ? [marker.tagHint] : [];

    // Assign photos near this marker's timestamp
    const nearbyPhotos = (photos || [])
      .filter((p) => Math.abs(p.timestampSeconds - marker.timestampSeconds) < 30)
      .slice(0, 2)
      .map((p) => ({ id: p.id, dataUrl: p.dataUrl, capturedAt: p.capturedAt } as CapturedPhoto));

    const sectionMap: Record<Severity, ReportSection> = {
      minor: "minor_defects",
      major: "major_defects",
      safety: "safety_hazards",
      monitor: "minor_defects",
      pest: "pest_findings",
    };

    return {
      id: generateId(),
      areaName,
      photos: nearbyPhotos,
      tags,
      severity,
      capturedAt: now,
      sourceSessionId: session.id,
      aiTitle: `Issue ${i + 1} — ${areaName}`,
      aiProfessionalWording:
        `A defect was identified in the ${areaName}${tags.length ? ` relating to ${tags.join(", ")}` : ""}. ` +
        `Further assessment and rectification by a suitably qualified tradesperson is recommended.`,
      aiRecommendation: `Engage a qualified tradesperson to assess and rectify the identified issue.`,
      aiSuggestedSection: sectionMap[severity],
      aiProcessed: true,
      reportSection: sectionMap[severity],
      finalTitle: `Issue ${i + 1} — ${areaName}`,
      finalWording: `A defect was identified in the ${areaName}. Refer to photographic record for detail.`,
      finalRecommendation: `Engage a qualified tradesperson to assess and rectify.`,
      excludeFromReport: false,
    };
  });

  return findings;
}
