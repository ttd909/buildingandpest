"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!installEvent || dismissed) return null;

  const handleInstall = async () => {
    await installEvent.prompt();
    const result = await installEvent.userChoice;
    if (result.outcome === "accepted") {
      setInstallEvent(null);
    }
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="bg-blue-700 text-white rounded-2xl p-4 shadow-xl flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Download className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Install InspectFlow AI</p>
          <p className="text-xs text-blue-200">Add to home screen for best experience</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 bg-white text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors"
          >
            Install
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
