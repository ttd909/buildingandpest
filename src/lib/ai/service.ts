/**
 * AI Service Layer for InspectFlow AI
 *
 * This module is scaffolded for easy connection to an LLM (e.g. Claude, GPT-4, Whisper).
 * Currently uses rule-based mock responses with realistic Australian inspection language.
 *
 * To connect a real AI:
 * - Replace `mockProcessFinding` with an API call to your LLM endpoint
 * - Replace `mockTranscribeAudio` with a call to Whisper or another STT API
 * - Replace `mockGenerateExecutiveSummary` with an LLM summarisation call
 */

import {
  AIProcessingInput,
  AIProcessingOutput,
  Finding,
  Inspection,
  ReportSection,
  Severity,
} from "@/types";

// ─── Transcription ────────────────────────────────────────────────────────────

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  // TODO: Connect to Whisper API
  // const formData = new FormData();
  // formData.append("file", audioBlob, "recording.webm");
  // formData.append("model", "whisper-1");
  // const res = await fetch("/api/transcribe", { method: "POST", body: formData });
  // const { transcript } = await res.json();
  // return transcript;

  // Simulate processing delay
  await delay(1200);
  return "[Transcription pending — connect speech-to-text service]";
}

// ─── Finding Processing ────────────────────────────────────────────────────────

export async function processFinding(
  input: AIProcessingInput
): Promise<AIProcessingOutput> {
  // TODO: Replace with real LLM call
  // const prompt = buildFindingPrompt(input);
  // const response = await callLLM(prompt);
  // return parseFindingResponse(response);

  await delay(800);
  return mockProcessFinding(input);
}

export async function processAllFindings(
  inspection: Inspection,
  onProgress?: (done: number, total: number) => void
): Promise<Finding[]> {
  const allFindings = inspection.areas.flatMap((a) => a.findings);
  const results: Finding[] = [];

  for (let i = 0; i < allFindings.length; i++) {
    const finding = allFindings[i];
    const output = await processFinding({
      areaName: finding.areaName,
      transcript: finding.voiceNote?.transcript,
      textNote: finding.textNote,
      tags: finding.tags,
      severity: finding.severity,
      inspectionType: inspection.inspectionType,
    });

    results.push({
      ...finding,
      aiTitle: output.title,
      aiProfessionalWording: output.professionalWording,
      aiRecommendation: output.recommendation,
      aiSuggestedSection: output.suggestedSection,
      aiProcessed: true,
      // Populate finals from AI if not already set
      finalTitle: finding.finalTitle || output.title,
      finalWording: finding.finalWording || output.professionalWording,
      finalRecommendation: finding.finalRecommendation || output.recommendation,
      reportSection: finding.reportSection || output.suggestedSection,
    });

    onProgress?.(i + 1, allFindings.length);
  }

  return results;
}

// ─── Executive Summary ─────────────────────────────────────────────────────────

export async function generateExecutiveSummary(
  inspection: Inspection
): Promise<string> {
  // TODO: Replace with real LLM call
  await delay(1000);
  return mockGenerateExecutiveSummary(inspection);
}

// ─── Mock implementations ──────────────────────────────────────────────────────

function mockProcessFinding(input: AIProcessingInput): AIProcessingOutput {
  const { areaName, transcript, textNote, tags, severity } = input;
  const rawText = [transcript, textNote].filter(Boolean).join(" ").toLowerCase();

  // Pattern matching to produce realistic Australian inspection language
  const patterns: Array<{
    match: (text: string, tags: string[]) => boolean;
    output: AIProcessingOutput;
  }> = [
    {
      match: (t, tags) => tags.includes("moisture") && tags.includes("sealant"),
      output: {
        title: `Elevated moisture readings — ${areaName}`,
        professionalWording: `Elevated moisture readings were detected in the ${areaName}. This is likely associated with failed or deteriorated sealant, grout, or waterproofing membrane. Without rectification, ongoing moisture penetration may cause damage to wall linings and framing.`,
        recommendation: `Engage a licensed tradesperson to investigate the source of moisture ingress. A waterproofing specialist should assess and rectify failed waterproofing and reseal affected junctions.`,
        suggestedSection: "major_defects",
        suggestedSeverity: severity || "major",
      },
    },
    {
      match: (t, tags) => tags.includes("termite risk") || tags.includes("pest evidence"),
      output: {
        title: `Evidence of termite activity — ${areaName}`,
        professionalWording: `Evidence of termite workings or conditions conducive to termite attack were observed in the ${areaName}. Termites are a significant risk to structural timbers and should be treated promptly.`,
        recommendation: `Engage a licensed pest controller to undertake a full timber pest inspection. Implement an appropriate treatment and management program as recommended.`,
        suggestedSection: "pest_findings",
        suggestedSeverity: "pest",
      },
    },
    {
      match: (t, tags) => tags.includes("roofing") || t.includes("flashing") || t.includes("roof"),
      output: {
        title: `Roof maintenance required — ${areaName}`,
        professionalWording: `Maintenance issues were identified to the roof covering or associated flashings in the ${areaName}. Defects in roof cladding or flashings can allow water penetration into the roof space and wall structure.`,
        recommendation: `Engage a licensed roofing contractor to inspect and carry out all necessary repairs. Ensure all flashings are secured and sealed, and roof cladding is in sound condition.`,
        suggestedSection: severity === "major" ? "major_defects" : "maintenance_items",
        suggestedSeverity: severity || "minor",
      },
    },
    {
      match: (t, tags) => tags.includes("gutters") || t.includes("gutter"),
      output: {
        title: `Blocked or defective gutters — ${areaName}`,
        professionalWording: `Gutters in the vicinity of the ${areaName} were found to be blocked with accumulated debris, or were defective. Overflowing gutters can cause water to enter wall cavities and wet areas around footings.`,
        recommendation: `Clean and clear all gutters and downpipes. Inspect for damage and replace as required. Consider installation of gutter guard to reduce future maintenance requirements.`,
        suggestedSection: "maintenance_items",
        suggestedSeverity: "minor",
      },
    },
    {
      match: (t, tags) => tags.includes("cracking") || t.includes("crack"),
      output: {
        title: `Cracking observed — ${areaName}`,
        professionalWording: `Cracking was observed to surfaces in the ${areaName}. ${
          severity === "major"
            ? "The nature and extent of cracking indicates structural movement and should be assessed by a structural engineer."
            : "The cracking appears consistent with normal building movement and settlement. It should be monitored for progression."
        }`,
        recommendation:
          severity === "major"
            ? `Engage a structural engineer to assess the cracking and provide advice on remediation.`
            : `Monitor cracking for any progression. Rectify cosmetically as part of general maintenance.`,
        suggestedSection: severity === "major" ? "major_defects" : "minor_defects",
        suggestedSeverity: severity || "monitor",
      },
    },
    {
      match: (t, tags) => tags.includes("drainage") || t.includes("drainage") || t.includes("pooling"),
      output: {
        title: `Poor site drainage — ${areaName}`,
        professionalWording: `Evidence of inadequate site drainage was observed in the vicinity of the ${areaName}. Water pooling adjacent to the structure may contribute to subfloor moisture, foundation movement, and deterioration of materials.`,
        recommendation: `Improve site drainage by regrading ground levels away from the structure and/or installing surface or subsurface drainage. Consult a landscaper or drainage contractor.`,
        suggestedSection: "minor_defects",
        suggestedSeverity: "minor",
      },
    },
    {
      match: (t, tags) => tags.includes("structural") || t.includes("structural"),
      output: {
        title: `Structural concern — ${areaName}`,
        professionalWording: `A structural concern was identified in the ${areaName}. This may affect the structural integrity of the building and should be assessed by a suitably qualified structural engineer.`,
        recommendation: `Engage a structural engineer to assess the identified structural concern and provide written advice regarding remediation requirements.`,
        suggestedSection: "major_defects",
        suggestedSeverity: "major",
      },
    },
    {
      match: (t, tags) => tags.includes("safety") || t.includes("safety"),
      output: {
        title: `Safety hazard identified — ${areaName}`,
        professionalWording: `A safety hazard was identified in the ${areaName}. This item poses a potential risk to the health and safety of occupants and should be rectified promptly.`,
        recommendation: `Rectify the safety hazard as a priority. Engage appropriate licensed trades as required.`,
        suggestedSection: "safety_hazards",
        suggestedSeverity: "safety",
      },
    },
    {
      match: (t, tags) => tags.includes("mould") || t.includes("mould") || t.includes("mold"),
      output: {
        title: `Mould growth present — ${areaName}`,
        professionalWording: `Mould growth was observed in the ${areaName}. The presence of mould is typically indicative of elevated moisture levels and inadequate ventilation. Mould can pose health risks to occupants.`,
        recommendation: `Identify and address the source of moisture contributing to mould growth. Engage a professional remediation contractor to safely remove mould. Improve ventilation in affected areas.`,
        suggestedSection: severity === "major" ? "major_defects" : "minor_defects",
        suggestedSeverity: severity || "minor",
      },
    },
    {
      match: (t, tags) => tags.includes("fencing") || t.includes("fence"),
      output: {
        title: `Fencing defects — ${areaName}`,
        professionalWording: `The fencing in the ${areaName} was found to be in a deteriorated or defective condition. Defective fencing may pose a safety risk and should be rectified.`,
        recommendation: `Engage a fencing contractor to inspect and carry out necessary repairs or replacement of deteriorated fencing components.`,
        suggestedSection: "maintenance_items",
        suggestedSeverity: "minor",
      },
    },
    {
      match: (t, tags) => tags.includes("sealant") || t.includes("sealant"),
      output: {
        title: `Deteriorated sealant — ${areaName}`,
        professionalWording: `Sealant in the ${areaName} was observed to be deteriorated, cracked, or separating from surfaces. Defective sealant can allow water ingress to adjacent building elements.`,
        recommendation: `Remove deteriorated sealant and re-apply using a suitable flexible sealant product. Ensure all junctions are properly sealed and waterproofed.`,
        suggestedSection: "maintenance_items",
        suggestedSeverity: "minor",
      },
    },
  ];

  // Find first matching pattern
  for (const pattern of patterns) {
    if (pattern.match(rawText, tags)) {
      return pattern.output;
    }
  }

  // Default fallback
  const sectionMap: Record<Severity, ReportSection> = {
    minor: "minor_defects",
    major: "major_defects",
    safety: "safety_hazards",
    monitor: "minor_defects",
    pest: "pest_findings",
  };

  return {
    title: `Defect noted — ${areaName}`,
    professionalWording:
      textNote ||
      transcript ||
      `A defect was identified in the ${areaName} requiring attention. Refer to the photographic record for further detail.`,
    recommendation: `Engage a suitably qualified tradesperson to assess and rectify the identified defect.`,
    suggestedSection: severity ? sectionMap[severity] : "minor_defects",
    suggestedSeverity: severity || "minor",
  };
}

function mockGenerateExecutiveSummary(inspection: Inspection): string {
  const allFindings = inspection.areas.flatMap((a) => a.findings);
  const major = allFindings.filter((f) => f.reportSection === "major_defects" && !f.excludeFromReport);
  const safety = allFindings.filter((f) => f.reportSection === "safety_hazards" && !f.excludeFromReport);
  const pest = allFindings.filter((f) => f.reportSection === "pest_findings" && !f.excludeFromReport);
  const minor = allFindings.filter((f) => f.reportSection === "minor_defects" && !f.excludeFromReport);
  const maintenance = allFindings.filter(
    (f) => f.reportSection === "maintenance_items" && !f.excludeFromReport
  );

  const typeLabel =
    inspection.inspectionType === "combined"
      ? "combined building and pest"
      : inspection.inspectionType === "building"
      ? "building"
      : "pest";

  const propLabel = {
    house: "dwelling",
    townhouse: "townhouse",
    unit: "unit",
    commercial: "commercial property",
  }[inspection.propertyType];

  let summary = `This ${typeLabel} inspection was conducted at ${inspection.propertyAddress}. The property is a ${propLabel}. `;

  if (major.length > 0 || safety.length > 0) {
    summary += `${major.length + safety.length} significant item${
      major.length + safety.length !== 1 ? "s" : ""
    } requiring attention ${
      major.length + safety.length !== 1 ? "were" : "was"
    } identified, including `;
    const highlights = [...major.slice(0, 2), ...safety.slice(0, 1)]
      .map((f) => (f.finalTitle || f.aiTitle || "defect").toLowerCase())
      .join(", ");
    summary += highlights + ". ";
  }

  if (pest.length > 0) {
    summary += `${pest.length} pest-related finding${pest.length !== 1 ? "s" : ""} ${
      pest.length !== 1 ? "were" : "was"
    } noted. `;
  }

  if (minor.length > 0 || maintenance.length > 0) {
    summary += `Additionally, ${minor.length + maintenance.length} minor or maintenance item${
      minor.length + maintenance.length !== 1 ? "s" : ""
    } ${minor.length + maintenance.length !== 1 ? "were" : "was"} recorded. `;
  }

  summary +=
    "All findings are detailed in full within this report. It is recommended that all significant items be reviewed carefully prior to any property transaction proceeding.";

  return summary;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
