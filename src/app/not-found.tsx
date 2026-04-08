import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-slate-200 mb-4">404</p>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Page not found</h1>
        <p className="text-slate-500 mb-6">This page doesn&apos;t exist.</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
