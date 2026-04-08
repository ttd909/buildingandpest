"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic,
  Camera,
  Flag,
  Square,
  CheckCircle2,
  X,
  Trash2,
  Sparkles,
} from "lucide-react";
import { AreaCaptureSession, IssueMarker, SessionPhoto, Severity } from "@/types";
import { generateId, formatDuration, cn } from "@/lib/utils";

const SEVERITY_QUICK: { value: Severity; label: string; color: string }[] = [
  { value: "minor", label: "Minor", color: "bg-blue-500" },
  { value: "major", label: "Major", color: "bg-red-500" },
  { value: "safety", label: "Safety", color: "bg-amber-500" },
  { value: "pest", label: "Pest", color: "bg-pink-500" },
];

interface LiveAreaCaptureProps {
  areaName: string;
  existingSession?: AreaCaptureSession;
  onFinish: (session: AreaCaptureSession) => void;
  onCancel: () => void;
}

export function LiveAreaCapture({
  areaName,
  existingSession,
  onFinish,
  onCancel,
}: LiveAreaCaptureProps) {
  const sessionStart = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const cameraRef = useRef<HTMLInputElement>(null);
  const waveAnimRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [elapsed, setElapsed] = useState(0);
  const [recording, setRecording] = useState(false);
  const [recordingFailed, setRecordingFailed] = useState(false);
  const [micFailReason, setMicFailReason] = useState<"insecure" | "denied" | "unavailable" | null>(null);
  const [markers, setMarkers] = useState<IssueMarker[]>(existingSession?.markers ?? []);
  const [photos, setPhotos] = useState<SessionPhoto[]>(existingSession?.photos ?? []);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | undefined>(existingSession?.audioBlobUrl);
  const [waveHeights, setWaveHeights] = useState([3, 6, 4, 8, 5, 7, 3, 6, 4, 5]);
  // Flash state for visual feedback on marker tap
  const [markerFlash, setMarkerFlash] = useState(false);
  // Pending severity hint for last marker
  const [lastMarkerId, setLastMarkerId] = useState<string | null>(null);

  const getElapsed = useCallback(() => Math.round((Date.now() - sessionStart.current) / 1000), []);

  // Auto-start recording on mount
  useEffect(() => {
    startRecording();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (waveAnimRef.current) clearInterval(waveAnimRef.current);
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => stream.getTracks().forEach((t) => t.stop());

      mr.start(200);
      sessionStart.current = Date.now();
      setRecording(true);
      setElapsed(0);

      timerRef.current = setInterval(() => setElapsed(getElapsed()), 500);
      waveAnimRef.current = setInterval(() => {
        setWaveHeights(Array.from({ length: 10 }, () => Math.floor(Math.random() * 7) + 2));
      }, 100);
    } catch (err: unknown) {
      // Determine why mic failed so we can show a helpful message
      let reason: "insecure" | "denied" | "unavailable" = "unavailable";
      if (!window.isSecureContext) {
        reason = "insecure";
      } else if (err instanceof DOMException) {
        reason = err.name === "NotAllowedError" ? "denied" : "unavailable";
      }
      setMicFailReason(reason);
      setRecordingFailed(true);
      sessionStart.current = Date.now();
      setRecording(true);
      timerRef.current = setInterval(() => setElapsed(getElapsed()), 500);
    }
  };

  const handleMarkIssue = () => {
    const ts = getElapsed();
    const marker: IssueMarker = {
      id: generateId(),
      timestampSeconds: ts,
    };
    setMarkers((prev) => [...prev, marker]);
    setLastMarkerId(marker.id);
    // Flash feedback
    setMarkerFlash(true);
    setTimeout(() => setMarkerFlash(false), 400);
  };

  const handleSetMarkerHint = (markerId: string, severity: Severity) => {
    setMarkers((prev) =>
      prev.map((m) => m.id === markerId ? { ...m, severityHint: severity } : m)
    );
    setLastMarkerId(null);
  };

  const handleDeleteMarker = (markerId: string) => {
    setMarkers((prev) => prev.filter((m) => m.id !== markerId));
    if (lastMarkerId === markerId) setLastMarkerId(null);
  };

  const handlePhoto = (files: FileList | null) => {
    if (!files) return;
    const ts = getElapsed();
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setPhotos((prev) => [
          ...prev,
          {
            id: generateId(),
            dataUrl,
            timestampSeconds: ts,
            capturedAt: new Date().toISOString(),
            fileName: file.name,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    // Reset input so same file can be re-added
    if (cameraRef.current) cameraRef.current.value = "";
  };

  const handleFinish = async () => {
    // Stop recording
    if (mediaRecorderRef.current?.state === "recording") {
      await new Promise<void>((resolve) => {
        mediaRecorderRef.current!.onstop = () => resolve();
        mediaRecorderRef.current!.stop();
      });
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (waveAnimRef.current) clearInterval(waveAnimRef.current);

    let blobUrl = audioBlobUrl;
    if (!recordingFailed && chunksRef.current.length > 0) {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      blobUrl = URL.createObjectURL(blob);
    }

    const session: AreaCaptureSession = {
      id: existingSession?.id ?? generateId(),
      areaName,
      startedAt: new Date(Date.now() - elapsed * 1000).toISOString(),
      endedAt: new Date().toISOString(),
      status: "processing",
      audioBlobUrl: blobUrl,
      transcriptStatus: recordingFailed ? "none" : "pending",
      markers,
      photos,
    };

    onFinish(session);
  };

  const lastMarker = lastMarkerId ? markers.find((m) => m.id === lastMarkerId) : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      {/* Header strip */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 1rem)" }}>
        <button
          onClick={onCancel}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white/60 active:bg-white/20"
        >
          <X className="w-4.5 h-4.5" />
        </button>
        <div className="text-center">
          <p className="text-white font-bold text-base leading-none">{areaName}</p>
          {recording && !recordingFailed && (
            <p className="text-red-400 text-xs mt-0.5 font-medium">● Recording</p>
          )}
          {recordingFailed && (
            <p className="text-amber-400 text-xs mt-0.5">
              {micFailReason === "insecure"
                ? "⚠ Use HTTPS for mic — run: npm run dev"
                : micFailReason === "denied"
                ? "Mic denied — photos & markers only"
                : "Mic unavailable — photos & markers only"}
            </p>
          )}
        </div>
        <div className="w-9" />
      </div>

      {/* Timer + waveform */}
      <div className="flex flex-col items-center py-4 px-4">
        <span className="text-5xl font-bold text-white tabular-nums tracking-tight">
          {formatDuration(elapsed)}
        </span>

        {recording && !recordingFailed ? (
          <div className="flex items-end gap-0.5 h-8 mt-3">
            {waveHeights.map((h, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full bg-red-500 transition-all duration-75"
                style={{ height: `${h * 4}px` }}
              />
            ))}
          </div>
        ) : (
          <div className="h-8 mt-3" />
        )}
      </div>

      {/* Markers + photos timeline (scrollable) */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 min-h-0">
        {/* Photo strip */}
        {photos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar py-1">
            {photos.map((photo) => (
              <div key={photo.id} className="relative flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.dataUrl}
                  alt=""
                  className="w-16 h-16 rounded-xl object-cover border-2 border-white/10"
                />
                <span className="absolute bottom-0.5 left-0.5 text-white text-[9px] bg-black/50 rounded px-0.5">
                  {formatDuration(photo.timestampSeconds)}
                </span>
                <button
                  onClick={() => setPhotos((prev) => prev.filter((p) => p.id !== photo.id))}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Markers list */}
        {markers.map((marker, i) => (
          <div
            key={marker.id}
            className={cn(
              "flex items-center gap-3 bg-white/8 rounded-2xl px-3 py-2.5 transition-all",
              lastMarkerId === marker.id && "bg-amber-500/20 ring-1 ring-amber-500/40"
            )}
          >
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs",
              marker.severityHint === "major" ? "bg-red-500" :
              marker.severityHint === "safety" ? "bg-amber-500" :
              marker.severityHint === "pest" ? "bg-pink-500" :
              "bg-blue-500"
            )}>
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-xs tabular-nums">
                  {formatDuration(marker.timestampSeconds)}
                </span>
                {marker.severityHint && (
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    marker.severityHint === "major" ? "bg-red-500/20 text-red-300" :
                    marker.severityHint === "safety" ? "bg-amber-500/20 text-amber-300" :
                    marker.severityHint === "pest" ? "bg-pink-500/20 text-pink-300" :
                    "bg-blue-500/20 text-blue-300"
                  )}>
                    {marker.severityHint}
                  </span>
                )}
                <span className="text-white/40 text-xs">Issue marked</span>
              </div>
            </div>
            <button
              onClick={() => handleDeleteMarker(marker.id)}
              className="w-6 h-6 flex items-center justify-center text-white/30 hover:text-red-400 active:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {markers.length === 0 && photos.length === 0 && (
          <div className="text-center py-6">
            <p className="text-white/20 text-sm">Talk freely · take photos · mark issues</p>
          </div>
        )}
      </div>

      {/* Inline severity hint (non-blocking — appears after marking) */}
      {lastMarker && (
        <div className="px-4 py-2">
          <div className="bg-white/8 rounded-2xl px-3 py-2.5 flex items-center gap-2">
            <span className="text-white/50 text-xs flex-shrink-0">Quick hint:</span>
            <div className="flex gap-1.5 flex-1 overflow-x-auto hide-scrollbar">
              {SEVERITY_QUICK.map((s) => (
                <button
                  key={s.value}
                  onClick={() => handleSetMarkerHint(lastMarker.id, s.value)}
                  className={cn(
                    "flex-shrink-0 px-3 py-1 rounded-full text-white text-xs font-semibold active:scale-95 transition-transform",
                    s.color
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setLastMarkerId(null)}
              className="text-white/30 hover:text-white/60 flex-shrink-0 pl-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main action buttons */}
      <div className="px-4 pb-4 pt-2 space-y-3">
        {/* Mark Issue — the big one */}
        <button
          onClick={handleMarkIssue}
          className={cn(
            "w-full h-16 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg transition-all duration-150 active:scale-[0.97]",
            markerFlash
              ? "bg-amber-400 text-white scale-[0.97]"
              : "bg-white/12 text-white border border-white/20 hover:bg-white/18"
          )}
        >
          <Flag className={cn("w-5 h-5", markerFlash && "fill-white")} />
          Mark issue
        </button>

        {/* Photo + Finish row */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => cameraRef.current?.click()}
            className="h-14 rounded-2xl bg-white/10 text-white border border-white/15 font-semibold flex items-center justify-center gap-2 active:scale-[0.97] transition-transform text-base"
          >
            <Camera className="w-5 h-5" />
            Photo
            {photos.length > 0 && (
              <span className="ml-1 text-sm bg-white/20 rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {photos.length}
              </span>
            )}
          </button>
          <button
            onClick={handleFinish}
            className="h-14 rounded-2xl bg-blue-500 text-white font-bold flex items-center justify-center gap-2 active:scale-[0.97] transition-transform shadow-lg shadow-blue-500/30 text-base"
          >
            <Sparkles className="w-4.5 h-4.5" />
            Finish
          </button>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => handlePhoto(e.target.files)}
      />
    </div>
  );
}
