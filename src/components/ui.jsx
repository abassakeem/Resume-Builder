import React, { useEffect, useId, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2, X } from "lucide-react";

const inputClass =
  "w-full bg-neutral-800/60 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-400 focus:ring-2 focus:ring-white/15 transition";

function Label({ htmlFor, children, hint }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-medium text-neutral-400 mb-1.5">
      {children}
      {hint && <span className="font-normal text-neutral-500"> · {hint}</span>}
    </label>
  );
}

const errorInputClass = "border-red-500/70 focus:border-red-400 focus:ring-red-500/20";

function FieldError({ id, error }) {
  return error ? <p id={id} className="mt-1 text-xs text-red-400">{error}</p> : null;
}

// `error` is optional: when set, the input is outlined in red and the message shown underneath.
export function Field({ label, hint, value, onChange, placeholder, type = "text", className = "", multiline = false, rows = 3, error }) {
  const id = useId();
  const errorId = `${id}-error`;
  const props = {
    id,
    value: value || "",
    onChange: e => onChange(e.target.value),
    placeholder,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
  };
  const cls = `${inputClass} ${error ? errorInputClass : ""}`;
  return (
    <div className={className}>
      <Label htmlFor={id} hint={hint}>{label}</Label>
      {multiline
        ? <textarea {...props} rows={rows} className={`${cls} resize-y`} />
        : <input {...props} type={type} className={cls} />}
      <FieldError id={errorId} error={error} />
    </div>
  );
}

export function SelectField({ label, hint, value, onChange, options, className = "" }) {
  const id = useId();
  return (
    <div className={className}>
      <Label htmlFor={id} hint={hint}>{label}</Label>
      <select id={id} value={value || ""} onChange={e => onChange(e.target.value)} className={`${inputClass} appearance-auto`}>
        {options.map(o => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// Segmented control for a small set of choices, e.g. citation style or paper size.
export function ChoiceGroup({ label, value, onChange, options }) {
  return (
    <fieldset>
      <legend className="block text-xs font-medium text-neutral-400 mb-1.5">{label}</legend>
      <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-neutral-800/60 border border-neutral-700">
        {options.map(o => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={value === o.id}
            className={`flex-1 min-w-fit h-8 px-3 rounded-md text-xs font-medium transition ${
              value === o.id ? "bg-white text-black" : "text-neutral-300 hover:bg-neutral-700/60"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

// Editable list of bullet points (same look as the work highlights editor).
export function BulletsField({ label, hint, value = [], onChange, placeholder, addLabel = "Add bullet" }) {
  const set = (j, v) => onChange(value.map((b, k) => (k === j ? v : b)));
  return (
    <div>
      <div className="text-xs font-medium text-neutral-400 mb-1.5">
        {label} {hint && <span className="font-normal text-neutral-500">· {hint}</span>}
      </div>
      <div className="space-y-2">
        {value.map((b, j) => (
          <div key={j} className="flex gap-2 items-start">
            <span className="w-5 shrink-0 pt-2 text-right text-xs text-neutral-500 tabular-nums">{j + 1}.</span>
            <textarea
              value={b}
              onChange={e => set(j, e.target.value)}
              rows={2}
              aria-label={`${label} ${j + 1}`}
              placeholder={placeholder}
              className={`${inputClass} flex-1 resize-y`}
            />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, k) => k !== j))}
              aria-label={`Remove ${label.toLowerCase()} ${j + 1}`}
              className="p-2 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...value, ""])}
        className="mt-2 ml-7 flex items-center gap-1 text-xs font-medium text-neutral-300 hover:text-white transition"
      >
        <Plus size={13} /> {addLabel}
      </button>
    </div>
  );
}

// Chip-style list input. Enter or comma adds a tag; Backspace on an empty input removes the last one.
export function TagInput({ label, value = [], onChange, placeholder }) {
  const id = useId();
  const [draft, setDraft] = useState("");

  const add = parts => {
    const tags = parts.map(t => t.trim()).filter(Boolean);
    if (tags.length) onChange([...value, ...tags]);
  };

  const handleChange = e => {
    const parts = e.target.value.split(",");
    const last = parts.pop();
    add(parts);
    setDraft(parts.length ? last.trimStart() : last);
  };

  const handleKeyDown = e => {
    if (e.key === "Enter") {
      e.preventDefault();
      add([draft]);
      setDraft("");
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const handleBlur = () => {
    add([draft]);
    setDraft("");
  };

  return (
    <div>
      <Label htmlFor={id} hint="Enter or comma to add">{label}</Label>
      <div className="flex flex-wrap items-center gap-1.5 bg-neutral-800/60 border border-neutral-700 rounded-lg px-2 py-1.5 focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-white/15 transition">
        {value.map((tag, i) => (
          <span key={i} className="flex items-center gap-1 pl-2 pr-1 py-0.5 bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs rounded-md">
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              aria-label={`Remove ${tag}`}
              className="rounded text-neutral-500 hover:text-white transition"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={value.length ? "Add more…" : placeholder}
          className="flex-1 min-w-32 bg-transparent px-1 py-1 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none"
        />
      </div>
    </div>
  );
}

// A trash button that asks before deleting: the first click turns it into "Remove" / "Keep".
// Escape or clicking away cancels.
export function ConfirmRemove({ label, onConfirm, size = 15 }) {
  const [confirming, setConfirming] = useState(false);
  const keepRef = useRef();

  useEffect(() => {
    if (confirming) keepRef.current?.focus();
  }, [confirming]);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={label}
        title={label}
        className="p-2 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition"
      >
        <Trash2 size={size} />
      </button>
    );
  }

  return (
    <div
      className="flex items-center gap-1"
      onKeyDown={e => e.key === "Escape" && setConfirming(false)}
      onBlur={e => !e.currentTarget.contains(e.relatedTarget) && setConfirming(false)}
    >
      <button
        type="button"
        onClick={() => {
          setConfirming(false);
          onConfirm();
        }}
        className="h-7 px-2.5 rounded-md bg-red-600 hover:bg-red-500 text-xs font-medium text-white transition"
      >
        Remove
      </button>
      <button
        ref={keepRef}
        type="button"
        onClick={() => setConfirming(false)}
        className="h-7 px-2.5 rounded-md text-xs text-neutral-300 hover:bg-neutral-800 transition"
      >
        Keep
      </button>
    </div>
  );
}

const moveButton =
  "p-1.5 rounded-md text-neutral-500 hover:text-white hover:bg-neutral-800 transition disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-neutral-500";

// `onMoveUp` / `onMoveDown` are optional: pass them where entry order shows up in the PDF.
// Pass null for the first/last entry to show the button disabled.
export function ItemCard({ title, subtitle, open, onToggle, onRemove, removeLabel, onMoveUp, onMoveDown, children }) {
  const movable = onMoveUp !== undefined || onMoveDown !== undefined;
  return (
    <div className={`rounded-xl border transition ${open ? "border-neutral-700 bg-black" : "border-neutral-800 bg-black hover:border-neutral-700"}`}>
      <div className="flex items-center pr-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex-1 min-w-0 flex items-center gap-3 px-4 py-3 text-left"
        >
          <ChevronDown size={16} className={`shrink-0 text-neutral-500 transition-transform ${open ? "" : "-rotate-90"}`} />
          <div className="min-w-0">
            <div className="text-sm font-medium text-neutral-100 truncate">{title}</div>
            {subtitle && <div className="text-xs text-neutral-500 truncate mt-0.5">{subtitle}</div>}
          </div>
        </button>
        {movable && (
          <>
            <button type="button" onClick={onMoveUp || undefined} disabled={!onMoveUp} aria-label={`Move ${title} up`} title="Move up" className={moveButton}>
              <ArrowUp size={14} />
            </button>
            <button type="button" onClick={onMoveDown || undefined} disabled={!onMoveDown} aria-label={`Move ${title} down`} title="Move down" className={moveButton}>
              <ArrowDown size={14} />
            </button>
          </>
        )}
        <ConfirmRemove label={removeLabel} onConfirm={onRemove} />
      </div>
      {open && <div className="px-4 pt-4 pb-4 border-t border-neutral-800">{children}</div>}
    </div>
  );
}

export function AddButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 py-3 text-sm text-neutral-400 hover:border-neutral-500 hover:text-white hover:bg-white/5 transition"
    >
      <Plus size={15} /> {children}
    </button>
  );
}
