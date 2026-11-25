import { describe, it, expect } from "vitest";
import { formatCitation, citationText, groupPublications } from "./citations";

const journal = {
  status: "journal",
  authors: ["Adaeze N. Okafor", "Helen Whitcombe", "Tomasz Brzezinski"],
  title: "Trace-based detection of flaky tests",
  venue: "Empirical Software Engineering",
  year: "2025",
  volume: "30",
  issue: "4",
  pages: "112–139",
  doi: "10.5555/ese.2025.0412",
};

const conference = {
  status: "conference",
  authors: ["Okafor, A.", "Whitcombe, H."],
  title: "How long is too long?",
  venue: "Proc. ASE",
  year: "2025",
  pages: "455–466",
  doi: "10.5555/ase.2025.0087",
};

const owners = ["Adaeze Nkem Okafor"];
const text = (pub, style) => citationText(formatCitation(pub, { style, owners }));
const bolded = (pub, style) => formatCitation(pub, { style, owners }).filter(s => s.bold).map(s => s.text);

describe("formatCitation", () => {
  it("formats a journal article in IEEE style", () => {
    expect(text(journal, "ieee")).toBe(
      "A. N. Okafor, H. Whitcombe, and T. Brzezinski, “Trace-based detection of flaky tests,” Empirical Software Engineering, vol. 30, no. 4, pp. 112–139, 2025, doi: 10.5555/ese.2025.0412."
    );
  });

  it("formats a journal article in APA style", () => {
    expect(text(journal, "apa")).toBe(
      "Okafor, A. N., Whitcombe, H., & Brzezinski, T. (2025). Trace-based detection of flaky tests. Empirical Software Engineering, 30(4), 112–139. https://doi.org/10.5555/ese.2025.0412"
    );
  });

  it("formats a journal article in ACM style", () => {
    expect(text(journal, "acm")).toBe(
      "Adaeze N. Okafor, Helen Whitcombe, and Tomasz Brzezinski. 2025. Trace-based detection of flaky tests. Empirical Software Engineering 30, 4 (2025), 112–139. https://doi.org/10.5555/ese.2025.0412"
    );
  });

  it("formats conference papers, keeping a title's own question mark", () => {
    expect(text(conference, "ieee")).toBe(
      "A. Okafor and H. Whitcombe, “How long is too long?” in Proc. ASE, 2025, pp. 455–466, doi: 10.5555/ase.2025.0087."
    );
    expect(text(conference, "apa")).toBe(
      "Okafor, A., & Whitcombe, H. (2025). How long is too long? In Proc. ASE (pp. 455–466). https://doi.org/10.5555/ase.2025.0087"
    );
    expect(text(conference, "acm")).toBe(
      "A. Okafor and H. Whitcombe. 2025. How long is too long? In Proc. ASE. 455–466. https://doi.org/10.5555/ase.2025.0087"
    );
  });

  it("describes unpublished work by status", () => {
    const review = { status: "review", authors: ["Adaeze Okafor"], title: "Learning to prioritise", venue: "IEEE TSE", year: "2025" };
    const prep = { status: "preparation", authors: ["Adaeze Okafor"], title: "A taxonomy" };
    expect(text(review, "ieee")).toBe("A. Okafor, “Learning to prioritise,” submitted to IEEE TSE, 2025.");
    expect(text(review, "apa")).toBe("Okafor, A. (2025). Learning to prioritise [Manuscript submitted for publication].");
    expect(text(prep, "apa")).toBe("Okafor, A. (n.d.). A taxonomy [Manuscript in preparation].");
    expect(text(prep, "acm")).toBe("Adaeze Okafor. A taxonomy. In preparation.");
  });

  it("links a URL when there is no DOI", () => {
    const preprint = { status: "preprint", authors: ["A. Okafor"], title: "FlakeBench", venue: "arXiv:2509.01234", year: "2025", url: "https://arxiv.org/abs/2509.01234" };
    const segs = formatCitation(preprint, { style: "ieee", owners });
    expect(citationText(segs)).toBe("A. Okafor, “FlakeBench,” arXiv:2509.01234, 2025. [Online]. Available: https://arxiv.org/abs/2509.01234");
    expect(segs.find(s => s.link)).toMatchObject({ link: "https://arxiv.org/abs/2509.01234" });
  });

  it("italicises the venue and links the DOI", () => {
    const segs = formatCitation(journal, { style: "ieee", owners });
    expect(segs.find(s => s.italic)?.text).toBe("Empirical Software Engineering");
    expect(segs.find(s => s.link)).toEqual({ text: "10.5555/ese.2025.0412", link: "https://doi.org/10.5555/ese.2025.0412" });
  });

  it("treats an unknown status as a journal article", () => {
    expect(text({ ...journal, status: "something" }, "ieee")).toBe(text(journal, "ieee"));
  });
});

describe("owner name bolding", () => {
  it("bolds the owner however their name is written, in every style", () => {
    expect(bolded(journal, "ieee")).toEqual(["A. N. Okafor"]);
    expect(bolded(journal, "apa")).toEqual(["Okafor, A. N."]);
    expect(bolded(journal, "acm")).toEqual(["Adaeze N. Okafor"]);
    expect(bolded(conference, "ieee")).toEqual(["A. Okafor"]);
  });

  it("does not bold a different person with the same surname", () => {
    const pub = { ...journal, authors: ["B. Okafor", "A. C. Okafor", "Okafor"] };
    expect(bolded(pub, "ieee")).toEqual([]);
  });

  it("bolds extra name variants such as a previous surname", () => {
    const pub = { ...journal, authors: ["A. Nwosu", "H. Whitcombe"] };
    const segs = formatCitation(pub, { style: "ieee", owners: [...owners, "Adaeze Nwosu"] });
    expect(segs.filter(s => s.bold).map(s => s.text)).toEqual(["A. Nwosu"]);
  });

  it("bolds nothing when the CV has no name yet", () => {
    expect(formatCitation(journal, { style: "ieee", owners: [""] }).some(s => s.bold)).toBe(false);
  });
});

describe("groupPublications", () => {
  const pubs = [
    { status: "conference", title: "C2019", year: "2019" },
    { status: "journal", title: "J2021", year: "2021" },
    { status: "preparation", title: "P" },
    { status: "conference", title: "C2024", year: "2024" },
    { status: "journal", title: "J2025", year: "2025" },
  ];
  const summary = groups => groups.map(g => [g.status, g.items.map(i => `${i.pub.title}#${i.number}`)]);

  it("groups by status in CV order, newest first, numbered across groups", () => {
    expect(summary(groupPublications(pubs, "continuous"))).toEqual([
      ["journal", ["J2025#1", "J2021#2"]],
      ["conference", ["C2024#3", "C2019#4"]],
      ["preparation", ["P#5"]],
    ]);
  });

  it("restarts numbering within each group", () => {
    expect(summary(groupPublications(pubs, "group"))).toEqual([
      ["journal", ["J2025#1", "J2021#2"]],
      ["conference", ["C2024#1", "C2019#2"]],
      ["preparation", ["P#1"]],
    ]);
  });

  it("leaves numbers off when numbering is disabled", () => {
    expect(groupPublications(pubs, "none").flatMap(g => g.items.map(i => i.number))).toEqual([null, null, null, null, null]);
  });

  it("omits empty groups", () => {
    expect(groupPublications([], "continuous")).toEqual([]);
  });
});
