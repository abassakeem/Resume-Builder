import React, { useEffect, useRef } from "react";
import { FileText, Sparkles, FilePlus2 } from "lucide-react";

const OPTIONS = [
  { id: "resume", icon: FileText, title: "Start from my resume", desc: "Copies your contact details, education, experience and skills. Academic sections start empty." },
  { id: "sample", icon: Sparkles, title: "Start with the sample CV", desc: "A complete example for a graduate applicant, so you can preview the templates right away." },
  { id: "blank", icon: FilePlus2, title: "Start blank", desc: "An empty CV with every section ready to fill in." },
];

// Asked once, the first time the user switches to Academic CV.
export default function CvStartDialog({ onChoose, onCancel }) {
  const firstRef = useRef();
  const cancelRef = useRef(onCancel);
  cancelRef.current = onCancel;

  useEffect(() => {
    firstRef.current?.focus();
    const onKey = e => e.key === "Escape" && cancelRef.current();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cv-start-title"
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl"
      >
        <h2 id="cv-start-title" className="text-lg font-semibold tracking-tight text-white">Create your Academic CV</h2>
        <p className="mt-1 text-sm text-neutral-400">
          The CV is a separate document. Your resume stays exactly as it is, and you can switch between them at any time.
        </p>
        <div className="mt-5 space-y-2">
          {OPTIONS.map((o, i) => (
            <button
              key={o.id}
              ref={i === 0 ? firstRef : undefined}
              type="button"
              onClick={() => onChoose(o.id)}
              className="w-full flex items-start gap-3 p-3 rounded-xl border border-neutral-800 text-left hover:border-neutral-600 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
            >
              <span className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg bg-neutral-800 text-neutral-300">
                <o.icon size={15} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-neutral-100">{o.title}</span>
                <span className="block mt-0.5 text-xs text-neutral-400 leading-relaxed">{o.desc}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={onCancel} className="h-8 px-3 rounded-lg text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
