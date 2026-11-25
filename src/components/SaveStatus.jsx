import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, LoaderCircle, HardDrive } from "lucide-react";

const timeOf = t => (t ? new Date(t).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "");

// Autosave indicator. Clicking it explains where work is kept and offers "Clear saved data".
// status: "idle" (nothing saved yet) | "saving" | "saved" | "failed" | "conflict".
export default function SaveStatus({ status, savedAt, onLoadNewer, onKeepMine, onClear }) {
  const [open, setOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const rootRef = useRef();

  useEffect(() => {
    if (!open) return;
    const close = e => {
      if (e.type === "keydown" ? e.key === "Escape" : !rootRef.current?.contains(e.target)) {
        setOpen(false);
        setConfirmClear(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (status === "conflict") {
    return (
      <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-amber-300">
        <span className="inline-flex items-center gap-1">
          <AlertTriangle size={12} /> Newer changes in another tab
        </span>
        <button type="button" onClick={onLoadNewer} className="underline underline-offset-2 hover:text-white">Load them</button>
        <button type="button" onClick={onKeepMine} className="underline underline-offset-2 hover:text-white">Keep this tab's</button>
      </span>
    );
  }

  const label = {
    idle: { icon: HardDrive, text: "Autosave on", cls: "text-neutral-500" },
    saving: { icon: LoaderCircle, text: "Saving…", cls: "text-neutral-400", spin: true },
    saved: { icon: Check, text: "Saved", cls: "text-neutral-400" },
    failed: { icon: AlertTriangle, text: "Not saved", cls: "text-amber-300" },
  }[status] ?? { icon: HardDrive, text: "Autosave on", cls: "text-neutral-500" };

  return (
    <span ref={rootRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-live="polite"
        className={`inline-flex items-center gap-1 rounded hover:text-white transition ${label.cls}`}
        title="Where is my work saved?"
      >
        <label.icon size={12} className={label.spin ? "animate-spin" : ""} /> {label.text}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-72 rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-left shadow-2xl shadow-black/60">
          <p className="text-xs leading-relaxed text-neutral-300">
            {status === "failed"
              ? "This browser isn't letting the app save (a private window, blocked site data or full storage). Use Export to keep a copy of your work."
              : "Your resume and CV are saved automatically in this browser only. They won't appear on other devices, so use Export to keep a backup."}
          </p>
          {savedAt && status !== "failed" && <p className="mt-2 text-xs text-neutral-500">Last saved at {timeOf(savedAt)}.</p>}
          <div className="mt-3 pt-3 border-t border-neutral-800">
            {confirmClear ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-red-200">Remove both documents from this browser?</span>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setConfirmClear(false);
                    onClear();
                  }}
                  className="h-7 px-2.5 rounded-md bg-red-600 hover:bg-red-500 text-xs font-medium text-white transition"
                >
                  Clear
                </button>
                <button type="button" onClick={() => setConfirmClear(false)} className="h-7 px-2.5 rounded-md text-xs text-neutral-300 hover:bg-neutral-800 transition">
                  Cancel
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmClear(true)} className="text-xs text-neutral-400 hover:text-red-300 transition">
                Clear saved data
              </button>
            )}
          </div>
        </div>
      )}
    </span>
  );
}
