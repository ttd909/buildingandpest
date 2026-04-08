/**
 * test-whisper.js
 * Records 5 seconds of mic audio and sends it to OpenAI Whisper.
 * Run: node test-whisper.js
 * Requires: npm install openai node-record-lpcm16 dotenv
 * Requires SoX installed: winget install sox  (or choco install sox)
 */

require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const { OpenAI } = require("openai");
const recorder = require("node-record-lpcm16");

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("❌  OPENAI_API_KEY not found in .env.local");
  process.exit(1);
}

const openai = new OpenAI({ apiKey });
const outFile = path.join(__dirname, "_test-recording.wav");
const DURATION_MS = 5000;

console.log("\n🎤  Recording for 5 seconds — speak now!\n");

const fileStream = fs.createWriteStream(outFile, { encoding: "binary" });

const rec = recorder.record({
  sampleRate: 16000,
  channels: 1,
  audioType: "wav",
  recorder: "sox",
});

rec.stream().pipe(fileStream);

setTimeout(async () => {
  rec.stop();
  fileStream.end();

  // Small delay to let the file flush
  await new Promise((r) => setTimeout(r, 300));

  const size = fs.statSync(outFile).size;
  console.log(`✅  Recording saved (${(size / 1024).toFixed(1)} KB)\n`);
  console.log("📡  Sending to Whisper...\n");

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(outFile),
      model: "whisper-1",
      response_format: "verbose_json",
      language: "en",
    });

    console.log("📝  Transcript:");
    console.log("   ", transcription.text || "(empty — nothing heard)");

    if (transcription.segments?.length) {
      console.log("\n⏱   Segments:");
      transcription.segments.forEach((s) => {
        console.log(`   [${s.start.toFixed(1)}s – ${s.end.toFixed(1)}s]  ${s.text.trim()}`);
      });
    }
  } catch (err) {
    console.error("❌  Whisper error:", err.message);
    if (err.status === 401) console.error("    → API key is invalid or expired");
    if (err.status === 400) console.error("    → Audio file was rejected (bad format or too short)");
  } finally {
    fs.unlinkSync(outFile);
  }
}, DURATION_MS);
