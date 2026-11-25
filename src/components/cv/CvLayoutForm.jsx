import React, { useMemo } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import { DEFAULT_SECTION_ORDER } from "../../lib/cv/model";
import {
  sectionOrder, sectionTitle, moveSection, toggleHidden, prepareCv, sectionHasContent, isCustomKey, customSectionKey,
} from "../../lib/cv/sections";

const iconButton =
  "p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-neutral-400";

export default function CvLayoutForm({ cv, onChange, onGoTo }) {
  const order = sectionOrder(cv);
  const hidden = cv.hiddenSections || [];
  const prepared = useMemo(() => prepareCv(cv), [cv]);

  const setOrder = next => onChange(c => ({ ...c, sectionOrder: next }));
  const toggle = key => onChange(c => ({ ...c, hiddenSections: toggleHidden(c.hiddenSections || [], key) }));
  const reset = () =>
    onChange(c => ({
      ...c,
      sectionOrder: [...DEFAULT_SECTION_ORDER, ...c.customSections.map(s => customSectionKey(s.id))],
      hiddenSections: [],
    }));

  return (
    <div>
      <ol className="rounded-xl border border-neutral-800 divide-y divide-neutral-800">
        <li className="flex items-center gap-3 px-3 py-2.5">
          <span className="w-6 text-right text-xs tabular-nums text-neutral-600">–</span>
          <span className="flex-1 text-sm text-neutral-400">Header</span>
          <span className="text-xs text-neutral-500">Always first</span>
        </li>
        {order.map((key, i) => {
          const isHidden = hidden.includes(key);
          const empty = !sectionHasContent(prepared, key);
          const status = isHidden ? "Hidden" : empty ? "Empty · not printed" : "Printed";
          const title = sectionTitle(cv, key);
          return (
            <li key={key} className="flex items-center gap-2 px-3 py-2">
              <span className="w-6 text-right text-xs tabular-nums text-neutral-500">{i + 1}.</span>
              <button
                type="button"
                onClick={() => onGoTo(isCustomKey(key) ? "custom" : key)}
                className={`flex-1 min-w-0 text-left text-sm truncate transition hover:text-white ${isHidden || empty ? "text-neutral-500" : "text-neutral-200"}`}
                title={`Edit ${title}`}
              >
                {title}
              </button>
              <span className={`hidden @sm:inline text-xs ${isHidden ? "text-amber-400/80" : "text-neutral-500"}`}>{status}</span>
              <button type="button" className={iconButton} onClick={() => setOrder(moveSection(order, key, -1))} disabled={i === 0} aria-label={`Move ${title} up`}>
                <ArrowUp size={14} />
              </button>
              <button type="button" className={iconButton} onClick={() => setOrder(moveSection(order, key, 1))} disabled={i === order.length - 1} aria-label={`Move ${title} down`}>
                <ArrowDown size={14} />
              </button>
              <button
                type="button"
                className={iconButton}
                onClick={() => toggle(key)}
                aria-pressed={!isHidden}
                aria-label={isHidden ? `Show ${title}` : `Hide ${title}`}
                title={isHidden ? "Show in PDF" : "Hide from PDF"}
              >
                {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </li>
          );
        })}
      </ol>
      <button type="button" onClick={reset} className="mt-3 text-xs text-neutral-400 hover:text-white transition">
        Reset to the recommended order
      </button>
    </div>
  );
}
