"use client";

import { useRef } from "react";
import { Camera, Image, X, RotateCcw } from "lucide-react";
import { CapturedPhoto } from "@/types";
import { generateId } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PhotoCaptureProps {
  photos: CapturedPhoto[];
  onChange: (photos: CapturedPhoto[]) => void;
  maxPhotos?: number;
}

export function PhotoCapture({ photos, onChange, maxPhotos = 10 }: PhotoCaptureProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = maxPhotos - photos.length;
    const toProcess = Array.from(files).slice(0, remaining);

    toProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const photo: CapturedPhoto = {
          id: generateId(),
          dataUrl,
          capturedAt: new Date().toISOString(),
          fileName: file.name,
        };
        onChange([...photos, photo]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (id: string) => {
    onChange(photos.filter((p) => p.id !== id));
  };

  const canAdd = photos.length < maxPhotos;

  return (
    <div className="space-y-3">
      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.dataUrl}
                alt="Captured photo"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removePhoto(photo.id)}
                className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity active:opacity-100"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          ))}
          {/* Add more tile */}
          {canAdd && (
            <button
              onClick={() => cameraRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <Camera className="w-5 h-5 text-slate-400" />
              <span className="text-xs text-slate-400">Add</span>
            </button>
          )}
        </div>
      )}

      {/* Initial capture buttons — show when no photos */}
      {photos.length === 0 && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => cameraRef.current?.click()}
            className={cn(
              "flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-dashed border-slate-200",
              "hover:border-blue-300 hover:bg-blue-50 transition-colors group"
            )}
          >
            <div className="w-12 h-12 bg-slate-100 group-hover:bg-blue-100 rounded-full flex items-center justify-center transition-colors">
              <Camera className="w-6 h-6 text-slate-500 group-hover:text-blue-600 transition-colors" />
            </div>
            <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">
              Take photo
            </span>
          </button>

          <button
            onClick={() => libraryRef.current?.click()}
            className={cn(
              "flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-dashed border-slate-200",
              "hover:border-blue-300 hover:bg-blue-50 transition-colors group"
            )}
          >
            <div className="w-12 h-12 bg-slate-100 group-hover:bg-blue-100 rounded-full flex items-center justify-center transition-colors">
              <Image className="w-6 h-6 text-slate-500 group-hover:text-blue-600 transition-colors" />
            </div>
            <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">
              Choose photo
            </span>
          </button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        onClick={(e) => ((e.target as HTMLInputElement).value = "")}
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        onClick={(e) => ((e.target as HTMLInputElement).value = "")}
      />

      {/* Show add buttons below grid when photos exist */}
      {photos.length > 0 && canAdd && (
        <div className="flex gap-2">
          <button
            onClick={() => libraryRef.current?.click()}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors py-1"
          >
            <Image className="w-3.5 h-3.5" />
            Library
          </button>
        </div>
      )}

      {!canAdd && (
        <p className="text-xs text-slate-400 text-center">Maximum {maxPhotos} photos reached</p>
      )}
    </div>
  );
}
