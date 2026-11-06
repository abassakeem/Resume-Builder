import React, { useId, useState } from "react";
import { ChevronDown, Plus, Trash2, X } from "lucide-react";

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

export function Field({ label, hint, value, onChange, placeholder, type = "text", className = "", multiline = false, rows = 3 }) {
  const id = useId();
  const props = {
    id,
    value: value || "",
    onChange: e => onChange(e.target.value),
    placeholder,
  };
  return (
    <div className={className}>
      <Label htmlFor={id} hint={hint}>{label}</Label>
      {multiline
        ? <textarea {...props} rows={rows} className={`${inputClass} resize-y`} />
        : <input {...props} type={type} className={inputClass} />}
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

export function ItemCard({ title, subtitle, open, onToggle, onRemove, removeLabel, children }) {
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
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          title={removeLabel}
          className="p-2 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition"
        >
          <Trash2 size={15} />
        </button>
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
