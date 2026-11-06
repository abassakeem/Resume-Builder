import React, { useState } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, X } from "lucide-react";

const VARIANTS = {
  success: { icon: CheckCircle2, iconClass: "text-emerald-400 bg-emerald-500/10", barClass: "bg-emerald-400", duration: 4000 },
  warning: { icon: AlertTriangle, iconClass: "text-amber-400 bg-amber-500/10", barClass: "bg-amber-400", duration: 9000 },
  error: { icon: AlertCircle, iconClass: "text-red-400 bg-red-500/10", barClass: "bg-red-400", duration: 7000 },
};

// Dismisses itself when the countdown bar finishes; hovering pauses the countdown.
export default function Toast({ toast, onClose }) {
  const [leaving, setLeaving] = useState(false);
  const variant = VARIANTS[toast.type] || VARIANTS.success;
  const Icon = variant.icon;
  const dismiss = () => setLeaving(true);

  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      onAnimationEnd={e => {
        if (leaving && e.target === e.currentTarget) onClose();
      }}
      className={`group fixed z-50 top-20 left-4 right-4 sm:left-auto sm:w-96 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/95 backdrop-blur shadow-2xl shadow-black/60 ${
        leaving ? "animate-toast-out" : "animate-toast-in"
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        <span className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-full ${variant.iconClass}`}>
          <Icon size={18} />
        </span>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-sm font-semibold text-white">{toast.title}</p>
          {toast.message && <p className="mt-0.5 text-sm text-neutral-400 break-words">{toast.message}</p>}
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action.onClick();
                dismiss();
              }}
              className="mt-3 h-8 px-3 rounded-lg bg-white hover:bg-neutral-200 text-xs font-semibold text-black transition"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss notification"
          className="p-1 -m-1 rounded-md text-neutral-500 hover:text-white hover:bg-neutral-800 transition"
        >
          <X size={16} />
        </button>
      </div>
      <div
        onAnimationEnd={dismiss}
        className={`h-0.5 origin-left opacity-70 ${variant.barClass} group-hover:[animation-play-state:paused]`}
        style={{
          animationName: "toast-timer",
          animationDuration: `${variant.duration}ms`,
          animationTimingFunction: "linear",
          animationFillMode: "forwards",
        }}
      />
    </div>
  );
}
