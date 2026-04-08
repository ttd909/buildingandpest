import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are an Australian building and pest inspection report writer.
Given the inspector's spoken notes and optionally a photo of the defect, write concise professional report wording.

Rules:
- 2-3 sentences of formal Australian inspection report language
- Be specific to what is VISIBLE in the photo and/or described in the notes
- Describe the specific defect (e.g. "A missing door handle was observed" not "A defect was noted")
- Do not pad with generic filler like "further assessment is recommended" unless truly warranted
- The title should name the specific defect in 4-7 words
- Recommendation must be one actionable sentence

Respond ONLY with valid JSON — no markdown, no code fences:
{
  "title": "Specific defect title (4-7 words)",
  "wording": "2-3 sentence professional description.",
  "recommendation": "One clear action sentence.",
  "section": "major_defects | minor_defects | safety_hazards | maintenance_items | pest_findings"
}`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "no_key" });
  }

  let body: { focalContext?: string; areaName?: string; severity?: string; photoDataUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const { focalContext, areaName, severity, photoDataUrl } = body;

  const userContent: object[] = [
    {
      type: "text",
      text: [
        `Location: ${areaName ?? "unknown"}`,
        `Severity: ${severity ?? "minor"}`,
        `Inspector notes: ${focalContext?.trim() || "No spoken notes recorded."}`,
      ].join("\n"),
    },
  ];

  if (photoDataUrl && photoDataUrl.startsWith("data:image")) {
    userContent.push({
      type: "image_url",
      image_url: { url: photoDataUrl, detail: "low" },
    });
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        max_tokens: 400,
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[generate-finding] OpenAI error:", res.status, err);
      return NextResponse.json({ error: "api_error" });
    }

    const data = await res.json();
    const text: string = data.choices?.[0]?.message?.content ?? "";

    try {
      const parsed = JSON.parse(text);
      if (!parsed.title || !parsed.wording || !parsed.recommendation || !parsed.section) {
        throw new Error("incomplete");
      }
      return NextResponse.json(parsed);
    } catch {
      console.error("[generate-finding] Bad JSON from model:", text);
      return NextResponse.json({ error: "parse_error" });
    }
  } catch (err) {
    console.error("[generate-finding] Unexpected error:", err);
    return NextResponse.json({ error: "network_error" });
  }
}
