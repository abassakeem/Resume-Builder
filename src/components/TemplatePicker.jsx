import React from "react";
import { Check } from "lucide-react";
import { templates } from "./templateCatalog";

export default function TemplatePicker({ selected, onSelect }) {
  return (
    <div className="space-y-3">
      {templates.map(t => {
        const active = selected === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            aria-pressed={active}
            className={`w-full flex items-center gap-4 p-3 rounded-xl border text-left transition ${
              active
                ? "border-white bg-white/5 ring-1 ring-white"
                : "border-neutral-800 bg-black hover:border-neutral-600"
            }`}
          >
            <div className="w-20 h-26 shrink-0 bg-neutral-800 rounded-md overflow-hidden border border-neutral-700">{t.preview}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-neutral-100">{t.name}</div>
              <p className="mt-1 text-xs text-neutral-400 leading-relaxed">{t.desc}</p>
            </div>
            <span
              className={`w-5 h-5 shrink-0 flex items-center justify-center rounded-full border transition ${
                active ? "bg-white border-white text-black" : "border-neutral-600 text-transparent"
              }`}
            >
              <Check size={12} strokeWidth={3} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
