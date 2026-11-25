import { describe, it, expect } from "vitest";
import { cvFromResume, mergeResumeIntoCv } from "./fromResume";
import { blankCv, isCvData } from "./model";
import { defaultData } from "../../defaultData";

const resume = {
  selectedTemplate: 2,
  basics: {
    name: "Adaeze Okafor",
    email: "ada@example.com",
    phone: "+234 800 000 0000",
    location: { address: "Lagos, Nigeria" },
    website: "https://github.com/adaeze",
  },
  education: [{ institution: "OAU", studyType: "BSc", area: "Computer Science", startDate: "2017", endDate: "2022", gpa: "4.62/5.00", location: "Ile-Ife" }],
  work: [{ company: "Lumen", position: "SDET", location: "Lagos", startDate: "Jan 2023", endDate: "Present", highlights: ["Cut CI time in half"] }],
  skills: [{ name: "Languages", keywords: ["Python", "Java"] }],
  projects: [{ name: "Side project", url: "", keywords: [], description: "Not copied" }],
  certificates: [{ name: "ISTQB CTFL", issuer: "ISTQB", date: "2023" }],
};

describe("cvFromResume", () => {
  it("copies contact details, education, experience, skills and certifications", () => {
    const cv = cvFromResume(resume);
    expect(isCvData(cv)).toBe(true);
    expect(cv.basics).toMatchObject({ name: "Adaeze Okafor", email: "ada@example.com", phone: "+234 800 000 0000", location: { address: "Lagos, Nigeria" } });
    expect(cv.education[0]).toMatchObject({ institution: "OAU", studyType: "BSc", area: "Computer Science", gpa: "4.62/5.00", honours: "", thesisTitle: "" });
    expect(cv.work).toEqual(resume.work);
    expect(cv.skills).toEqual(resume.skills);
    expect(cv.certifications).toEqual([{ name: "ISTQB CTFL", issuer: "ISTQB", date: "2023", url: "" }]);
  });

  it("puts a profile link from the resume's website field into the matching CV field", () => {
    const cv = cvFromResume(resume);
    expect(cv.basics.github).toBe("https://github.com/adaeze");
    expect(cv.basics.website).toBe("");
    expect(cvFromResume({ basics: { website: "https://ada.dev" } }).basics.website).toBe("https://ada.dev");
  });

  it("leaves academic sections empty and uses CV defaults, not resume settings", () => {
    const cv = cvFromResume(resume);
    expect(cv.publications).toEqual([]);
    expect(cv.research).toEqual([]);
    expect(cv.selectedTemplate).toBe("cv-classic");
    expect(cv).not.toHaveProperty("projects");
  });

  it("keeps the CV independent of the resume afterwards", () => {
    const source = structuredClone(resume);
    const cv = cvFromResume(source);
    cv.work[0].highlights.push("Added on the CV");
    cv.skills[0].keywords.push("R");
    cv.basics.location.address = "Manchester";
    expect(source).toEqual(resume);
  });

  it("handles the starter resume and missing fields", () => {
    expect(() => cvFromResume(defaultData)).not.toThrow();
    const empty = cvFromResume({});
    expect(empty.education).toEqual([]);
    expect(empty.basics.name).toBe("");
  });
});

describe("mergeResumeIntoCv", () => {
  it("replaces only the shared sections the import found, keeping academic content", () => {
    const cv = {
      ...blankCv(),
      basics: { ...blankCv().basics, name: "Old Name", orcid: "0000-0002-1825-0097" },
      publications: [{ title: "Kept" }],
      skills: [{ name: "Kept", keywords: [] }],
    };
    const merged = mergeResumeIntoCv(cv, { basics: { name: "New Name" }, work: resume.work, skills: [] });
    expect(merged.basics.name).toBe("New Name");
    expect(merged.basics.orcid).toBe("0000-0002-1825-0097");
    expect(merged.work).toEqual(resume.work);
    expect(merged.skills).toEqual([{ name: "Kept", keywords: [] }]);
    expect(merged.publications).toEqual([{ title: "Kept" }]);
  });
});
