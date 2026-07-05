import React from "react";
import { GraduationCap, Plus, Trash2 } from "lucide-react";

const empty = () => ({
  institution: "", studyType: "BSc", area: "", startDate: "", endDate: "", gpa: "", location: ""
});

export default function EducationForm({ data, onChange }) {
  const items = data.education || [];

  const update = (i, field, val) => {
    const next = items.map((it, idx) => idx === i ? { ...it, [field]: val } : it);
    onChange({ ...data, education: next });
  };

  const add = () => onChange({ ...data, education: [...items, empty()] });
  const remove = i => onChange({ ...data, education: items.filter((_, idx) => idx !== i) });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GraduationCap size={15} className="text-blue-400" />
          <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Education</h3>
        </div>
        <button onClick={add} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition">
          <Plus size={13} /> Add
        </button>
      </div>

      <div className="space-y-5">
        {items.map((ed, i) => (
          <div key={i} className="border border-slate-700 rounded-lg p-4 relative">
            <button onClick={() => remove(i)} className="absolute top-3 right-3 text-slate-600 hover:text-red-400 transition">
              <Trash2 size={13} />
            </button>
            <div className="grid grid-cols-2 gap-3">
              <F label="Institution" value={ed.institution} onChange={v => update(i, "institution", v)} placeholder="University Name" className="col-span-2" />
              <F label="Degree Type" value={ed.studyType} onChange={v => update(i, "studyType", v)} placeholder="BSc / MSc / PhD" />
              <F label="Field of Study" value={ed.area} onChange={v => update(i, "area", v)} placeholder="Computer Science" />
              <F label="Start Date" value={ed.startDate} onChange={v => update(i, "startDate", v)} placeholder="Sep 2019" />
              <F label="End Date" value={ed.endDate} onChange={v => update(i, "endDate", v)} placeholder="Jun 2022" />
              <F label="GPA (optional)" value={ed.gpa} onChange={v => update(i, "gpa", v)} placeholder="4.0/5.0" />
              <F label="Location" value={ed.location} onChange={v => update(i, "location", v)} placeholder="City, State" />
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <button onClick={add} className="w-full border border-dashed border-slate-700 rounded-lg py-4 text-slate-500 text-sm hover:border-blue-500 hover:text-blue-400 transition">
            + Add education
          </button>
        )}
      </div>
    </div>
  );
}

function F({ label, value, onChange, placeholder, className = "" }) {
  return (
    <div className={className}>
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
