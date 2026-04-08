import { NextRequest, NextResponse } from "next/server";
import { TranscriptSegment } from "@/types";

// Allow up to 60s for Whisper transcription
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  // Graceful degradation — no key means no transcription, app still works
  if (!apiKey) {
    return NextResponse.json({ transcript: "", segments: [] });
  }

  let audio: File | null = null;
  try {
    const formData = await req.formData();
    audio = formData.get("audio") as File | null;
  } catch {
    return NextResponse.json({ error: "Failed to parse form data" }, { status: 400 });
  }

  if (!audio || audio.size === 0) {
    return NextResponse.json({ error: "No audio provided" }, { status: 400 });
  }

  try {
    const whisperForm = new FormData();
    // Use the filename sent by the client (includes correct extension for format detection)
    whisperForm.append("file", audio, audio.name || "recording.webm");
    whisperForm.append("model", "whisper-1");
    whisperForm.append("response_format", "verbose_json");
    whisperForm.append("language", "en");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: whisperForm,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[transcribe] Whisper error:", res.status, err);
      // Surface quota/auth errors explicitly so client can show a message
      if (res.status === 401 || res.status === 402 || res.status === 429) {
        return NextResponse.json({ transcript: "", segments: [], error: res.status === 401 ? "invalid_key" : "quota_exceeded" });
      }
      return NextResponse.json({ transcript: "", segments: [] });
    }

    const data = await res.json();

    // Whisper verbose_json returns segments with absolute start/end timestamps
    // (already in seconds from the beginning of the audio file = session start)
    const segments: TranscriptSegment[] = (data.segments ?? []).map(
      (s: { text: string; start: number; end: number }) => ({
        text: s.text.trim(),
        start: Math.round(s.start * 10) / 10,
        end: Math.round(s.end * 10) / 10,
      })
    );

    return NextResponse.json({ transcript: data.text ?? "", segments });
  } catch (err) {
    console.error("[transcribe] Unexpected error:", err);
    return NextResponse.json({ transcript: "", segments: [] });
  }
}
