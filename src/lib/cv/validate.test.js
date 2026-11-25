import { describe, it, expect } from "vitest";
import { validators, normalizeDoi, normalizeUrl, displayUrl, normalizeOrcid, isOrcid } from "./validate";
import { dateValue, sortNewestFirst } from "./dates";

describe("validators", () => {
  it("treats empty values as valid, since every field is optional", () => {
    for (const check of Object.values(validators)) expect(check("")).toBe("");
  });

  it("checks emails", () => {
    expect(validators.email("ada@uni.ac.uk")).toBe("");
    expect(validators.email("ada@uni")).not.toBe("");
    expect(validators.email("not an email")).not.toBe("");
  });

  it("checks URLs, accepting bare domains", () => {
    expect(validators.url("https://scholar.google.com/citations?user=X")).toBe("");
    expect(validators.url("github.com/ada")).toBe("");
    expect(validators.url("just words")).not.toBe("");
    expect(validators.url("https://")).not.toBe("");
  });

  it("checks DOIs in any common form", () => {
    expect(validators.doi("10.1145/3597503.3639187")).toBe("");
    expect(validators.doi("https://doi.org/10.1145/3597503.3639187")).toBe("");
    expect(validators.doi("doi:10.1000/xyz")).toBe("");
    expect(validators.doi("10.1/abc")).not.toBe("");
    expect(validators.doi("3597503.3639187")).not.toBe("");
  });

  it("checks ORCID iDs including the check digit", () => {
    expect(isOrcid("0000-0002-1825-0097")).toBe(true);
    expect(isOrcid("https://orcid.org/0000-0002-1694-233X")).toBe(true);
    expect(isOrcid("0000-0002-1825-0098")).toBe(false);
    expect(isOrcid("0000-0002-1825")).toBe(false);
  });

  it("checks years and free-form dates", () => {
    expect(validators.year("2025")).toBe("");
    expect(validators.year("25")).not.toBe("");
    expect(validators.year("1850")).not.toBe("");
    expect(validators.year(String(new Date().getFullYear() + 20))).not.toBe("");
    for (const ok of ["Sep 2021", "2021", "Fall 2022", "Present", "2021–2022"]) expect(validators.date(ok)).toBe("");
    for (const bad of ["Sept", "21", "Sep 3021"]) expect(validators.date(bad)).not.toBe("");
  });
});

describe("normalisers", () => {
  it("normalises DOIs, URLs and ORCID iDs", () => {
    expect(normalizeDoi(" https://dx.doi.org/10.1000/ABC ")).toBe("10.1000/ABC");
    expect(normalizeUrl("github.com/ada")).toBe("https://github.com/ada");
    expect(normalizeUrl("mailto:a@b.co")).toBe("mailto:a@b.co");
    expect(displayUrl("https://www.github.com/ada/")).toBe("github.com/ada");
    expect(normalizeOrcid("https://orcid.org/0000-0002-1694-233x")).toBe("0000-0002-1694-233X");
  });
});

describe("dates", () => {
  it("reads common CV date formats", () => {
    expect(dateValue("Sep 2021")).toBe(2021 * 12 + 9);
    expect(dateValue("September 2021")).toBe(2021 * 12 + 9);
    expect(dateValue("09/2021")).toBe(2021 * 12 + 9);
    expect(dateValue("2021-09")).toBe(2021 * 12 + 9);
    expect(dateValue("Fall 2021")).toBe(2021 * 12 + 9);
    expect(dateValue("2021")).toBe(2021 * 12);
    expect(dateValue("Sep 2021 – Jun 2022")).toBe(2022 * 12 + 6);
    expect(dateValue("2021 – Present")).toBe(Infinity);
    expect(dateValue("Present")).toBe(Infinity);
    expect(dateValue("someday")).toBeNull();
  });

  it("sorts newest first, breaking ties on the start date", () => {
    const items = [
      { id: "a", end: "2022", start: "2018" },
      { id: "b", end: "2022", start: "2020" },
      { id: "c", end: "Present", start: "2023" },
      { id: "d" },
      { id: "e", end: "", start: "2024" },
    ];
    expect(sortNewestFirst(items, i => i.end || i.start, i => i.start).map(i => i.id)).toEqual(["c", "e", "b", "a", "d"]);
  });
});
