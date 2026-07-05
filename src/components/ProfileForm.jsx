import React from "react";
import { User } from "lucide-react";

export default function ProfileForm({ data, onChange }) {
  const b = data.basics || {};
  const set = (key, val) =>
    onChange({ ...data, basics: { ...b, [key]: val } });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <User size={15} className="text-blue-400" />
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Profile</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Full Name" value={b.name} onChange={v => set("name", v)} placeholder="Jane Smith" />
        <Field label="Email" value={b.email} onChange={v => set("email", v)} placeholder="jane@email.com" type="email" />
        <Field label="Phone" value={b.phone} onChange={v => set("phone", v)} placeholder="+1 555 000 0000" />
        <Field label="Location" value={b.location?.address} onChange={v => set("location", { address: v })} placeholder="City, Country" />
        <Field label="Website / Portfolio" value={b.website} onChange={v => set("website", v)} placeholder="https://yoursite.com" className="col-span-2" />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", className = "" }) {
  return (
    <div className={className}>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <input
        type={type}
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
      />
    </div>
  );
}
