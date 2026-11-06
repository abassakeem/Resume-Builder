import React, { useState, useRef, useEffect, Suspense } from "react";
import ProfileForm from "./components/ProfileForm";
import EducationForm from "./components/EducationForm";
import WorkForm from "./components/WorkForm";
import SkillsForm from "./components/SkillsForm";
import ProjectsForm from "./components/ProjectsForm";
import TemplatePicker from "./components/TemplatePicker";
import Toast from "./components/Toast";
import { templates } from "./components/templateCatalog";
import { defaultData } from "./defaultData";
import {
  Upload,
  Download,
  FileText,
  RotateCcw,
  LayoutTemplate,
  User,
  GraduationCap,
  Briefcase,
  Zap,
  Code2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
} from "lucide-react";

const PdfPreview = React.lazy(() => import("./components/PdfPreview"));
const DownloadButton = React.lazy(() =>
  import("./components/PdfPreview").then(m => ({ default: m.DownloadButton }))
);

const SECTIONS = [
  { id: "template", label: "Template", icon: LayoutTemplate, description: "Pick a layout. You can switch at any time without losing anything you've typed." },
  { id: "profile", label: "Profile", icon: User, description: "Your name and how employers can reach you." },
  { id: "education", label: "Education", icon: GraduationCap, description: "Degrees and certifications, most recent first.", count: d => d.education?.length },
  { id: "work", label: "Work Experience", icon: Briefcase, description: "Most recent role first. Start each highlight with what you achieved.", count: d => d.work?.length },
  { id: "skills", label: "Skills", icon: Zap, description: "Group related skills so recruiters can scan them quickly.", count: d => d.skills?.length },
  { id: "projects", label: "Projects", icon: Code2, description: "Side projects or notable work that shows what you can build.", count: d => d.projects?.length },
];

const toolbarButton =
  "flex items-center gap-2 h-9 px-3 rounded-lg border border-neutral-700 bg-neutral-800/50 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition";

export default function App() {
  const [data, setData] = useState(defaultData);
  const [activeSection, setActiveSection] = useState("profile");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [view, setView] = useState("edit"); // "edit" | "preview" — only matters below the lg breakpoint
  const [toast, setToast] = useState(null);
  const fileRef = useRef();
  const scrollRef = useRef();
  const tabsRef = useRef();

  useEffect(() => {
    tabsRef.current?.querySelector('[aria-current="step"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeSection]);

  const notify = (type, title, message, action) =>
    setToast({ id: Date.now(), type, title, message, action });

  const activeIndex = SECTIONS.findIndex(s => s.id === activeSection);
  const section = SECTIONS[activeIndex];
  const prev = SECTIONS[activeIndex - 1];
  const next = SECTIONS[activeIndex + 1];
  const templateName = templates.find(t => t.id === data.selectedTemplate)?.name ?? "Classic";

  const goTo = id => {
    setActiveSection(id);
    setView("edit");
    scrollRef.current?.scrollTo({ top: 0 });
  };

  const handleImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
        setData(parsed);
        notify("success", "Resume imported", `Loaded your data from ${file.name}.`);
      } catch {
        notify("error", "Couldn't import that file", `${file.name} isn't valid resume JSON. Use a file saved with Export.`);
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
    notify("success", "Resume exported", `Saved as ${a.download}. Import it any time to pick up where you left off.`);
  };

  const handleReset = () => {
    const previous = data;
    setData(defaultData);
    setShowResetConfirm(false);
    notify("success", "Resume reset", "Your content was replaced with the sample resume.", {
      label: "Undo",
      onClick: () => setData(previous),
    });
  };

  const metaFor = s => (s.id === "template" ? templateName : s.count?.(data));

  return (
    <div className="h-screen flex flex-col bg-black text-neutral-100">
      {/* Top bar */}
      <header className="h-16 shrink-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 border-b border-neutral-800 bg-black">
        <div className="hidden sm:flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 shrink-0 bg-white rounded-lg flex items-center justify-center">
            <FileText size={16} className="text-black" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold tracking-tight text-white">ResumeForge</div>
            <div className="text-xs text-neutral-500">ATS-Ready Resume Builder</div>
          </div>
        </div>

        {/* Edit / Preview switch for narrow screens */}
        <div className="lg:hidden flex p-1 rounded-lg bg-neutral-800/70 border border-neutral-700">
          {[
            { id: "edit", label: "Edit", icon: Pencil },
            { id: "preview", label: "Preview", icon: Eye },
          ].map(v => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              aria-pressed={view === v.id}
              className={`flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium transition ${
                view === v.id ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <v.icon size={13} /> {v.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />

        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        <button type="button" onClick={() => fileRef.current.click()} className={toolbarButton} title="Import resume data from a JSON file">
          <Upload size={15} /> <span className="hidden md:inline">Import</span>
        </button>
        <button type="button" onClick={handleExport} className={toolbarButton} title="Save resume data as a JSON file">
          <Download size={15} /> <span className="hidden md:inline">Export</span>
        </button>
        {showResetConfirm ? (
          <div className="flex items-center gap-1 h-9 pl-3 pr-1 rounded-lg border border-red-900 bg-red-950/50">
            <span className="hidden md:inline text-xs text-red-200 mr-1">Reset everything?</span>
            <button type="button" onClick={handleReset} className="h-7 px-2.5 rounded-md bg-red-600 hover:bg-red-500 text-xs font-medium text-white transition">
              Reset
            </button>
            <button type="button" onClick={() => setShowResetConfirm(false)} className="h-7 px-2.5 rounded-md text-xs text-neutral-300 hover:bg-neutral-800 transition">
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setShowResetConfirm(true)} className={toolbarButton} title="Reset to starter template" aria-label="Reset">
            <RotateCcw size={15} />
          </button>
        )}

        <div className="hidden sm:block w-px h-6 bg-neutral-800 mx-1" />
        <Suspense
          fallback={
            <span className="flex items-center gap-2 h-9 px-4 bg-white/50 text-black/70 text-sm font-medium rounded-lg">
              <Download size={15} /> <span className="hidden sm:inline">Download PDF</span>
            </span>
          }
        >
          <DownloadButton data={data} />
        </Suspense>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Section navigation */}
        <nav aria-label="Resume sections" className="hidden md:flex w-60 shrink-0 flex-col border-r border-neutral-800 bg-black">
          <div className="px-5 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Sections</div>
          <ol className="flex-1 px-3 space-y-1">
            {SECTIONS.map((s, i) => {
              const active = s.id === activeSection;
              const meta = metaFor(s);
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => goTo(s.id)}
                    aria-current={active ? "step" : undefined}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm text-left transition ${
                      active ? "bg-neutral-800 text-white" : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
                    }`}
                  >
                    <span
                      className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-lg transition ${
                        active ? "bg-white text-black" : "bg-neutral-800 text-neutral-400"
                      }`}
                    >
                      <s.icon size={15} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block truncate font-medium">{s.label}</span>
                      <span className="block text-xs text-neutral-500">Step {i + 1}</span>
                    </span>
                    {meta != null && (
                      <span className={`text-xs tabular-nums ${active ? "text-neutral-300" : "text-neutral-500"}`}>{meta}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="px-5 py-4 text-xs text-neutral-600 border-t border-neutral-800">All data stays in your browser · No account needed</p>
        </nav>

        {/* Editor */}
        <main
          className={`${view === "edit" ? "flex" : "hidden"} lg:flex flex-1 lg:flex-none lg:w-[480px] min-w-0 flex-col border-r border-neutral-800 bg-black`}
        >
          {/* Section tabs for small screens */}
          <div ref={tabsRef} className="md:hidden flex gap-1 overflow-x-auto px-3 py-2 border-b border-neutral-800 bg-black">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => goTo(s.id)}
                aria-current={s.id === activeSection ? "step" : undefined}
                className={`flex items-center gap-1.5 shrink-0 h-8 px-3 rounded-md text-xs font-medium transition ${
                  s.id === activeSection ? "bg-white text-black" : "text-neutral-400 hover:bg-neutral-800"
                }`}
              >
                <s.icon size={13} /> {s.label}
              </button>
            ))}
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="px-6 pt-6 pb-8">
              <div className="mb-6">
                <div className="text-xs font-medium text-neutral-400">
                  Step {activeIndex + 1} of {SECTIONS.length}
                </div>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-white">{section.label}</h1>
                <p className="mt-1 text-sm text-neutral-400">{section.description}</p>
              </div>

              <div className="@container">
                {activeSection === "template" && <TemplatePicker selected={data.selectedTemplate} onSelect={id => setData(d => ({ ...d, selectedTemplate: id }))} />}
                {activeSection === "profile" && <ProfileForm data={data} onChange={setData} />}
                {activeSection === "education" && <EducationForm data={data} onChange={setData} />}
                {activeSection === "work" && <WorkForm data={data} onChange={setData} />}
                {activeSection === "skills" && <SkillsForm data={data} onChange={setData} />}
                {activeSection === "projects" && <ProjectsForm data={data} onChange={setData} />}
              </div>
            </div>
          </div>

          {/* Step navigation */}
          <div className="shrink-0 flex items-center justify-between gap-3 px-6 py-3 border-t border-neutral-800 bg-black">
            {prev ? (
              <button type="button" onClick={() => goTo(prev.id)} className={toolbarButton}>
                <ChevronLeft size={15} /> {prev.label}
              </button>
            ) : <span />}
            {next ? (
              <button
                type="button"
                onClick={() => goTo(next.id)}
                className="flex items-center gap-2 h-9 px-4 rounded-lg bg-white hover:bg-neutral-200 text-sm font-medium text-black transition"
              >
                Next: {next.label} <ChevronRight size={15} />
              </button>
            ) : (
              <>
                <span className="hidden lg:inline text-xs text-neutral-500">All done. Download your PDF from the top bar.</span>
                <button
                  type="button"
                  onClick={() => setView("preview")}
                  className="lg:hidden flex items-center gap-2 h-9 px-4 rounded-lg bg-white hover:bg-neutral-200 text-sm font-medium text-black transition"
                >
                  <Eye size={15} /> Preview resume
                </button>
              </>
            )}
          </div>
        </main>

        {/* Preview */}
        <section
          aria-label="Resume preview"
          className={`${view === "preview" ? "flex" : "hidden"} lg:flex flex-1 min-w-0 flex-col bg-black`}
        >
          <div className="h-11 shrink-0 flex items-center justify-between px-4 border-b border-neutral-800 bg-black">
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" />
              </span>
              Live preview
            </div>
            <button
              type="button"
              onClick={() => goTo("template")}
              className="text-xs text-neutral-400 hover:text-white transition"
            >
              Template: <span className="font-medium text-neutral-200">{templateName}</span> · Change
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <Suspense
              fallback={
                <div className="h-full flex items-center justify-center text-sm text-neutral-500">
                  Loading preview...
                </div>
              }
            >
              <PdfPreview data={data} />
            </Suspense>
          </div>
        </section>
      </div>

      {toast && <Toast key={toast.id} toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
