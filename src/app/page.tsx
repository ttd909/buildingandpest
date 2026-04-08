"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Shield, FileText, ArrowRight, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useInspectionStore } from "@/lib/store/useInspectionStore";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const { initialize, loadDemo } = useInspectionStore();

  const handleSignIn = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    router.push("/dashboard");
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    await initialize();
    await loadDemo();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900">
      {/* Logo area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
            <ClipboardList className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white leading-none tracking-tight">
              InspectFlow
            </h1>
            <p className="text-blue-400 text-sm font-semibold tracking-widest uppercase">
              AI
            </p>
          </div>
        </div>

        <p className="text-slate-300 text-center text-base mt-6 max-w-xs leading-relaxed">
          Fast, professional inspection reports for building and pest inspectors
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-8">
          {[
            { icon: Zap, label: "Capture fast" },
            { icon: Shield, label: "AI-powered" },
            { icon: FileText, label: "PDF reports" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 bg-white/10 text-white/80 rounded-full px-4 py-2 text-sm font-medium"
            >
              <Icon className="w-4 h-4" />
              {label}
            </div>
          ))}
        </div>

        {/* Tagline */}
        <div className="mt-12 text-center space-y-2">
          <p className="text-slate-400 text-sm">Designed for Australian inspectors</p>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-600">
            <span>Building</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span>Pest</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span>Combined</span>
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="px-6 pb-16 space-y-3 max-w-sm mx-auto w-full">
        <Button
          fullWidth
          size="xl"
          onClick={handleSignIn}
          loading={loading}
          className="bg-blue-500 hover:bg-blue-400 border-0 shadow-lg text-base rounded-2xl"
        >
          Sign in
          <ArrowRight className="w-5 h-5" />
        </Button>

        <Button
          fullWidth
          size="xl"
          variant="ghost"
          onClick={handleDemo}
          loading={demoLoading}
          className="text-white/80 hover:text-white hover:bg-white/10 text-base rounded-2xl"
        >
          Try demo mode
        </Button>

        <p className="text-center text-slate-600 text-xs pt-2">
          V1 · Powered by InspectFlow AI
        </p>
      </div>
    </div>
  );
}
