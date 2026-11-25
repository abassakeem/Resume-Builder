import { useState } from "react";

// Tracks which list items are expanded, keeping indices aligned when items are added or removed.
export function useExpanded(initial = [0]) {
  const [open, setOpen] = useState(initial);
  return {
    isOpen: i => open.includes(i),
    toggle: i => setOpen(p => (p.includes(i) ? p.filter(x => x !== i) : [...p, i])),
    added: i => setOpen(p => [...p, i]),
    removed: i => setOpen(p => p.filter(x => x !== i).map(x => (x > i ? x - 1 : x))),
    // Two entries swapped places: swap their open state too.
    moved: (from, to) => setOpen(p => p.map(x => (x === from ? to : x === to ? from : x))),
  };
}

// Swaps item `i` with its neighbour (delta -1 = up, +1 = down).
export function moveItem(items, i, delta) {
  const j = i + delta;
  if (j < 0 || j >= items.length) return items;
  const next = [...items];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

// Props for ItemCard's move buttons: null disables a button at either end of the list.
export function moveProps(items, i, onMove) {
  return {
    onMoveUp: i > 0 ? () => onMove(i, -1) : null,
    onMoveDown: i < items.length - 1 ? () => onMove(i, 1) : null,
  };
}

export function joinParts(...parts) {
  return parts.filter(Boolean).join(" · ");
}

export function dateRange(start, end) {
  return start || end ? `${start || "?"} – ${end || "?"}` : "";
}
