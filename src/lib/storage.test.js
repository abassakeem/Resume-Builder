import { describe, it, expect } from "vitest";
import { STORAGE_KEY, loadSaved, saveState, clearSaved, parseSaved, sameData, contentDiffers, timeAgo } from "./storage";
import { blankCv } from "./cv/model";
import { defaultData } from "../defaultData";

// Minimal in-memory stand-in for window.localStorage.
const memoryStorage = () => {
  const map = new Map();
  return {
    getItem: k => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: k => map.delete(k),
    map,
  };
};

const state = {
  resume: defaultData,
  cv: { ...blankCv(), basics: { ...blankCv().basics, name: "Ada" } },
  docType: "cv",
  resumeSection: "work",
  cvSection: "publications",
};

describe("saveState / loadSaved", () => {
  it("round-trips the editor state", () => {
    const storage = memoryStorage();
    expect(saveState(state, storage, 1000)).toEqual({ ok: true });
    const loaded = loadSaved(storage);
    expect(loaded.resume).toEqual(defaultData);
    expect(loaded.cv.basics.name).toBe("Ada");
    expect(loaded).toMatchObject({ docType: "cv", resumeSection: "work", cvSection: "publications", savedAt: 1000 });
  });

  it("returns null when nothing is saved", () => {
    expect(loadSaved(memoryStorage())).toBeNull();
  });

  it("reports a full quota and unavailable storage instead of throwing", () => {
    const full = { setItem: () => { throw Object.assign(new Error("full"), { name: "QuotaExceededError" }); } };
    expect(saveState(state, full)).toEqual({ ok: false, reason: "full" });
    const broken = { setItem: () => { throw new Error("SecurityError"); } };
    expect(saveState(state, broken)).toEqual({ ok: false, reason: "error" });
    expect(saveState(state, null)).toEqual({ ok: false, reason: "unavailable" });
    expect(loadSaved({ getItem: () => { throw new Error("blocked"); } })).toBeNull();
  });

  it("clears saved data", () => {
    const storage = memoryStorage();
    saveState(state, storage);
    expect(clearSaved(storage)).toBe(true);
    expect(storage.map.has(STORAGE_KEY)).toBe(false);
  });
});

describe("parseSaved", () => {
  it("ignores corrupt JSON, other versions and empty payloads", () => {
    expect(parseSaved("{not json")).toBeNull();
    expect(parseSaved(JSON.stringify({ version: 99, resume: {} }))).toBeNull();
    expect(parseSaved(JSON.stringify({ version: 1 }))).toBeNull();
    expect(parseSaved(null)).toBeNull();
  });

  it("drops a CV stored in the resume slot and opens the resume if the CV is missing", () => {
    const parsed = parseSaved(JSON.stringify({ version: 1, resume: blankCv(), cv: { not: "a cv" }, docType: "cv" }));
    expect(parsed).toBeNull();
    const resumeOnly = parseSaved(JSON.stringify({ version: 1, resume: defaultData, cv: null, docType: "cv" }));
    expect(resumeOnly).toMatchObject({ docType: "resume", cv: null });
  });

  it("fills in missing CV fields from older saves", () => {
    const parsed = parseSaved(JSON.stringify({ version: 1, cv: { docType: "cv", basics: { name: "Ada" } } }));
    expect(parsed.cv.publications).toEqual([]);
    expect(parsed.resume).toBeNull();
  });
});

describe("contentDiffers", () => {
  it("ignores key order and the open step, but not edits", () => {
    expect(sameData({ a: 1, b: [1, { c: 2 }] }, { b: [1, { c: 2 }], a: 1 })).toBe(true);
    expect(sameData([1, 2], [2, 1])).toBe(false);
    expect(sameData({ a: 1 }, { a: 1, b: undefined })).toBe(false);

    const current = { resume: defaultData, cv: null, docType: "resume", resumeSection: "work" };
    const roundTripped = parseSaved(JSON.stringify({ version: 1, ...current, resumeSection: "skills", docType: "cv" }));
    expect(contentDiffers(roundTripped, current)).toBe(false);
    const edited = { ...current, resume: { ...defaultData, basics: { ...defaultData.basics, name: "Changed" } } };
    expect(contentDiffers(edited, current)).toBe(true);
    expect(contentDiffers({ ...current, cv: blankCv() }, current)).toBe(true);
  });

  it("treats a CV normalised on load as unchanged", () => {
    const cv = { docType: "cv", basics: { name: "Ada" } };
    const loaded = parseSaved(JSON.stringify({ version: 1, cv }));
    expect(contentDiffers(loaded, { resume: null, cv: loaded.cv })).toBe(false);
  });
});

describe("timeAgo", () => {
  const now = Date.UTC(2026, 10, 24, 12);
  it("describes how long ago something was saved", () => {
    expect(timeAgo(now - 20_000, now)).toBe("just now");
    expect(timeAgo(now - 60_000, now)).toBe("1 minute ago");
    expect(timeAgo(now - 5 * 3600_000, now)).toBe("5 hours ago");
    expect(timeAgo(now - 26 * 3600_000, now)).toBe("yesterday");
    expect(timeAgo(now - 3 * 86400_000, now)).toBe("3 days ago");
    expect(timeAgo(now - 30 * 86400_000, now)).toMatch(/^on /);
    expect(timeAgo(null, now)).toBe("earlier");
  });
});
