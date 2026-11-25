import React from "react";

const lines = widths => (
  <div className="space-y-0.5 mb-1.5">
    {widths.map((w, i) => (
      <div key={i} className="h-0.5 bg-neutral-700 rounded" style={{ width: w }} />
    ))}
  </div>
);

export const cvTemplates = [
  {
    id: "cv-classic",
    name: "Classic",
    desc: "Serif type, centred name. The conservative look most search committees expect.",
    preview: (
      <div className="p-2">
        <div className="flex flex-col items-center mb-1.5">
          <div className="h-2 bg-neutral-500 w-3/5 rounded mb-0.5" />
          <div className="h-0.5 bg-neutral-700 w-4/5 rounded" />
        </div>
        {[0, 1, 2].map(i => (
          <div key={i}>
            <div className="h-1 bg-neutral-600 w-1/3 rounded mb-0.5" />
            <div className="h-px bg-neutral-500 w-full mb-0.5" />
            {lines(["100%", "90%", "80%"])}
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "cv-modern",
    name: "Modern",
    desc: "Sans-serif, left-aligned, slate headings. Still one column and print-friendly.",
    preview: (
      <div className="p-2">
        <div className="h-2.5 bg-neutral-500 w-2/3 rounded mb-0.5" />
        <div className="h-0.5 bg-neutral-700 w-3/4 rounded mb-1.5" />
        {[0, 1, 2].map(i => (
          <div key={i}>
            <div className="h-1 bg-slate-500 w-2/5 rounded mb-0.5" />
            <div className="h-px bg-neutral-700 w-full mb-0.5" />
            {lines(["100%", "85%", "92%"])}
          </div>
        ))}
      </div>
    ),
  },
];
