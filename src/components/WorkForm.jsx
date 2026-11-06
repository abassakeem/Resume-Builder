import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Field, ItemCard, AddButton } from "./ui";
import { useExpanded, joinParts, dateRange } from "./formUtils";

const empty = () => ({
  company: "", position: "", location: "", startDate: "", endDate: "", highlights: [""]
});

export default function WorkForm({ data, onChange }) {
  const items = data.work || [];
  const expanded = useExpanded();

  const update = (i, field, val) => {
    const next = items.map((it, idx) => idx === i ? { ...it, [field]: val } : it);
    onChange({ ...data, work: next });
  };

  const updateBullet = (i, j, val) => {
    const hl = [...(items[i].highlights || [])];
    hl[j] = val;
    update(i, "highlights", hl);
  };

  const addBullet = i => update(i, "highlights", [...(items[i].highlights || []), ""]);
  const removeBullet = (i, j) => update(i, "highlights", items[i].highlights.filter((_, k) => k !== j));

  const add = () => {
    onChange({ ...data, work: [...items, empty()] });
    expanded.added(items.length);
  };

  const remove = i => {
    onChange({ ...data, work: items.filter((_, idx) => idx !== i) });
    expanded.removed(i);
  };

  return (
    <div className="space-y-3">
      {items.map((job, i) => (
        <ItemCard
          key={i}
          title={job.company || "Untitled role"}
          subtitle={joinParts(job.position, dateRange(job.startDate, job.endDate))}
          open={expanded.isOpen(i)}
          onToggle={() => expanded.toggle(i)}
          onRemove={() => remove(i)}
          removeLabel="Remove role"
        >
          <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4">
            <Field label="Company" value={job.company} onChange={v => update(i, "company", v)} placeholder="Company Name" />
            <Field label="Role / Title" value={job.position} onChange={v => update(i, "position", v)} placeholder="Senior Engineer" />
            <Field label="Start" value={job.startDate} onChange={v => update(i, "startDate", v)} placeholder="Jan 2023" />
            <Field label="End" value={job.endDate} onChange={v => update(i, "endDate", v)} placeholder="Present" />
            <Field label="Location" value={job.location} onChange={v => update(i, "location", v)} placeholder="Lagos" className="@sm:col-span-2" />
          </div>

          <div className="mt-5">
            <div className="text-xs font-medium text-neutral-400 mb-1.5">
              Highlights <span className="font-normal text-neutral-500">· lead with impact, use numbers</span>
            </div>
            <div className="space-y-2">
              {(job.highlights || []).map((h, j) => (
                <div key={j} className="flex gap-2 items-start">
                  <span className="w-5 shrink-0 pt-2 text-right text-xs text-neutral-500 tabular-nums">{j + 1}.</span>
                  <textarea
                    value={h}
                    onChange={e => updateBullet(i, j, e.target.value)}
                    rows={2}
                    aria-label={`Highlight ${j + 1}`}
                    placeholder="Describe impact with metrics where possible..."
                    className="flex-1 bg-neutral-800/60 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-400 focus:ring-2 focus:ring-white/15 transition resize-y"
                  />
                  <button
                    type="button"
                    onClick={() => removeBullet(i, j)}
                    aria-label={`Remove highlight ${j + 1}`}
                    className="p-2 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => addBullet(i)}
              className="mt-2 ml-7 flex items-center gap-1 text-xs font-medium text-neutral-300 hover:text-white transition"
            >
              <Plus size={13} /> Add highlight
            </button>
          </div>
        </ItemCard>
      ))}
      <AddButton onClick={add}>Add work experience</AddButton>
    </div>
  );
}
