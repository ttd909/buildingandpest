"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Flag, X, Trash2, Sparkles, Camera } from "lucide-react";
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
  const waveAnimRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [elapsed, setElapsed] = useState(0);
  const [recording, setRecording] = useState(false);
  const [recordingFailed, setRecordingFailed] = useState(false);
  const [micFailReason, setMicFailReason] = useState<"insecure" | "denied" | "unavailable" | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [markers, setMarkers] = useState<IssueMarker[]>(existingSession?.markers ?? []);
  const [photos, setPhotos] = useState<SessionPhoto[]>(existingSession?.photos ?? []);
  const [audioBlobUrl] = useState<string | undefined>(existingSession?.audioBlobUrl);
  const [waveHeights, setWaveHeights] = useState([3, 6, 4, 8, 5, 7, 3, 6, 4, 5]);
  const [markerFlash, setMarkerFlash] = useState(false);
  const [lastMarkerId, setLastMarkerId] = useState<string | null>(null);

  const getElapsed = useCallback(() => Math.round((Date.now() - sessionStart.current) / 1000), []);

  useEffect(() => {
    startRecording();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (waveAnimRef.current) clearInterval(waveAnimRef.current);
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      // Stop all camera + mic tracks
      videoStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = async () => {
    let stream: MediaStream | null = null;

    // Try to get audio + video together
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
    } catch {
      // Camera denied or unavailable — try audio only
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err: unknown) {
        let reason: "insecure" | "denied" | "unavailable" = "unavailable";
        if (!window.isSecureContext) reason = "insecure";
        else if (err instanceof DOMException) reason = err.name === "NotAllowedError" ? "denied" : "unavailable";
        setMicFailReason(reason);
        setRecordingFailed(true);
        sessionStart.current = Date.now();
        setRecording(true);
        timerRef.current = setInterval(() => setElapsed(getElapsed()), 500);
        return;
      }
    }

    videoStreamRef.current = stream;

    // Attach video stream to the video element
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack && videoRef.current) {
      videoRef.current.srcObject = new MediaStream([videoTrack]);
      setCameraReady(true);
    }

    // Record ONLY the audio track — keeps file small
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      setRecordingFailed(true);
      setMicFailReason("unavailable");
      sessionStart.current = Date.now();
      setRecording(true);
      timerRef.current = setInterval(() => setElapsed(getElapsed()), 500);
      return;
    }

    const audioStream = new MediaStream(audioTracks);
    const mr = new MediaRecorder(audioStream);
    mediaRecorderRef.current = mr;
    chunksRef.current = [];

    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = () => audioStream.getTracks().forEach((t) => t.stop());

    mr.start(200);
    sessionStart.current = Date.now();
    setRecording(true);
    setElapsed(0);

    timerRef.current = setInterval(() => setElapsed(getElapsed()), 500);
    waveAnimRef.current = setInterval(() => {
      setWaveHeights(Array.from({ length: 10 }, () => Math.floor(Math.random() * 7) + 2));
    }, 100);
  };

  /** Capture the current video frame as a SessionPhoto */
  const captureFrame = useCallback((ts: number): SessionPhoto | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2 || video.videoWidth === 0) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    return {
      id: generateId(),
      dataUrl,
      timestampSeconds: ts,
      capturedAt: new Date().toISOString(),
      fileName: `issue-${ts}s.jpg`,
    };
  }, []);

  const handleMarkIssue = () => {
    const ts = getElapsed();
    const marker: IssueMarker = { id: generateId(), timestampSeconds: ts };

    // Auto-capture camera frame for this marker
    const photo = captureFrame(ts);

    setMarkers((prev) => [...prev, marker]);
    if (photo) setPhotos((prev) => [...prev, photo]);
    setLastMarkerId(marker.id);
    setMarkerFlash(true);
    setTimeout(() => setMarkerFlash(false), 400);
  };

  const handleSetMarkerHint = (markerId: string, severity: Severity) => {
    setMarkers((prev) => prev.map((m) => (m.id === markerId ? { ...m, severityHint: severity } : m)));
    setLastMarkerId(null);
  };

  const handleDeleteMarker = (markerId: string) => {
    setMarkers((prev) => prev.filter((m) => m.id !== markerId));
    if (lastMarkerId === markerId) setLastMarkerId(null);
  };

  /** Secondary manual photo — captures from camera stream or file input fallback */
  const handleManualPhoto = () => {
    const ts = getElapsed();
    if (cameraReady) {
      const photo = captureFrame(ts);
      if (photo) {
        photo.fileName = `photo-${ts}s.jpg`;
        setPhotos((prev) => [...prev, photo]);
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileInput = (files: FileList | null) => {
    if (!files) return;
    const ts = getElapsed();
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setPhotos((prev) => [...prev, { id: generateId(), dataUrl, timestampSeconds: ts, capturedAt: new Date().toISOString(), fileName: file.name }]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFinish = async () => {
    if (mediaRecorderRef.current?.state === "recording") {
      await new Promise<void>((resolve) => {
        mediaRecorderRef.current!.onstop = () => resolve();
        mediaRecorderRef.current!.stop();
      });
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (waveAnimRef.current) clearInterval(waveAnimRef.current);
    videoStreamRef.current?.getTracks().forEach((t) => t.stop());

    let blobUrl = audioBlobUrl;
    if (!recordingFailed && chunksRef.current.length > 0) {
      const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mimeType });
      blobUrl = URL.createObjectURL(blob);
    }

    onFinish({
      id: existingSession?.id ?? generateId(),
      areaName,
      startedAt: new Date(Date.now() - elapsed * 1000).toISOString(),
      endedAt: new Date().toISOString(),
      status: "processing",
      audioBlobUrl: blobUrl,
      transcriptStatus: recordingFailed ? "none" : "pending",
      markers,
      photos,
    });
  };

  const lastMarker = lastMarkerId ? markers.find((m) => m.id === lastMarkerId) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* ── Live camera feed ── */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── Controls layer (floats above video) ── */}
      <div className="relative z-10 flex flex-col h-full">

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 pb-3 bg-gradient-to-b from-black/70 to-transparent"
          style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 1rem)" }}
        >
          <button
            onClick={onCancel}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/40 text-white/80 active:bg-black/60 backdrop-blur-sm"
          >
            <X className="w-4.5 h-4.5" />
          </button>

          <div className="text-center">
            <p className="text-white font-bold text-base leading-none drop-shadow">{areaName}</p>
            {recording && !recordingFailed && (
              <p className="text-red-400 text-xs mt-0.5 font-medium drop-shadow">● Recording</p>
            )}
            {recordingFailed && (
              <p className="text-amber-400 text-xs mt-0.5 drop-shadow">
                {micFailReason === "insecure"
                  ? "⚠ Use HTTPS for mic"
                  : micFailReason === "denied"
                  ? "Mic denied — markers only"
                  : "Mic unavailable — markers only"}
              </p>
            )}
          </div>

          {/* Timer top-right */}
          <div className="text-right">
            <span className="text-white font-bold text-lg tabular-nums drop-shadow">
              {formatDuration(elapsed)}
            </span>
            {recording && !recordingFailed && (
              <div className="flex items-end justify-end gap-0.5 h-4 mt-0.5">
                {waveHeights.slice(0, 5).map((h, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-red-400 transition-all duration-75"
                    style={{ height: `${h * 2}px` }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Spacer — viewfinder area (camera shows through) */}
        <div className="flex-1 min-h-0" />

        {/* Captured markers + photos — scrollable at bottom of viewfinder */}
        {(markers.length > 0 || photos.length > 0) && (
          <div className="px-3 pb-2 max-h-40 overflow-y-auto space-y-1.5">
            {/* Photo thumbnails strip */}
            {photos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto hide-scrollbar py-0.5">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.dataUrl}
                      alt=""
                      className="w-14 h-14 rounded-xl object-cover border-2 border-white/20"
                    />
                    <span className="absolute bottom-0.5 left-0.5 text-white text-[9px] bg-black/60 rounded px-0.5">
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

            {/* Marker rows */}
            {markers.map((marker, i) => (
              <div
                key={marker.id}
                className={cn(
                  "flex items-center gap-2.5 bg-black/50 backdrop-blur-sm rounded-2xl px-3 py-2 transition-all",
                  lastMarkerId === marker.id && "bg-amber-500/30 ring-1 ring-amber-400/50"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs",
                  marker.severityHint === "major" ? "bg-red-500" :
                  marker.severityHint === "safety" ? "bg-amber-500" :
                  marker.severityHint === "pest" ? "bg-pink-500" :
                  "bg-blue-500"
                )}>
                  {i + 1}
                </div>
                <span className="text-white/60 text-xs tabular-nums">{formatDuration(marker.timestampSeconds)}</span>
                {marker.severityHint && (
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full font-medium",
                    marker.severityHint === "major" ? "bg-red-500/20 text-red-300" :
                    marker.severityHint === "safety" ? "bg-amber-500/20 text-amber-300" :
                    marker.severityHint === "pest" ? "bg-pink-500/20 text-pink-300" :
                    "bg-blue-500/20 text-blue-300"
                  )}>
                    {marker.severityHint}
                  </span>
                )}
                <span className="text-white/30 text-xs flex-1">Issue + photo</span>
                <button
                  onClick={() => handleDeleteMarker(marker.id)}
                  className="w-5 h-5 flex items-center justify-center text-white/30 active:text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Severity hint strip */}
        {lastMarker && (
          <div className="px-4 py-2">
            <div className="bg-black/60 backdrop-blur-sm rounded-2xl px-3 py-2 flex items-center gap-2">
              <span className="text-white/50 text-xs flex-shrink-0">Tag it:</span>
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
                className="text-white/30 active:text-white/60 flex-shrink-0 pl-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="bg-gradient-to-t from-black/80 to-transparent px-4 pb-6 pt-4 space-y-3"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 1.5rem)" }}
        >
          {/* Mark Issue — big primary button */}
          <button
            onClick={handleMarkIssue}
            className={cn(
              "w-full h-16 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg transition-all duration-150 active:scale-[0.97]",
              markerFlash
                ? "bg-amber-400 text-white scale-[0.97]"
                : "bg-white/15 text-white border border-white/25 backdrop-blur-sm"
            )}
          >
            <Flag className={cn("w-5 h-5", markerFlash && "fill-white")} />
            {markerFlash ? "Captured!" : "Mark issue"}
          </button>

          {/* Secondary row: small camera + Finish */}
          <div className="flex gap-3 items-center">
            {/* Secondary camera button */}
            <button
              onClick={handleManualPhoto}
              className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm text-white flex items-center justify-center active:scale-[0.97] transition-transform flex-shrink-0"
              title="Take extra photo"
            >
              <Camera className="w-5 h-5" />
            </button>

            {/* Finish */}
            <button
              onClick={handleFinish}
              className="flex-1 h-14 rounded-2xl bg-blue-500 text-white font-bold flex items-center justify-center gap-2 active:scale-[0.97] transition-transform shadow-lg shadow-blue-500/30 text-base"
            >
              <Sparkles className="w-4.5 h-4.5" />
              Finish
            </button>
          </div>
        </div>
      </div>

      {/* Hidden file input — fallback when camera stream unavailable */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => handleFileInput(e.target.files)}
      />
    </div>
  );
}
