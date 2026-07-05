import React from "react";
import { Briefcase, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

const empty = () => ({
  company: "", position: "", location: "", startDate: "", endDate: "Present", highlights: [""]
});

export default function WorkForm({ data, onChange }) {
  const items = data.work || [];
  const [expanded, setExpanded] = React.useState([0]);

  const toggle = i => setExpanded(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);

  const update = (i, field, val) => {
    const next = items.map((it, idx) => idx === i ? { ...it, [field]: val } : it);
    onChange({ ...data, work: next });
  };

  const updateBullet = (i, j, val) => {
    const next = items.map((it, idx) => {
      if (idx !== i) return it;
      const hl = [...(it.highlights || [])];
      hl[j] = val;
      return { ...it, highlights: hl };
    });
    onChange({ ...data, work: next });
  };

  const addBullet = i => {
    const next = items.map((it, idx) =>
      idx === i ? { ...it, highlights: [...(it.highlights || []), ""] } : it
    );
    onChange({ ...data, work: next });
  };

  const removeBullet = (i, j) => {
    const next = items.map((it, idx) => {
      if (idx !== i) return it;
      return { ...it, highlights: it.highlights.filter((_, k) => k !== j) };
    });
    onChange({ ...data, work: next });
  };

  const add = () => {
    const next = [...items, empty()];
    onChange({ ...data, work: next });
    setExpanded(p => [...p, next.length - 1]);
  };

  const remove = i => {
    onChange({ ...data, work: items.filter((_, idx) => idx !== i) });
    setExpanded(p => p.filter(x => x !== i).map(x => x > i ? x - 1 : x));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Briefcase size={15} className="text-blue-400" />
          <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Work Experience</h3>
        </div>
        <button onClick={add} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition">
          <Plus size={13} /> Add Role
        </button>
      </div>

      <div className="space-y-3">
        {items.map((job, i) => (
          <div key={i} className="border border-slate-700 rounded-lg overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-800 transition"
              onClick={() => toggle(i)}
            >
              <div>
                <span className="text-sm font-medium text-slate-200">{job.company || "New Role"}</span>
                {job.position && <span className="text-xs text-slate-500 ml-2">· {job.position}</span>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={e => { e.stopPropagation(); remove(i); }} className="text-slate-600 hover:text-red-400 transition p-1">
                  <Trash2 size={13} />
                </button>
                {expanded.includes(i) ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
              </div>
            </div>

            {expanded.includes(i) && (
              <div className="px-4 pb-4 border-t border-slate-700 pt-3">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <F label="Company" value={job.company} onChange={v => update(i, "company", v)} placeholder="Company Name" />
                  <F label="Role / Title" value={job.position} onChange={v => update(i, "position", v)} placeholder="Senior Engineer" />
                  <F label="Location" value={job.location} onChange={v => update(i, "location", v)} placeholder="Lagos" />
                  <div className="grid grid-cols-2 gap-2">
                    <F label="Start" value={job.startDate} onChange={v => update(i, "startDate", v)} placeholder="Jan 2023" />
                    <F label="End" value={job.endDate} onChange={v => update(i, "endDate", v)} placeholder="Present" />
                  </div>
                </div>

                <label className="block text-xs text-slate-400 mb-2">Highlights / Bullets</label>
                <div className="space-y-2">
                  {(job.highlights || []).map((h, j) => (
                    <div key={j} className="flex gap-2 items-start">
                      <span className="text-slate-600 mt-2.5 text-xs">•</span>
                      <textarea
                        value={h}
                        onChange={e => updateBullet(i, j, e.target.value)}
                        rows={2}
                        placeholder="Describe impact with metrics where possible..."
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none"
                      />
                      <button onClick={() => removeBullet(i, j)} className="text-slate-600 hover:text-red-400 transition mt-2">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={() => addBullet(i)} className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition flex items-center gap-1">
                  <Plus size={12} /> Add bullet
                </button>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <button onClick={add} className="w-full border border-dashed border-slate-700 rounded-lg py-4 text-slate-500 text-sm hover:border-blue-500 hover:text-blue-400 transition">
            + Add work experience
          </button>
        )}
      </div>
    </div>
  );
}

function F({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <input
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
      />
    </div>
  );
}
