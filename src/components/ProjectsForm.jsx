import React from "react";
import { Code2, Plus, Trash2 } from "lucide-react";

const empty = () => ({ name: "", url: "", keywords: [], description: "" });

export default function ProjectsForm({ data, onChange }) {
  const items = data.projects || [];

  const update = (i, field, val) => {
    const next = items.map((it, idx) => idx === i ? { ...it, [field]: val } : it);
    onChange({ ...data, projects: next });
  };

  const add = () => onChange({ ...data, projects: [...items, empty()] });
  const remove = i => onChange({ ...data, projects: items.filter((_, idx) => idx !== i) });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Code2 size={15} className="text-blue-400" />
          <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Projects</h3>
        </div>
        <button onClick={add} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition">
          <Plus size={13} /> Add Project
        </button>
      </div>

      <div className="space-y-4">
        {items.map((p, i) => (
          <div key={i} className="border border-slate-700 rounded-lg p-4 relative">
            <button onClick={() => remove(i)} className="absolute top-3 right-3 text-slate-600 hover:text-red-400 transition">
              <Trash2 size={13} />
            </button>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <F label="Project Name" value={p.name} onChange={v => update(i, "name", v)} placeholder="My Awesome Project" />
                <F label="URL (optional)" value={p.url} onChange={v => update(i, "url", v)} placeholder="https://project.com" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Tech Stack <span className="text-slate-600">(comma-separated)</span>
                </label>
                <input
                  value={(p.keywords || []).join(", ")}
                  onChange={e => update(i, "keywords", e.target.value.split(",").map(k => k.trim()).filter(Boolean))}
                  placeholder="React, Node.js, PostgreSQL"
                  className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
                {p.keywords?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.keywords.map((k, j) => (
                      <span key={j} className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">
                        {k}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Description</label>
                <textarea
                  value={p.description || ""}
                  onChange={e => update(i, "description", e.target.value)}
                  rows={3}
                  placeholder="What did you build, what was the impact?"
                  className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none"
                />
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <button onClick={add} className="w-full border border-dashed border-slate-700 rounded-lg py-4 text-slate-500 text-sm hover:border-blue-500 hover:text-blue-400 transition">
            + Add project
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
