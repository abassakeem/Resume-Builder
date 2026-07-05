import React from "react";
import { Zap, Plus, Trash2 } from "lucide-react";

const empty = () => ({ name: "", keywords: [] });

export default function SkillsForm({ data, onChange }) {
  const items = data.skills || [];

  const update = (i, field, val) => {
    const next = items.map((it, idx) => idx === i ? { ...it, [field]: val } : it);
    onChange({ ...data, skills: next });
  };

  const add = () => onChange({ ...data, skills: [...items, empty()] });
  const remove = i => onChange({ ...data, skills: items.filter((_, idx) => idx !== i) });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap size={15} className="text-blue-400" />
          <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Skills</h3>
        </div>
        <button onClick={add} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition">
          <Plus size={13} /> Add Category
        </button>
      </div>

      <div className="space-y-3">
        {items.map((s, i) => (
          <div key={i} className="border border-slate-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Category Name</label>
                  <input
                    value={s.name}
                    onChange={e => update(i, "name", e.target.value)}
                    placeholder="e.g. Test Automation & Framework"
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Keywords <span className="text-slate-600">(comma-separated)</span>
                  </label>
                  <input
                    value={(s.keywords || []).join(", ")}
                    onChange={e => update(i, "keywords", e.target.value.split(",").map(k => k.trim()).filter(Boolean))}
                    placeholder="Playwright, Cypress, Jest"
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                  {s.keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {s.keywords.map((k, j) => (
                        <span key={j} className="px-2 py-0.5 bg-blue-900/40 border border-blue-800/60 text-blue-300 text-xs rounded-full">
                          {k}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => remove(i)} className="text-slate-600 hover:text-red-400 transition mt-6">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <button onClick={add} className="w-full border border-dashed border-slate-700 rounded-lg py-4 text-slate-500 text-sm hover:border-blue-500 hover:text-blue-400 transition">
            + Add skill category
          </button>
        )}
      </div>
    </div>
  );
}
