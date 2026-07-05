import React from "react";

const templates = [
  {
    id: 1,
    name: "Classic",
    desc: "Clean, single-column. Maximum ATS compatibility.",
    preview: (
      <div className="p-2 text-left">
        <div className="h-2 bg-slate-600 w-3/4 rounded mb-1" />
        <div className="h-1 bg-slate-700 w-full rounded mb-2" />
        <div className="h-1 bg-slate-700 w-1/3 rounded mb-1" />
        <div className="space-y-0.5 mb-2">
          <div className="h-1 bg-slate-700 w-full rounded" />
          <div className="h-1 bg-slate-700 w-5/6 rounded" />
          <div className="h-1 bg-slate-700 w-4/5 rounded" />
        </div>
        <div className="h-1 bg-slate-700 w-1/3 rounded mb-1" />
        <div className="space-y-0.5">
          <div className="h-1 bg-slate-700 w-full rounded" />
          <div className="h-1 bg-slate-700 w-4/5 rounded" />
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
            <div className="h-1 bg-slate-600 rounded w-full" />
            <div className="h-1 bg-slate-600 rounded w-4/5" />
            <div className="h-1 bg-slate-600 rounded w-full" />
          </div>
          <div className="h-1 bg-blue-500/50 w-1/2 rounded mb-1" />
          <div className="space-y-0.5">
            <div className="h-1 bg-slate-600 rounded w-full" />
            <div className="h-1 bg-slate-600 rounded w-3/5" />
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
        <div className="h-3 bg-slate-500 w-1/2 rounded mb-0.5" />
        <div className="h-0.5 bg-slate-700 w-full rounded mb-2" />
        <div className="h-0.5 bg-slate-700 w-1/3 rounded mb-1" />
        <div className="h-0.5 bg-slate-700 w-1/4 rounded mb-2" />
        <div className="space-y-0.5 mb-2">
          <div className="h-0.5 bg-slate-700 w-full rounded" />
          <div className="h-0.5 bg-slate-700 w-5/6 rounded" />
          <div className="h-0.5 bg-slate-700 w-4/5 rounded" />
          <div className="h-0.5 bg-slate-700 w-full rounded" />
        </div>
        <div className="h-0.5 bg-slate-700 w-1/3 rounded mb-1" />
        <div className="space-y-0.5">
          <div className="h-0.5 bg-slate-700 w-full rounded" />
          <div className="h-0.5 bg-slate-700 w-3/4 rounded" />
        </div>
      </div>
    ),
  },
];

export default function TemplatePicker({ selected, onSelect }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Choose Template</h3>
      <div className="grid grid-cols-3 gap-3">
        {templates.map(t => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`rounded-lg border-2 transition overflow-hidden text-left ${
              selected === t.id
                ? "border-blue-500 shadow-lg shadow-blue-500/20"
                : "border-slate-700 hover:border-slate-500"
            }`}
          >
            <div className="h-28 bg-slate-800 overflow-hidden">{t.preview}</div>
            <div className="px-2 py-2 bg-slate-850 border-t border-slate-700">
              <div className="flex items-center gap-1.5 mb-0.5">
                {selected === t.id && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                )}
                <span className="text-xs font-semibold text-slate-200">{t.name}</span>
              </div>
              <p className="text-xs text-slate-500 leading-tight">{t.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
