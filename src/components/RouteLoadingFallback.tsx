import React from 'react';

export function RouteLoadingFallback() {
  return (
    <div className="container mx-auto px-3 sm:px-4 max-w-7xl pt-4 pb-12 animate-pulse" aria-busy="true" aria-label="Loading page content">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-3 w-16 bg-slate-200 rounded-sm" />
        <div className="h-3 w-3 bg-slate-200 rounded-sm" />
        <div className="h-3 w-28 bg-slate-200 rounded-sm" />
      </div>

      <div className="h-8 w-64 sm:w-80 bg-slate-200 rounded-xl mb-6" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="h-48 bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs" />
          <div className="h-32 bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs" />
        </div>
        <div className="space-y-4">
          <div className="h-64 bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs" />
        </div>
      </div>
    </div>
  );
}

export function AdminLoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 flex flex-col items-center justify-center animate-pulse" aria-busy="true">
      <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 mb-4" />
      <div className="h-5 w-40 bg-slate-800 rounded-lg mb-2" />
      <div className="h-3 w-64 bg-slate-800/60 rounded-md" />
    </div>
  );
}
