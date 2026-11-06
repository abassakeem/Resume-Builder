import { useState } from "react";

// Tracks which list items are expanded, keeping indices aligned when items are added or removed.
export function useExpanded(initial = [0]) {
  const [open, setOpen] = useState(initial);
  return {
    isOpen: i => open.includes(i),
    toggle: i => setOpen(p => (p.includes(i) ? p.filter(x => x !== i) : [...p, i])),
    added: i => setOpen(p => [...p, i]),
    removed: i => setOpen(p => p.filter(x => x !== i).map(x => (x > i ? x - 1 : x))),
  };
}

export function joinParts(...parts) {
  return parts.filter(Boolean).join(" · ");
}

export function dateRange(start, end) {
  return start || end ? `${start || "?"} – ${end || "?"}` : "";
}
