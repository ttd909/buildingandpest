"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Square, Play, Trash2 } from "lucide-react";
import { VoiceNote } from "@/types";
import { cn, formatDuration, generateId } from "@/lib/utils";

interface VoiceRecorderProps {
  voiceNote?: VoiceNote;
  onChange: (note: VoiceNote | undefined) => void;
}

export function VoiceRecorder({ voiceNote, onChange }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [waveformHeights, setWaveformHeights] = useState([3, 5, 4, 8, 6, 4, 7, 5, 3, 6]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveformRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (waveformRef.current) clearInterval(waveformRef.current);
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const blobUrl = URL.createObjectURL(blob);
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);

        onChange({
          id: generateId(),
          audioBlob: blob,
          audioBlobUrl: blobUrl,
          transcriptStatus: "pending",
          durationSeconds: elapsed,
          recordedAt: new Date().toISOString(),
        });
      };

      mr.start(100);
      startTimeRef.current = Date.now();
      setRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(Math.round((Date.now() - startTimeRef.current) / 1000));
      }, 500);

      // Animate waveform while recording
      waveformRef.current = setInterval(() => {
        setWaveformHeights(
          Array.from({ length: 10 }, () => Math.floor(Math.random() * 8) + 2)
        );
      }, 120);
    } catch (err) {
      console.error("Microphone access denied:", err);
      // Show a graceful fallback
      onChange({
        id: generateId(),
        transcriptStatus: "manual",
        transcript: "",
        recordedAt: new Date().toISOString(),
      });
    }
  }, [onChange]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (waveformRef.current) clearInterval(waveformRef.current);
    }
  }, [recording]);

  const clearNote = () => {
    if (voiceNote?.audioBlobUrl) {
      URL.revokeObjectURL(voiceNote.audioBlobUrl);
    }
    onChange(undefined);
    setDuration(0);
  };

  // Currently recording state
  if (recording) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 recording-pulse" />
            <span className="text-sm font-semibold text-red-700">Recording</span>
            <span className="text-sm text-red-500 tabular-nums">{formatDuration(duration)}</span>
          </div>
          <button
            onClick={stopRecording}
            className="flex items-center gap-1.5 bg-red-600 text-white rounded-xl px-4 py-2 text-sm font-semibold active:scale-95 transition-transform"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
            Stop
          </button>
        </div>
        {/* Waveform visualisation */}
        <div className="flex items-center justify-center gap-1 h-10">
          {waveformHeights.map((h, i) => (
            <div
              key={i}
              className="w-1.5 rounded-full bg-red-400 transition-all duration-100"
              style={{ height: `${h * 4}px` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Has a recorded note
  if (voiceNote) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Mic className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-800">Voice note</div>
              {voiceNote.durationSeconds && (
                <div className="text-xs text-slate-500">
                  {formatDuration(voiceNote.durationSeconds)}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {voiceNote.audioBlobUrl && (
              <audio src={voiceNote.audioBlobUrl} controls className="h-7 w-28 opacity-80" />
            )}
            <button
              onClick={clearNote}
              className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Transcript area */}
        {voiceNote.transcriptStatus === "pending" && (
          <div className="mt-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-xs text-amber-700">
              Transcription pending — connect a speech-to-text service to auto-transcribe, or add a note below.
            </p>
          </div>
        )}
        {voiceNote.transcript && (
          <p className="mt-2 text-sm text-slate-600 italic">"{voiceNote.transcript}"</p>
        )}
      </div>
    );
  }

  // Default — show record button
  return (
    <button
      onClick={startRecording}
      className={cn(
        "w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-slate-200",
        "hover:border-blue-300 hover:bg-blue-50 transition-colors text-left group"
      )}
    >
      <div className="w-12 h-12 bg-slate-100 group-hover:bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 transition-colors">
        <Mic className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" />
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">
          Tap to record voice note
        </div>
        <div className="text-xs text-slate-400 mt-0.5">
          Describe what you see — AI will process it
        </div>
      </div>
    </button>
  );
}
