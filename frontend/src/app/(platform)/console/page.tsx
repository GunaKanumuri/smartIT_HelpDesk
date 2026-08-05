'use client';
import Link from 'next/link';

export default function PlatformDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Platform Operator Console</h1>
        <p className="text-slate-600 mb-8">
          This section is currently under development. Advanced tenant management and system metrics will be available here soon.
        </p>
        <Link
          href="/"
          className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
        >
          Back to site
        </Link>
      </div>
    </div>
  );
}
