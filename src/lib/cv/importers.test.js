import { describe, it, expect, vi } from "vitest";
import { parseBibtex, latexToText } from "./bibtex";
import { fetchDoi, crossrefToPublication } from "./crossref";

describe("parseBibtex", () => {
  const bib = String.raw`
@string{ese = "Empirical Software Engineering"}
@comment{ exported from a reference manager }
@article{okafor2025,
  author  = {Okafor, Adaeze N. and Whitcombe, Helen and Brzezi{\'n}ski, Tomasz},
  title   = {Trace-based detection of {flaky} tests},
  journal = ese,
  year    = 2025,
  volume  = {30},
  number  = {4},
  pages   = {112--139},
  doi     = {https://doi.org/10.5555/ese.2025.0412},
}
@inproceedings{okafor2025ase,
  author    = "Okafor, A. and Whitcombe, H.",
  title     = "How long is too long? Test timeouts in {Java}",
  booktitle = {Proceedings of ASE},
  year      = {2025},
  pages     = {455-466},
  month     = nov,
}
@misc{flakebench,
  author = {Okafor, A. N. and others},
  title = {FlakeBench},
  eprint = {2509.01234},
  archivePrefix = {arXiv},
  year = {2025},
  url = {https://arxiv.org/abs/2509.01234}
}
@article{review, author = {Adaeze Okafor}, title = {Learning to prioritise}, journal = {IEEE TSE}, note = {Under review}}
@article{broken, title = {Never closed
`;

  it("reads entries, macros and LaTeX markup into publications", () => {
    const { publications, skipped } = parseBibtex(bib);
    expect(skipped).toBe(1);
    expect(publications).toHaveLength(4);

    expect(publications[0]).toEqual({
      status: "journal",
      authors: ["Adaeze N. Okafor", "Helen Whitcombe", "Tomasz Brzeziński"],
      title: "Trace-based detection of flaky tests",
      venue: "Empirical Software Engineering",
      year: "2025",
      volume: "30",
      issue: "4",
      pages: "112–139",
      doi: "10.5555/ese.2025.0412",
      url: "",
    });
    expect(publications[1]).toMatchObject({
      status: "conference",
      authors: ["A. Okafor", "H. Whitcombe"],
      title: "How long is too long? Test timeouts in Java",
      venue: "Proceedings of ASE",
      pages: "455–466",
    });
    expect(publications[2]).toMatchObject({
      status: "preprint",
      authors: ["A. N. Okafor"],
      venue: "arXiv:2509.01234",
      url: "https://arxiv.org/abs/2509.01234",
    });
    expect(publications[3].status).toBe("review");
  });

  it("returns nothing for text with no entries", () => {
    expect(parseBibtex("hello")).toEqual({ publications: [], skipped: 0 });
  });

  it("converts LaTeX accents and commands", () => {
    expect(latexToText(String.raw`G{\"o}del, \c{C}elik, \v{S}koda, Ma{\l}gorzata, Fran\c cois`)).toBe("Gödel, Çelik, Škoda, Małgorzata, François");
    expect(latexToText(String.raw`\textit{In situ} \& \url{x}, 1--2`)).toBe("In situ & x, 1–2");
  });
});

describe("crossref", () => {
  const message = {
    type: "proceedings-article",
    title: ["Detecting <i>flaky</i> tests"],
    author: [{ given: "Adaeze N.", family: "Okafor" }, { given: "Helen", family: "Whitcombe" }, { name: "The FlakeBench Consortium" }],
    "container-title": ["Proceedings of ASE"],
    "published-print": { "date-parts": [[2025, 11]] },
    page: "455-466",
    volume: "1",
    DOI: "10.5555/ASE.2025.0087",
  };

  it("maps a Crossref record to a publication", () => {
    expect(crossrefToPublication(message)).toEqual({
      status: "conference",
      authors: ["Adaeze N. Okafor", "Helen Whitcombe", "The FlakeBench Consortium"],
      title: "Detecting flaky tests",
      venue: "Proceedings of ASE",
      year: "2025",
      volume: "1",
      issue: "",
      pages: "455–466",
      doi: "10.5555/ASE.2025.0087",
      url: "",
    });
  });

  const respond = (status, body) => vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body });

  it("fetches and maps a DOI, accepting a doi.org link", async () => {
    const fetchImpl = respond(200, { message });
    const pub = await fetchDoi("https://doi.org/10.5555/ASE.2025.0087", { fetchImpl });
    expect(fetchImpl).toHaveBeenCalledWith("https://api.crossref.org/works/10.5555%2FASE.2025.0087", expect.any(Object));
    expect(pub.title).toBe("Detecting flaky tests");
  });

  it("explains each kind of failure", async () => {
    await expect(fetchDoi("not a doi", { fetchImpl: vi.fn() })).rejects.toMatchObject({ userMessage: expect.stringContaining("doesn't look like a DOI") });
    await expect(fetchDoi("10.5555/missing", { fetchImpl: respond(404) })).rejects.toMatchObject({ userMessage: expect.stringContaining("no record") });
    await expect(fetchDoi("10.5555/x", { fetchImpl: respond(503) })).rejects.toMatchObject({ userMessage: expect.stringContaining("(503)") });
    await expect(fetchDoi("10.5555/x", { fetchImpl: vi.fn().mockRejectedValue(new TypeError("Failed to fetch")) })).rejects.toMatchObject({
      userMessage: expect.stringContaining("Couldn't reach Crossref"),
    });
    await expect(fetchDoi("10.5555/x", { fetchImpl: respond(200, { status: "ok" }) })).rejects.toMatchObject({ userMessage: expect.stringContaining("couldn't be read") });
  });

  it("gives up after the timeout", async () => {
    const hang = (_url, { signal }) =>
      new Promise((_, reject) => signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" }))));
    await expect(fetchDoi("10.5555/x", { fetchImpl: hang, timeoutMs: 10 })).rejects.toMatchObject({ userMessage: expect.stringContaining("too long") });
  });
});
