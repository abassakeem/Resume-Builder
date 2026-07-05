import React, { useState, useRef, Suspense } from "react";
import ProfileForm from "./components/ProfileForm";
import EducationForm from "./components/EducationForm";
import WorkForm from "./components/WorkForm";
import SkillsForm from "./components/SkillsForm";
import ProjectsForm from "./components/ProjectsForm";
import TemplatePicker from "./components/TemplatePicker";
import { defaultData } from "./defaultData";
import {
  Upload,
  Download,
  FileText,
  RefreshCw,
} from "lucide-react";

const PdfPreview = React.lazy(() => import("./components/PdfPreview"));

const SECTIONS = [
  { id: "template", label: "Template" },
  { id: "profile", label: "Profile" },
  { id: "education", label: "Education" },
  { id: "work", label: "Work Experience" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
];

export default function App() {
  const [data, setData] = useState(defaultData);
  const [activeSection, setActiveSection] = useState("profile");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileRef = useRef();

  const handleImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        setData(parsed);
        alert("Resume data imported successfully!");
      } catch {
        alert("Invalid JSON file. Please check the format.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(data.basics?.name || "resume").replace(/\s+/g, "_")}_data.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setData(defaultData);
    setShowResetConfirm(false);
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#020617" }}>
      {/* Sidebar */}
      <div style={{ width: 320, flexShrink: 0, background: "#0f172a", borderRight: "1px solid #1e293b", display: "flex", flexDirection: "column" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: "1px solid #1e293b" }}>
          <div style={{ width: 28, height: 28, background: "#2563eb", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileText size={14} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc", letterSpacing: "-0.3px" }}>ResumeForge</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>ATS-Ready Resume Builder</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #1e293b", display: "flex", gap: 8 }}>
          <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} />
          <button
            onClick={() => fileRef.current.click()}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#cbd5e1", fontSize: 11, cursor: "pointer" }}
          >
            <Upload size={11} /> Import JSON
          </button>
          <button
            onClick={handleExport}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#cbd5e1", fontSize: 11, cursor: "pointer" }}
          >
            <Download size={11} /> Export JSON
          </button>
          {showResetConfirm ? (
            <button
              onClick={handleReset}
              style={{ padding: "8px 12px", background: "rgba(127,29,29,0.4)", border: "1px solid #7f1d1d", borderRadius: 8, color: "#fca5a5", fontSize: 11, cursor: "pointer" }}
            >
              Confirm
            </button>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              title="Reset"
              style={{ padding: "8px 10px", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#64748b", cursor: "pointer" }}
            >
              <RefreshCw size={12} />
            </button>
          )}
        </div>

        {/* Section Nav */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #1e293b", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 500,
                cursor: "pointer",
                border: "none",
                background: activeSection === s.id ? "#2563eb" : "transparent",
                color: activeSection === s.id ? "#fff" : "#94a3b8",
                transition: "all 0.15s",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Form Area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>
          {activeSection === "template" && <TemplatePicker selected={data.selectedTemplate} onSelect={id => setData(d => ({ ...d, selectedTemplate: id }))} />}
          {activeSection === "profile" && <ProfileForm data={data} onChange={setData} />}
          {activeSection === "education" && <EducationForm data={data} onChange={setData} />}
          {activeSection === "work" && <WorkForm data={data} onChange={setData} />}
          {activeSection === "skills" && <SkillsForm data={data} onChange={setData} />}
          {activeSection === "projects" && <ProjectsForm data={data} onChange={setData} />}
        </div>

        <div style={{ padding: "12px 16px", borderTop: "1px solid #1e293b", textAlign: "center" }}>
          <p style={{ fontSize: 10, color: "#334155", margin: 0 }}>All data stays in your browser · No account needed</p>
        </div>
      </div>

      {/* Preview */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Suspense fallback={
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: 13 }}>
            Loading preview...
          </div>
        }>
          <PdfPreview data={data} />
        </Suspense>
      </div>
    </div>
  );
}
