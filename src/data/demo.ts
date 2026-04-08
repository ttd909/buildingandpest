import { Inspection, Finding, InspectionArea, AreaCaptureSession, SessionPhoto, CapturedPhoto } from "@/types";

const uid = (prefix: string, n: number | string) => `${prefix}-demo-${n}`;

// ─── Placeholder SVG photos ───────────────────────────────────────────────────

function makeSvgPhoto(
  id: string,
  bg: string,
  label: string,
  ts: number,
  capturedAt: string
): SessionPhoto {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <rect width="400" height="300" fill="${bg}"/>
    <rect x="120" y="80" width="160" height="120" rx="12" fill="rgba(0,0,0,0.08)"/>
    <text x="200" y="200" text-anchor="middle" fill="rgba(0,0,0,0.4)" font-size="13" font-family="sans-serif">${label}</text>
  </svg>`;
  return {
    id,
    dataUrl: "data:image/svg+xml;base64," + btoa(svg),
    timestampSeconds: ts,
    capturedAt,
    fileName: `${label.replace(/\s/g, "_")}.jpg`,
  };
}

function toPhoto(sp: SessionPhoto): CapturedPhoto {
  return { id: sp.id, dataUrl: sp.dataUrl, capturedAt: sp.capturedAt, fileName: sp.fileName };
}

const BASE = Date.now() - 7200000;
const t = (offset: number) => new Date(BASE + offset).toISOString();

// ─── Demo inspection 1 sessions ───────────────────────────────────────────────

const roofSession: AreaCaptureSession = {
  id: uid("session", "roof1"),
  areaName: "Roof exterior",
  startedAt: t(0),
  endedAt: t(240000),
  status: "done",
  transcript:
    "Right, up on the roof now. Loose flashing at the chimney junction, definitely a concern — could allow water in. Several cracked tiles on the south-facing slope. Ridge capping mortar looks weathered in sections. Some moss growth on the southern side.",
  transcriptStatus: "done",
  markers: [
    { id: uid("marker", 1), timestampSeconds: 18, severityHint: "major", tagHint: "roofing" },
    { id: uid("marker", 2), timestampSeconds: 75, severityHint: "major", tagHint: "roofing" },
  ],
  photos: [
    makeSvgPhoto(uid("sp", 1), "#fef3c7", "Roof flashing", 22, t(22000)),
    makeSvgPhoto(uid("sp", 2), "#fee2e2", "Cracked tiles", 80, t(80000)),
  ],
};

const subfloorSession: AreaCaptureSession = {
  id: uid("session", "sub1"),
  areaName: "Subfloor",
  startedAt: t(300000),
  endedAt: t(600000),
  status: "done",
  transcript:
    "Subfloor. Evidence of old termite workings on the central bearer — no live activity visible but definitely a history. Moisture on the ground, insufficient ventilation in the southern corner. A couple of floor joists have minor rot at the ends near the bearer plate.",
  transcriptStatus: "done",
  markers: [
    { id: uid("marker", 3), timestampSeconds: 25, severityHint: "pest", tagHint: "termite risk" },
    { id: uid("marker", 4), timestampSeconds: 90, severityHint: "major", tagHint: "moisture" },
    { id: uid("marker", 5), timestampSeconds: 150, severityHint: "major", tagHint: "structural" },
  ],
  photos: [
    makeSvgPhoto(uid("sp", 3), "#dcfce7", "Subfloor access", 30, t(330000)),
    makeSvgPhoto(uid("sp", 4), "#fce7f3", "Termite workings", 95, t(395000)),
  ],
};

const bathroomSession: AreaCaptureSession = {
  id: uid("session", "bath1"),
  areaName: "Bathroom 1",
  startedAt: t(650000),
  endedAt: t(840000),
  status: "done",
  transcript:
    "Bathroom one. High moisture readings to the lower shower wall, tiles sounding hollow — likely waterproofing failure. Sealant around the bath is deteriorated and pulling away. Exhaust fan works but seems underpowered.",
  transcriptStatus: "done",
  markers: [
    { id: uid("marker", 6), timestampSeconds: 20, severityHint: "major", tagHint: "moisture" },
    { id: uid("marker", 7), timestampSeconds: 85, severityHint: "minor", tagHint: "sealant" },
  ],
  photos: [
    makeSvgPhoto(uid("sp", 5), "#fee2e2", "Moisture reading", 25, t(675000)),
    makeSvgPhoto(uid("sp", 6), "#fef3c7", "Bath sealant", 88, t(738000)),
  ],
};

const frontSession: AreaCaptureSession = {
  id: uid("session", "front1"),
  areaName: "Front exterior",
  startedAt: t(900000),
  endedAt: t(1080000),
  status: "done",
  transcript:
    "Front exterior. Gutters blocked with leaf litter, significant buildup. Minor cracks to brick veneer on the left side — probably just settlement. Concrete path to front door has a significant crack, trip hazard.",
  transcriptStatus: "done",
  markers: [
    { id: uid("marker", 8), timestampSeconds: 15, severityHint: "minor", tagHint: "gutters" },
    { id: uid("marker", 9), timestampSeconds: 60, severityHint: "monitor", tagHint: "cracking" },
    { id: uid("marker", 10), timestampSeconds: 100, severityHint: "safety", tagHint: "safety" },
  ],
  photos: [
    makeSvgPhoto(uid("sp", 7), "#e2e8f0", "Front elevation", 20, t(920000)),
    makeSvgPhoto(uid("sp", 8), "#dbeafe", "Blocked gutters", 65, t(965000)),
  ],
};

const drainageSession: AreaCaptureSession = {
  id: uid("session", "drain1"),
  areaName: "Site drainage",
  startedAt: t(1100000),
  endedAt: t(1260000),
  status: "done",
  transcript:
    "Site drainage. Standing water near the back fence — pooling after rain. Ground slopes slightly toward the house on the east side. Downpipes discharge onto the ground, no underground connection.",
  transcriptStatus: "done",
  markers: [
    { id: uid("marker", 11), timestampSeconds: 20, severityHint: "minor", tagHint: "drainage" },
    { id: uid("marker", 12), timestampSeconds: 90, severityHint: "minor", tagHint: "drainage" },
  ],
  photos: [
    makeSvgPhoto(uid("sp", 9), "#dbeafe", "Water pooling", 25, t(1125000)),
  ],
};

const fencingSession: AreaCaptureSession = {
  id: uid("session", "fence1"),
  areaName: "Fencing",
  startedAt: t(1300000),
  endedAt: t(1440000),
  status: "done",
  transcript:
    "Fencing. Western boundary timber fence in poor shape — posts rotting at the base, a few panels leaning or fallen. Eastern colourbond is fine. Rear boundary okay.",
  transcriptStatus: "done",
  markers: [
    { id: uid("marker", 13), timestampSeconds: 18, severityHint: "minor", tagHint: "fencing" },
  ],
  photos: [
    makeSvgPhoto(uid("sp", 10), "#f3f4f6", "Fence deterioration", 20, t(1320000)),
  ],
};

// ─── Demo findings (pre-generated from sessions) ─────────────────────────────

const demoFindings1: Finding[] = [
  {
    id: uid("finding", 1),
    areaName: "Roof exterior",
    photos: [toPhoto(roofSession.photos[0])],
    tags: ["roofing", "moisture"],
    severity: "major",
    capturedAt: t(18000),
    sourceSessionId: roofSession.id,
    aiTitle: "Loose roof flashing — chimney junction",
    aiProfessionalWording:
      "Loose roof flashing was observed at the chimney junction. This condition may allow water penetration into the roof space and internal wall linings. Rectification is recommended prior to or during the next wet season.",
    aiRecommendation:
      "Engage a licensed roofing contractor to re-secure and re-seal the flashing at the chimney junction. Inspect surrounding roof cladding for signs of water ingress.",
    aiSuggestedSection: "major_defects",
    aiProcessed: true,
    reportSection: "major_defects",
    finalTitle: "Loose roof flashing — chimney junction",
    finalWording:
      "Loose roof flashing was observed at the chimney junction. This condition may allow water penetration into the roof space and internal wall linings.",
    finalRecommendation:
      "Engage a licensed roofing contractor to re-secure and re-seal the flashing. Inspect for signs of water ingress.",
    excludeFromReport: false,
  },
  {
    id: uid("finding", 2),
    areaName: "Roof exterior",
    photos: [toPhoto(roofSession.photos[1])],
    tags: ["roofing"],
    severity: "major",
    capturedAt: t(75000),
    sourceSessionId: roofSession.id,
    aiTitle: "Cracked roof tiles — south-facing slope",
    aiProfessionalWording:
      "Several cracked roof tiles were observed on the south-facing slope. Cracked tiles can allow water ingress into the roof space and may cause damage to ceiling linings if not addressed.",
    aiRecommendation:
      "Engage a licensed roofing contractor to replace cracked tiles and inspect for additional damage.",
    aiSuggestedSection: "major_defects",
    aiProcessed: true,
    reportSection: "major_defects",
    finalTitle: "Cracked roof tiles — south-facing slope",
    finalWording:
      "Several cracked roof tiles were observed on the south-facing slope. This may allow water ingress into the roof space.",
    finalRecommendation:
      "Engage a licensed roofing contractor to replace cracked tiles.",
    excludeFromReport: false,
  },
  {
    id: uid("finding", 3),
    areaName: "Subfloor",
    photos: [toPhoto(subfloorSession.photos[1])],
    tags: ["termite risk", "pest evidence", "structural"],
    severity: "pest",
    capturedAt: t(325000),
    sourceSessionId: subfloorSession.id,
    aiTitle: "Past termite workings — subfloor bearer",
    aiProfessionalWording:
      "Evidence of past termite workings was observed to a subfloor bearer. No live termite activity was noted at the time of inspection; however, this indicates the property has been subject to termite attack. A timber pest inspection is strongly recommended.",
    aiRecommendation:
      "Engage a licensed pest controller to conduct a full timber pest inspection and recommend an appropriate treatment and monitoring program.",
    aiSuggestedSection: "pest_findings",
    aiProcessed: true,
    reportSection: "pest_findings",
    finalTitle: "Past termite activity — subfloor bearer",
    finalWording:
      "Evidence of past termite workings was observed to a subfloor bearer. No live activity noted at inspection. A timber pest inspection is strongly recommended.",
    finalRecommendation:
      "Engage a licensed pest controller to conduct a full timber pest inspection and recommend treatment.",
    excludeFromReport: false,
  },
  {
    id: uid("finding", 4),
    areaName: "Subfloor",
    photos: [toPhoto(subfloorSession.photos[0])],
    tags: ["moisture", "ventilation"],
    severity: "major",
    capturedAt: t(390000),
    sourceSessionId: subfloorSession.id,
    aiTitle: "Elevated moisture and poor ventilation — subfloor",
    aiProfessionalWording:
      "Elevated moisture levels were observed within the subfloor space, with insufficient ventilation noted in the southern corner. Inadequate ventilation and moisture can accelerate timber decay and attract timber pests.",
    aiRecommendation:
      "Improve subfloor ventilation by installing additional vents. Consider a subfloor ventilation system. Address drainage issues contributing to moisture.",
    aiSuggestedSection: "major_defects",
    aiProcessed: true,
    reportSection: "major_defects",
    finalTitle: "Elevated moisture and poor ventilation — subfloor",
    finalWording:
      "Elevated moisture levels and insufficient ventilation were observed in the subfloor. This may accelerate timber decay and attract pests.",
    finalRecommendation:
      "Improve subfloor ventilation. Address drainage issues contributing to moisture ingress.",
    excludeFromReport: false,
  },
  {
    id: uid("finding", 5),
    areaName: "Bathroom 1",
    photos: [toPhoto(bathroomSession.photos[0])],
    tags: ["moisture", "sealant"],
    severity: "major",
    capturedAt: t(675000),
    sourceSessionId: bathroomSession.id,
    aiTitle: "Elevated moisture — shower wall",
    aiProfessionalWording:
      "Elevated moisture readings were detected to the lower shower wall. Tiles were noted to sound hollow when tapped, indicating possible delamination and waterproofing failure. If unaddressed, moisture penetration may cause significant damage to wall framing.",
    aiRecommendation:
      "Engage a licensed waterproofing contractor to assess the shower recess. Full retiling and waterproofing may be required.",
    aiSuggestedSection: "major_defects",
    aiProcessed: true,
    reportSection: "major_defects",
    finalTitle: "Elevated moisture — shower wall, Bathroom 1",
    finalWording:
      "Elevated moisture readings were detected to the lower shower wall. Hollow-sounding tiles indicate possible waterproofing failure.",
    finalRecommendation:
      "Engage a licensed waterproofing contractor. Full retiling and waterproofing may be required.",
    excludeFromReport: false,
  },
  {
    id: uid("finding", 6),
    areaName: "Bathroom 1",
    photos: [toPhoto(bathroomSession.photos[1])],
    tags: ["sealant"],
    severity: "minor",
    capturedAt: t(738000),
    sourceSessionId: bathroomSession.id,
    aiTitle: "Deteriorated bath sealant",
    aiProfessionalWording:
      "Sealant around the bath was observed to be deteriorated, cracked, and pulling away from surfaces. This allows water to penetrate behind wall linings.",
    aiRecommendation:
      "Remove and replace deteriorated sealant with a suitable flexible sealant product.",
    aiSuggestedSection: "maintenance_items",
    aiProcessed: true,
    reportSection: "maintenance_items",
    finalTitle: "Deteriorated bath sealant",
    finalWording:
      "Bath sealant was found to be deteriorated and pulling away. Water may penetrate behind wall linings.",
    finalRecommendation: "Remove and replace sealant. Check for underlying water damage.",
    excludeFromReport: false,
    estimatedCost: "$80 - $150",
  },
  {
    id: uid("finding", 7),
    areaName: "Front exterior",
    photos: [toPhoto(frontSession.photos[1])],
    tags: ["gutters", "general maintenance"],
    severity: "minor",
    capturedAt: t(915000),
    sourceSessionId: frontSession.id,
    aiTitle: "Blocked gutters — front elevation",
    aiProfessionalWording:
      "Gutters at the front elevation were found blocked with accumulated leaf litter. Overflowing gutters can direct water into wall cavities and saturate footings.",
    aiRecommendation:
      "Clean all gutters and downpipes. Consider gutter guard installation.",
    aiSuggestedSection: "maintenance_items",
    aiProcessed: true,
    reportSection: "maintenance_items",
    finalTitle: "Blocked gutters — front elevation",
    finalWording:
      "Gutters at the front elevation were blocked with leaf debris. Overflow may saturate wall cavities and footings.",
    finalRecommendation: "Clean gutters and downpipes. Consider gutter guard.",
    excludeFromReport: false,
    estimatedCost: "$150 - $300",
  },
  {
    id: uid("finding", 8),
    areaName: "Front exterior",
    photos: [],
    tags: ["safety"],
    severity: "safety",
    capturedAt: t(1000000),
    sourceSessionId: frontSession.id,
    aiTitle: "Cracked concrete path — trip hazard",
    aiProfessionalWording:
      "A significant crack was observed to the concrete path at the front entry, presenting a potential trip hazard for occupants and visitors.",
    aiRecommendation:
      "Repair or replace the affected section. Ensure surface is level and free of trip hazards.",
    aiSuggestedSection: "safety_hazards",
    aiProcessed: true,
    reportSection: "safety_hazards",
    finalTitle: "Cracked concrete path — trip hazard",
    finalWording:
      "A significant crack to the front entry path presents a potential trip hazard.",
    finalRecommendation:
      "Repair or replace the cracked section of path as a priority.",
    excludeFromReport: false,
    estimatedCost: "$200 - $400",
  },
  {
    id: uid("finding", 9),
    areaName: "Site drainage",
    photos: [toPhoto(drainageSession.photos[0])],
    tags: ["drainage"],
    severity: "minor",
    capturedAt: t(1120000),
    sourceSessionId: drainageSession.id,
    aiTitle: "Poor site drainage — rear boundary",
    aiProfessionalWording:
      "Evidence of inadequate site drainage was observed adjacent to the rear fence line, with visible water pooling. Poor drainage may contribute to subfloor moisture and footing movement.",
    aiRecommendation:
      "Improve site drainage by regrading and/or installing surface drains. Consult a landscaper or civil contractor.",
    aiSuggestedSection: "minor_defects",
    aiProcessed: true,
    reportSection: "minor_defects",
    finalTitle: "Poor site drainage — rear boundary",
    finalWording:
      "Water pooling observed adjacent to the rear boundary. May contribute to subfloor moisture and footing movement.",
    finalRecommendation:
      "Regrade site or install drainage. Consult a landscaper or drainage contractor.",
    excludeFromReport: false,
  },
  {
    id: uid("finding", 10),
    areaName: "Fencing",
    photos: [toPhoto(fencingSession.photos[0])],
    tags: ["fencing", "general maintenance"],
    severity: "minor",
    capturedAt: t(1320000),
    sourceSessionId: fencingSession.id,
    aiTitle: "Deteriorated timber fencing — western boundary",
    aiProfessionalWording:
      "Timber fencing along the western boundary was found to be in a deteriorated condition, with evidence of rot at the base of posts and several panels leaning or displaced.",
    aiRecommendation:
      "Engage a fencing contractor to replace deteriorated posts and panels as required.",
    aiSuggestedSection: "maintenance_items",
    aiProcessed: true,
    reportSection: "maintenance_items",
    finalTitle: "Deteriorated timber fencing — western boundary",
    finalWording:
      "Western boundary fencing shows rot at post bases and displaced panels. Nearing end of serviceable life.",
    finalRecommendation: "Engage a fencing contractor to assess and replace as required.",
    excludeFromReport: false,
    estimatedCost: "$1,800 - $3,500",
  },
];

// ─── Build areas from findings + sessions ─────────────────────────────────────

function buildArea(
  id: string,
  name: string,
  order: number,
  findings: Finding[],
  session?: AreaCaptureSession
): InspectionArea {
  return { id, name, isCustom: false, order, findings, session };
}

const demo1Areas: InspectionArea[] = [
  buildArea(
    uid("area", 1), "Front exterior", 0,
    demoFindings1.filter((f) => f.areaName === "Front exterior"),
    frontSession
  ),
  buildArea(uid("area", 2), "Rear exterior", 1, []),
  buildArea(
    uid("area", 3), "Roof exterior", 2,
    demoFindings1.filter((f) => f.areaName === "Roof exterior"),
    roofSession
  ),
  buildArea(uid("area", 4), "Roof void", 3, []),
  buildArea(
    uid("area", 5), "Subfloor", 4,
    demoFindings1.filter((f) => f.areaName === "Subfloor"),
    subfloorSession
  ),
  buildArea(uid("area", 6), "Interior", 5, []),
  buildArea(uid("area", 7), "Kitchen", 6, []),
  buildArea(uid("area", 8), "Laundry", 7, []),
  buildArea(
    uid("area", 9), "Bathroom 1", 8,
    demoFindings1.filter((f) => f.areaName === "Bathroom 1"),
    bathroomSession
  ),
  buildArea(uid("area", 10), "Bathroom 2", 9, []),
  buildArea(uid("area", 11), "Bedrooms", 10, []),
  buildArea(uid("area", 12), "Living areas", 11, []),
  buildArea(uid("area", 13), "Garage", 12, []),
  buildArea(
    uid("area", 14), "Site drainage", 13,
    demoFindings1.filter((f) => f.areaName === "Site drainage"),
    drainageSession
  ),
  buildArea(
    uid("area", 15), "Fencing", 14,
    demoFindings1.filter((f) => f.areaName === "Fencing"),
    fencingSession
  ),
  buildArea(uid("area", 16), "Pest evidence", 15, []),
  buildArea(uid("area", 17), "Other", 16, []),
];

const demo2Areas: InspectionArea[] = [
  buildArea(uid("area", 20), "Interior", 0, []),
  buildArea(uid("area", 21), "Kitchen", 1, [
    {
      id: uid("finding", 20),
      areaName: "Kitchen",
      photos: [],
      tags: ["sealant", "moisture"],
      severity: "minor",
      capturedAt: new Date(Date.now() - 86400000).toISOString(),
      aiProcessed: false,
      excludeFromReport: false,
    },
  ]),
  buildArea(uid("area", 22), "Bathroom 1", 2, [
    {
      id: uid("finding", 21),
      areaName: "Bathroom 1",
      photos: [],
      tags: ["cracking"],
      severity: "monitor",
      capturedAt: new Date(Date.now() - 86400000).toISOString(),
      aiProcessed: false,
      excludeFromReport: false,
    },
  ]),
];

// ─── Exported demo inspections ────────────────────────────────────────────────

export const DEMO_INSPECTIONS: Inspection[] = [
  {
    id: "insp-demo-1",
    propertyAddress: "14 Banksia Court, Mitcham VIC 3132",
    clientName: "James & Sarah Thornton",
    clientEmail: "j.thornton@email.com.au",
    inspectionDate: new Date(Date.now() - 7200000).toISOString().split("T")[0],
    inspectionType: "combined",
    propertyType: "house",
    notes: "Pre-purchase inspection. Vendors disclosed previous termite treatment approx. 5 years ago.",
    status: "ready_for_review",
    areas: demo1Areas,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    executiveSummary:
      "This combined building and pest inspection was conducted at 14 Banksia Court, Mitcham VIC 3132. The property is a single storey brick veneer dwelling of approximately 30 years of age. Several items of significance were identified including loose roof flashing, cracked roof tiles, elevated moisture to the shower wall in Bathroom 1, evidence of past termite activity in the subfloor, and general maintenance items. These findings are detailed in full within this report and should be reviewed carefully prior to proceeding with the purchase.",
    companyName: "ProInspect Building & Pest",
    inspectorDetails: {
      name: "Michael Davies",
      licenceNumber: "VIC-BLD-04521",
      company: "ProInspect Building & Pest",
      phone: "0412 345 678",
      email: "michael@proinspect.com.au",
    },
  },
  {
    id: "insp-demo-2",
    propertyAddress: "7/22 Lemon Tree Lane, Newtown NSW 2042",
    clientName: "Priya Sharma",
    clientEmail: "p.sharma@gmail.com",
    inspectionDate: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    inspectionType: "building",
    propertyType: "unit",
    notes: "Pre-purchase inspection on first floor unit.",
    status: "in_progress",
    areas: demo2Areas,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 43200000).toISOString(),
    companyName: "ProInspect Building & Pest",
    inspectorDetails: {
      name: "Michael Davies",
      licenceNumber: "VIC-BLD-04521",
      company: "ProInspect Building & Pest",
      phone: "0412 345 678",
      email: "michael@proinspect.com.au",
    },
  },
  {
    id: "insp-demo-3",
    propertyAddress: "88 Wattle Street, Hawthorn VIC 3122",
    clientName: "Tom & Linda Baker",
    clientEmail: "tom.baker@outlook.com",
    inspectionDate: new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0],
    inspectionType: "combined",
    propertyType: "house",
    status: "completed",
    areas: [],
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    companyName: "ProInspect Building & Pest",
    inspectorDetails: {
      name: "Michael Davies",
      licenceNumber: "VIC-BLD-04521",
      company: "ProInspect Building & Pest",
      phone: "0412 345 678",
      email: "michael@proinspect.com.au",
    },
    reportGeneratedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: "insp-demo-4",
    propertyAddress: "3 Ironbark Drive, Ringwood VIC 3134",
    clientName: "David Chen",
    clientEmail: "d.chen@hotmail.com",
    inspectionDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    inspectionType: "building",
    propertyType: "townhouse",
    status: "draft",
    areas: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    companyName: "ProInspect Building & Pest",
    inspectorDetails: {
      name: "Michael Davies",
      licenceNumber: "VIC-BLD-04521",
      company: "ProInspect Building & Pest",
      phone: "0412 345 678",
      email: "michael@proinspect.com.au",
    },
  },
];

export const DEMO_INSPECTOR = {
  name: "Michael Davies",
  email: "michael@proinspect.com.au",
  company: "ProInspect Building & Pest",
  licenceNumber: "VIC-BLD-04521",
  phone: "0412 345 678",
};
