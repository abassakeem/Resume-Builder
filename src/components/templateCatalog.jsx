import React from "react";

export const templates = [
  {
    id: 1,
    name: "Classic",
    desc: "Clean, single-column. Maximum ATS compatibility.",
    preview: (
      <div className="p-2 text-left">
        <div className="h-2 bg-neutral-600 w-3/4 rounded mb-1" />
        <div className="h-1 bg-neutral-700 w-full rounded mb-2" />
        <div className="h-1 bg-neutral-700 w-1/3 rounded mb-1" />
        <div className="space-y-0.5 mb-2">
          <div className="h-1 bg-neutral-700 w-full rounded" />
          <div className="h-1 bg-neutral-700 w-5/6 rounded" />
          <div className="h-1 bg-neutral-700 w-4/5 rounded" />
        </div>
        <div className="h-1 bg-neutral-700 w-1/3 rounded mb-1" />
        <div className="space-y-0.5">
          <div className="h-1 bg-neutral-700 w-full rounded" />
          <div className="h-1 bg-neutral-700 w-4/5 rounded" />
        </div>
      </div>
    ),
  },
  {
    id: 2,
    name: "Modern",
    desc: "Two-column with navy sidebar. Bold visual impact.",
    preview: (
      <div className="flex h-full">
        <div className="w-1/3 bg-blue-900/60 p-1.5">
          <div className="h-2 bg-blue-400/50 rounded w-3/4 mb-1" />
          <div className="h-1 bg-blue-300/30 rounded w-full mb-1" />
          <div className="h-1 bg-blue-300/30 rounded w-5/6 mb-2" />
          <div className="h-1 bg-blue-300/20 rounded w-1/2 mb-1" />
          <div className="space-y-0.5">
            <div className="h-1 bg-blue-300/20 rounded w-full" />
            <div className="h-1 bg-blue-300/20 rounded w-4/5" />
          </div>
        </div>
        <div className="flex-1 p-1.5">
          <div className="h-1 bg-blue-500/50 w-1/2 rounded mb-1" />
          <div className="space-y-0.5 mb-2">
            <div className="h-1 bg-neutral-600 rounded w-full" />
            <div className="h-1 bg-neutral-600 rounded w-4/5" />
            <div className="h-1 bg-neutral-600 rounded w-full" />
          </div>
          <div className="h-1 bg-blue-500/50 w-1/2 rounded mb-1" />
          <div className="space-y-0.5">
            <div className="h-1 bg-neutral-600 rounded w-full" />
            <div className="h-1 bg-neutral-600 rounded w-3/5" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    name: "Minimal",
    desc: "Whitespace-driven. Typographic hierarchy only.",
    preview: (
      <div className="p-2">
        <div className="h-3 bg-neutral-500 w-1/2 rounded mb-0.5" />
        <div className="h-0.5 bg-neutral-700 w-full rounded mb-2" />
        <div className="h-0.5 bg-neutral-700 w-1/3 rounded mb-1" />
        <div className="h-0.5 bg-neutral-700 w-1/4 rounded mb-2" />
        <div className="space-y-0.5 mb-2">
          <div className="h-0.5 bg-neutral-700 w-full rounded" />
          <div className="h-0.5 bg-neutral-700 w-5/6 rounded" />
          <div className="h-0.5 bg-neutral-700 w-4/5 rounded" />
          <div className="h-0.5 bg-neutral-700 w-full rounded" />
        </div>
        <div className="h-0.5 bg-neutral-700 w-1/3 rounded mb-1" />
        <div className="space-y-0.5">
          <div className="h-0.5 bg-neutral-700 w-full rounded" />
          <div className="h-0.5 bg-neutral-700 w-3/4 rounded" />
        </div>
      </div>
    ),
  },
];
