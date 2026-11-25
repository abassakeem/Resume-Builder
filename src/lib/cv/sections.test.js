import { describe, it, expect } from "vitest";
import { blankCv, DEFAULT_SECTION_ORDER, normalizeCv } from "./model";
import {
  sectionOrder, moveSection, toggleHidden, prepareCv, visibleSections, sectionTitle, customSectionKey,
} from "./sections";
import { sampleCv } from "../../cvSampleData";

const cvWith = patch => ({ ...blankCv(), ...patch });

describe("sectionOrder", () => {
  it("defaults to the recommended order with education before experience", () => {
    const order = sectionOrder(blankCv());
    expect(order).toEqual(DEFAULT_SECTION_ORDER);
    expect(order.indexOf("education")).toBeLessThan(order.indexOf("research"));
    expect(order.indexOf("education")).toBeLessThan(order.indexOf("work"));
  });

  it("drops unknown and duplicate keys and appends missing sections", () => {
    const cv = cvWith({
      sectionOrder: ["publications", "bogus", "publications", "education"],
      customSections: [{ id: "x", title: "Fieldwork", items: [] }],
    });
    const order = sectionOrder(cv);
    expect(order.slice(0, 2)).toEqual(["publications", "education"]);
    expect(order).not.toContain("bogus");
    expect(order.filter(k => k === "publications")).toHaveLength(1);
    expect(order.at(-1)).toBe("custom:x");
    expect(order).toHaveLength(DEFAULT_SECTION_ORDER.length + 1);
  });
});

describe("moveSection and toggleHidden", () => {
  it("swaps a key with its neighbour and ignores moves past either end", () => {
    expect(moveSection(["a", "b", "c"], "b", -1)).toEqual(["b", "a", "c"]);
    expect(moveSection(["a", "b", "c"], "b", 1)).toEqual(["a", "c", "b"]);
    expect(moveSection(["a", "b", "c"], "a", -1)).toEqual(["a", "b", "c"]);
    expect(moveSection(["a", "b", "c"], "c", 1)).toEqual(["a", "b", "c"]);
  });

  it("toggles a key in the hidden list", () => {
    expect(toggleHidden([], "awards")).toEqual(["awards"]);
    expect(toggleHidden(["awards", "grants"], "awards")).toEqual(["grants"]);
  });
});

describe("visibleSections", () => {
  it("prints nothing for an empty CV", () => {
    expect(visibleSections(prepareCv(blankCv()))).toEqual([]);
  });

  it("hides sections that only contain blank entries or default dropdown values", () => {
    const cv = cvWith({
      awards: [{ name: " ", awarder: "", year: "", amount: "" }],
      publications: [{ status: "journal", authors: [""], title: "" }],
      presentations: [{ type: "oral", title: "", event: "" }],
      research: [{ role: "", highlights: ["", "  "] }],
    });
    expect(visibleSections(prepareCv(cv))).toEqual([]);
  });

  it("follows the saved order and leaves out sections the user hid", () => {
    const cv = cvWith({
      sectionOrder: ["awards", "education"],
      hiddenSections: ["languages"],
      education: [{ institution: "University of Manchester" }],
      awards: [{ name: "Scholarship" }],
      languages: [{ language: "French" }],
    });
    expect(visibleSections(prepareCv(cv))).toEqual(["awards", "education"]);
  });

  it("shows references when they're 'available upon request', even with no referees", () => {
    const cv = cvWith({ references: { availableOnRequest: true, items: [] } });
    expect(visibleSections(prepareCv(cv))).toEqual(["references"]);
  });

  it("includes custom sections that have entries, under their own names", () => {
    const cv = cvWith({
      customSections: [
        { id: "a", title: "Fieldwork", items: [{ title: "Survey of Lagos lagoon" }] },
        { id: "b", title: "Empty", items: [{ title: "" }] },
      ],
    });
    const prepared = prepareCv(cv);
    expect(visibleSections(prepared)).toEqual([customSectionKey("a")]);
    expect(sectionTitle(prepared, "custom:a")).toBe("Fieldwork");
    expect(sectionTitle(prepared, "research")).toBe("Research Experience");
  });

  it("prints every section of the sample CV, with coursework after education", () => {
    const order = visibleSections(prepareCv(sampleCv()));
    expect(order).toHaveLength(DEFAULT_SECTION_ORDER.length + 1);
    expect(order.slice(0, 3)).toEqual(["interests", "education", "custom:coursework"]);
  });
});

describe("prepareCv", () => {
  it("sorts entries newest first, with 'Present' at the top", () => {
    const cv = cvWith({
      research: [
        { role: "Old", startDate: "2019", endDate: "2020", highlights: [] },
        { role: "Current", startDate: "Jan 2025", endDate: "Present", highlights: [] },
        { role: "Recent", startDate: "Sep 2021", endDate: "Jun 2023", highlights: [] },
        { role: "Undated", highlights: [] },
      ],
      awards: [{ name: "A", year: "2018" }, { name: "B", year: "2024" }],
    });
    const prepared = prepareCv(cv);
    expect(prepared.research.map(r => r.role)).toEqual(["Current", "Recent", "Old", "Undated"]);
    expect(prepared.awards.map(a => a.name)).toEqual(["B", "A"]);
  });

  it("drops blank bullets, authors and keywords", () => {
    const cv = cvWith({
      research: [{ role: "RA", highlights: ["Did a thing", "", " "] }],
      publications: [{ title: "T", authors: ["A. Okafor", "", "  "] }],
      interests: { summary: "  ", keywords: ["testing", ""] },
    });
    const prepared = prepareCv(cv);
    expect(prepared.research[0].highlights).toEqual(["Did a thing"]);
    expect(prepared.publications[0].authors).toEqual(["A. Okafor"]);
    expect(prepared.interests).toEqual({ summary: "", keywords: ["testing"] });
  });

  it("does not modify the CV it is given", () => {
    const cv = cvWith({ awards: [{ name: "A", year: "2018" }, { name: "B", year: "2024" }] });
    prepareCv(cv);
    expect(cv.awards.map(a => a.name)).toEqual(["A", "B"]);
  });
});

describe("normalizeCv", () => {
  it("fills in missing fields of a partial or older CV file", () => {
    const cv = normalizeCv({ docType: "cv", basics: { name: "Ada" }, awards: "oops", references: {} });
    expect(cv.basics.name).toBe("Ada");
    expect(cv.basics.nameVariants).toEqual([]);
    expect(cv.awards).toEqual([]);
    expect(cv.references).toEqual({ availableOnRequest: false, items: [] });
    expect(cv.settings.citationStyle).toBe("ieee");
  });
});
