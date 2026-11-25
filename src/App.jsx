import React, { useState, useRef, useEffect, Suspense } from "react";
import ProfileForm from "./components/ProfileForm";
import EducationForm from "./components/EducationForm";
import WorkForm from "./components/WorkForm";
import SkillsForm from "./components/SkillsForm";
import ProjectsForm from "./components/ProjectsForm";
import TemplatePicker from "./components/TemplatePicker";
import Toast from "./components/Toast";
import SaveStatus from "./components/SaveStatus";
import CvEditor from "./components/cv/CvEditor";
import CvStartDialog from "./components/cv/CvStartDialog";
import { CV_STEPS } from "./components/cv/cvSteps";
import { cvTemplates } from "./components/cv/cvTemplateCatalog";
import { templates } from "./components/templateCatalog";
import { defaultData } from "./defaultData";
import { sampleCv } from "./cvSampleData";
import { blankCv, isCvData, normalizeCv } from "./lib/cv/model";
import { cvFromResume, mergeResumeIntoCv } from "./lib/cv/fromResume";
import { STORAGE_KEY, loadSaved, saveState, clearSaved, parseSaved, contentDiffers, timeAgo } from "./lib/storage";
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

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

const describeImport = d => {
  const skills = d.skills.reduce((n, s) => n + s.keywords.length, 0);
  return `Found ${plural(d.work.length, "job")}, ${plural(d.education.length, "school")}, ${plural(skills, "skill")} and ${plural(d.projects.length, "project")}.`;
};

// Autosave waits this long after the last change before writing.
const SAVE_DELAY_MS = 500;

const validStep = (steps, id) => (steps.some(s => s.id === id) ? id : null);

const DOC_TYPES = [
  { id: "resume", label: "Resume", short: "Resume" },
  { id: "cv", label: "Academic CV", short: "CV" },
];

// Resume / Academic CV switch. `wide` stretches it across its own row on small screens.
function DocTypeSwitch({ isCv, onSwitch, className = "", wide = false }) {
  return (
    <div role="group" aria-label="Document type" className={`p-1 rounded-lg bg-neutral-800/70 border border-neutral-700 ${className}`}>
      {DOC_TYPES.map(t => {
        const active = (t.id === "cv") === isCv;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSwitch(t.id)}
            aria-pressed={active}
            className={`${wide ? "flex-1" : ""} h-7 px-2.5 rounded-md text-xs font-medium transition ${
              active ? "bg-white text-black" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {wide ? t.label : (
              <>
                <span className="lg:hidden">{t.short}</span>
                <span className="hidden lg:inline">{t.label}</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

const toolbarButton =
  "flex items-center gap-2 h-9 px-3 rounded-lg border border-neutral-700 bg-neutral-800/50 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition";

export default function App() {
  // Whatever was saved in this browser last time, read once on load.
  const [saved] = useState(loadSaved);
  const [data, setData] = useState(() => saved?.resume ?? defaultData);
  const [activeSection, setActiveSection] = useState(() => validStep(SECTIONS, saved?.resumeSection) ?? "profile");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [view, setView] = useState("edit"); // "edit" | "preview" — only matters below the lg breakpoint
  const [toast, setToast] = useState(() =>
    saved
      ? {
          id: 0,
          type: "success",
          title: "Welcome back",
          message: `Picked up where you left off (saved ${timeAgo(saved.savedAt)}). Changes save automatically in this browser.`,
        }
      : null
  );
  // The Academic CV is a separate document, created the first time the user switches to it.
  const [docType, setDocType] = useState(() => saved?.docType ?? "resume"); // "resume" | "cv"
  const [cvData, setCvData] = useState(() => saved?.cv ?? null);
  const [cvSection, setCvSection] = useState(() => validStep(CV_STEPS, saved?.cvSection) ?? "profile");
  const [showCvStart, setShowCvStart] = useState(false);
  const [saveStatus, setSaveStatus] = useState(saved ? "saved" : "idle");
  const [savedAt, setSavedAt] = useState(saved?.savedAt ?? null);
  const [conflict, setConflict] = useState(null); // newer state saved by another tab
  const [pageCount, setPageCount] = useState(null);
  const fileRef = useRef();
  const scrollRef = useRef();
  const tabsRef = useRef();

  // ---- Autosave ------------------------------------------------------------------------------
  // The persisted state, and a JSON snapshot of what storage currently holds. Saving only
  // happens when the snapshot differs, so loading the page never writes anything.
  const persisted = { resume: data, cv: cvData, docType, resumeSection: activeSection, cvSection };
  const snapshot = JSON.stringify(persisted);
  const latestRef = useRef(persisted);
  latestRef.current = persisted;
  const storedRef = useRef(snapshot);
  const conflictRef = useRef(null);
  conflictRef.current = conflict;
  const warnedRef = useRef(false);

  // Uses only refs and state setters, so the copies captured by listeners stay correct.
  const persist = ({ force = false } = {}) => {
    if (conflictRef.current && !force) {
      setSaveStatus("conflict");
      return { ok: false, reason: "conflict" };
    }
    const result = saveState(latestRef.current);
    if (result.ok) {
      storedRef.current = JSON.stringify(latestRef.current);
      warnedRef.current = false;
      setSaveStatus("saved");
      setSavedAt(Date.now());
    } else {
      setSaveStatus("failed");
      if (!warnedRef.current) {
        warnedRef.current = true;
        setToast({
          id: Date.now(),
          type: "warning",
          title: "Your changes aren't being saved",
          message:
            result.reason === "full"
              ? "This browser's storage is full. Use Export to keep a copy of your work."
              : "This browser is blocking storage (e.g. a private window). Use Export to keep a copy of your work.",
        });
      }
    }
    return result;
  };

  useEffect(() => {
    if (snapshot === storedRef.current) return;
    if (conflictRef.current) {
      setSaveStatus("conflict");
      return;
    }
    setSaveStatus("saving");
    const timer = setTimeout(persist, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
    // persist reads the latest state through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot]);

  useEffect(() => {
    // Save straight away when the tab is hidden or closed, so the last half-second isn't lost.
    const flush = () => {
      if (JSON.stringify(latestRef.current) !== storedRef.current) persist();
    };
    const onVisibility = () => document.visibilityState === "hidden" && flush();
    // Another tab saved different content: stop autosaving here until the user picks which
    // version to keep. A save that only moved to another step isn't a conflict.
    const onStorage = e => {
      if (e.key !== STORAGE_KEY) return;
      const incoming = parseSaved(e.newValue);
      if (!incoming || !contentDiffers(incoming, latestRef.current)) return;
      setConflict(incoming);
      setSaveStatus("conflict");
    };
    // Ctrl/Cmd+S saves now instead of opening the browser's "Save page" dialog.
    const onKeyDown = e => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        const result = persist();
        if (result.ok) {
          setToast({ id: Date.now(), type: "success", title: "Saved", message: "Your work is saved in this browser. Use Download PDF when you need a file." });
        }
      }
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("storage", onStorage);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyState = state => {
    setData(state.resume ?? defaultData);
    setCvData(state.cv ?? null);
    setDocType(state.cv && state.docType === "cv" ? "cv" : "resume");
    setActiveSection(validStep(SECTIONS, state.resumeSection) ?? "profile");
    setCvSection(validStep(CV_STEPS, state.cvSection) ?? "profile");
  };

  const loadNewer = () => {
    const incoming = conflict;
    // What the other tab saved is already in storage: adopt it without writing again.
    storedRef.current = JSON.stringify({
      resume: incoming.resume ?? defaultData,
      cv: incoming.cv ?? null,
      docType: incoming.cv && incoming.docType === "cv" ? "cv" : "resume",
      resumeSection: validStep(SECTIONS, incoming.resumeSection) ?? "profile",
      cvSection: validStep(CV_STEPS, incoming.cvSection) ?? "profile",
    });
    conflictRef.current = null;
    setConflict(null);
    applyState(incoming);
    setSaveStatus("saved");
    setSavedAt(incoming.savedAt);
    setShowCvStart(false);
  };

  const keepMine = () => {
    conflictRef.current = null;
    setConflict(null);
    persist({ force: true });
  };

  const handleClearSaved = () => {
    const previous = latestRef.current;
    const cleared = { resume: defaultData, cv: null, docType: "resume", resumeSection: "profile", cvSection: "profile" };
    clearSaved();
    // Storage is now empty; don't write the starter content straight back.
    storedRef.current = JSON.stringify(cleared);
    applyState(cleared);
    setSaveStatus("idle");
    setSavedAt(null);
    setShowResetConfirm(false);
    notify("success", "Saved data cleared", "Your resume and CV were removed from this browser.", {
      label: "Undo",
      onClick: () => applyState(previous),
    });
  };

  const isCv = docType === "cv" && cvData != null;
  const steps = isCv ? CV_STEPS : SECTIONS;
  const doc = isCv ? cvData : data;
  const currentSection = isCv ? cvSection : activeSection;
  const docLabel = isCv ? "CV" : "resume";

  useEffect(() => {
    tabsRef.current?.querySelector('[aria-current="step"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [currentSection]);

  const notify = (type, title, message, action) =>
    setToast({ id: Date.now(), type, title, message, action });

  const activeIndex = Math.max(0, steps.findIndex(s => s.id === currentSection));
  const section = steps[activeIndex];
  const prev = steps[activeIndex - 1];
  const next = steps[activeIndex + 1];
  const templateName = isCv
    ? cvTemplates.find(t => t.id === cvData.selectedTemplate)?.name ?? "Classic"
    : templates.find(t => t.id === data.selectedTemplate)?.name ?? "Classic";

  const goTo = id => {
    (isCv ? setCvSection : setActiveSection)(id);
    setView("edit");
    scrollRef.current?.scrollTo({ top: 0 });
  };

  const switchDoc = type => {
    setShowResetConfirm(false);
    if (type === "cv" && !cvData) {
      setShowCvStart(true);
      return;
    }
    setDocType(type);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  const startCv = choice => {
    const cv = choice === "resume" ? cvFromResume(data) : choice === "sample" ? sampleCv() : blankCv();
    setCvData(cv);
    setCvSection(choice === "sample" ? "template" : "profile");
    setDocType("cv");
    setShowCvStart(false);
    scrollRef.current?.scrollTo({ top: 0 });
    const messages = {
      resume: "Your contact details, education, experience and skills were copied over. Edits here won't change your resume.",
      sample: "Loaded a sample graduate applicant. Replace it with your own details, or try the templates first.",
      blank: "Start with your header, then add education and publications.",
    };
    notify("success", "Academic CV created", messages[choice]);
  };

  const handleImport = async e => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const snapshot = { data, cvData, docType };
    const undo = {
      label: "Undo",
      onClick: () => {
        setData(snapshot.data);
        setCvData(snapshot.cvData);
        setDocType(snapshot.docType);
      },
    };

    // A saved CV always opens as the CV, and a saved resume as the resume, whichever is showing.
    const load = (loaded, how) => {
      if (isCvData(loaded)) {
        setCvData(normalizeCv(loaded));
        setDocType("cv");
        notify("success", "CV imported", `${how} ${file.name}.`, undo);
      } else {
        setData(loaded);
        setDocType("resume");
        notify("success", "Resume imported", `${how} ${file.name}.`, undo);
      }
    };

    try {
      if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
        const { importResumePdf } = await import("./lib/importResumePdf");
        const result = await importResumePdf(await file.arrayBuffer());
        if (result.kind === "embedded") {
          load(result.data, "Restored everything from");
        } else if (isCv) {
          setCvData(cv => mergeResumeIntoCv(cv, result.data));
          notify("warning", "Imported from PDF text", `${describeImport(result.data)} Contact details, education, experience and skills were added to your CV, so check each section.`, undo);
        } else {
          setData(d => ({ ...d, ...result.data }));
          notify("warning", "Imported from PDF text", `${describeImport(result.data)} Some details may be in the wrong field, so check each section.`, undo);
        }
        return;
      }

      const parsed = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
      load(parsed, "Loaded your data from");
    } catch (err) {
      notify("error", "Couldn't import that file", err?.userMessage ?? `${file.name} isn't a resume PDF or a JSON file saved with Export.`);
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = isCv
      ? `${(cvData.basics?.name || "cv").replace(/\s+/g, "_")}_CV_data.json`
      : `${(data.basics?.name || "resume").replace(/\s+/g, "_")}_data.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify("success", isCv ? "CV exported" : "Resume exported", `Saved as ${a.download}. Import it any time to pick up where you left off.`);
  };

  const handleReset = () => {
    setShowResetConfirm(false);
    if (isCv) {
      const previous = cvData;
      setCvData(sampleCv());
      notify("success", "CV reset", "Your CV was replaced with the sample CV. Your resume wasn't changed.", {
        label: "Undo",
        onClick: () => setCvData(previous),
      });
      return;
    }
    const previous = data;
    setData(defaultData);
    notify("success", "Resume reset", "Your content was replaced with the sample resume.", {
      label: "Undo",
      onClick: () => setData(previous),
    });
  };

  const metaFor = s => (s.id === "template" ? templateName : s.count?.(doc));

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

        <DocTypeSwitch isCv={isCv} onSwitch={switchDoc} className="hidden sm:flex" />

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

        <input ref={fileRef} type="file" accept=".pdf,.json,application/pdf,application/json" className="hidden" onChange={handleImport} />
        <button type="button" onClick={() => fileRef.current.click()} className={toolbarButton} title="Import a PDF or a JSON file saved with Export">
          <Upload size={15} /> <span className="hidden md:inline">Import</span>
        </button>
        <button type="button" onClick={handleExport} className={toolbarButton} title={`Save ${docLabel} data as a JSON file`}>
          <Download size={15} /> <span className="hidden md:inline">Export</span>
        </button>
        {showResetConfirm ? (
          <div className="flex items-center gap-1 h-9 pl-3 pr-1 rounded-lg border border-red-900 bg-red-950/50">
            <span className="hidden md:inline text-xs text-red-200 mr-1">{isCv ? "Reset CV?" : "Reset everything?"}</span>
            <button type="button" onClick={handleReset} className="h-7 px-2.5 rounded-md bg-red-600 hover:bg-red-500 text-xs font-medium text-white transition">
              Reset
            </button>
            <button type="button" onClick={() => setShowResetConfirm(false)} className="h-7 px-2.5 rounded-md text-xs text-neutral-300 hover:bg-neutral-800 transition">
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setShowResetConfirm(true)} className={toolbarButton} title={isCv ? "Reset CV to the sample" : "Reset to starter template"} aria-label="Reset">
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
          <DownloadButton data={doc} />
        </Suspense>
      </header>
      {/* On phones the switch gets its own row so the top bar still fits. */}
      <div className="sm:hidden shrink-0 px-3 py-2 border-b border-neutral-800 bg-black">
        <DocTypeSwitch isCv={isCv} onSwitch={switchDoc} className="flex" wide />
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Section navigation */}
        <nav aria-label={isCv ? "CV sections" : "Resume sections"} className="hidden md:flex w-60 shrink-0 flex-col border-r border-neutral-800 bg-black">
          <div className="px-5 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Sections</div>
          <ol className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 space-y-1">
            {steps.map((s, i) => {
              const active = s.id === currentSection;
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
          <p className="px-5 py-4 text-xs text-neutral-600 border-t border-neutral-800">Saved automatically in this browser · No account needed</p>
        </nav>

        {/* Editor */}
        <main
          className={`${view === "edit" ? "flex" : "hidden"} lg:flex flex-1 lg:flex-none lg:w-[480px] min-w-0 flex-col border-r border-neutral-800 bg-black`}
        >
          {/* Section tabs for small screens */}
          <div ref={tabsRef} className="md:hidden flex gap-1 overflow-x-auto px-3 py-2 border-b border-neutral-800 bg-black">
            {steps.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => goTo(s.id)}
                aria-current={s.id === currentSection ? "step" : undefined}
                className={`flex items-center gap-1.5 shrink-0 h-8 px-3 rounded-md text-xs font-medium transition ${
                  s.id === currentSection ? "bg-white text-black" : "text-neutral-400 hover:bg-neutral-800"
                }`}
              >
                <s.icon size={13} /> {s.label}
              </button>
            ))}
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="px-6 pt-6 pb-8">
              <div className="mb-6">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-neutral-400">
                  <span>Step {activeIndex + 1} of {steps.length}</span>
                  <span aria-hidden="true" className="text-neutral-700">·</span>
                  <SaveStatus status={saveStatus} savedAt={savedAt} onLoadNewer={loadNewer} onKeepMine={keepMine} onClear={handleClearSaved} />
                </div>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-white">{section.label}</h1>
                <p className="mt-1 text-sm text-neutral-400">{section.description}</p>
              </div>

              <div className="@container">
                {isCv ? (
                  <CvEditor step={cvSection} cv={cvData} onChange={setCvData} notify={notify} onGoTo={goTo} />
                ) : (
                  <>
                    {activeSection === "template" && <TemplatePicker selected={data.selectedTemplate} onSelect={id => setData(d => ({ ...d, selectedTemplate: id }))} />}
                    {activeSection === "profile" && <ProfileForm data={data} onChange={setData} />}
                    {activeSection === "education" && <EducationForm data={data} onChange={setData} />}
                    {activeSection === "work" && <WorkForm data={data} onChange={setData} />}
                    {activeSection === "skills" && <SkillsForm data={data} onChange={setData} />}
                    {activeSection === "projects" && <ProjectsForm data={data} onChange={setData} />}
                  </>
                )}
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
                  <Eye size={15} /> Preview {docLabel}
                </button>
              </>
            )}
          </div>
        </main>

        {/* Preview */}
        <section
          aria-label={isCv ? "CV preview" : "Resume preview"}
          className={`${view === "preview" ? "flex" : "hidden"} lg:flex flex-1 min-w-0 flex-col bg-black`}
        >
          <div className="h-11 shrink-0 flex items-center justify-between px-4 border-b border-neutral-800 bg-black">
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" />
              </span>
              Live preview
              {pageCount != null && (
                <span className="text-neutral-500">
                  · {pageCount} {pageCount === 1 ? "page" : "pages"}
                  {!isCv && pageCount > 2 && <span className="text-amber-300/90"> · most resumes fit on 1–2</span>}
                </span>
              )}
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
              <PdfPreview data={doc} onPages={setPageCount} />
            </Suspense>
          </div>
        </section>
      </div>

      {showCvStart && <CvStartDialog onChoose={startCv} onCancel={() => setShowCvStart(false)} />}
      {toast && <Toast key={toast.id} toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
