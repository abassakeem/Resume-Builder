import { describe, it, expect } from "vitest";
import { parseName, isSamePerson, formatName } from "./names";

describe("parseName", () => {
  it.each([
    ["Adaeze Nkem Okafor", { given: ["Adaeze", "Nkem"], family: "Okafor" }],
    ["Okafor, A. N.", { given: ["A.", "N."], family: "Okafor" }],
    ["A.N. Okafor", { given: ["A.", "N."], family: "Okafor" }],
    ["Okafor AN", { given: ["A.", "N."], family: "Okafor" }],
    ["Ludwig van Beethoven", { given: ["Ludwig"], family: "van Beethoven" }],
    ["Jean-Pierre Dupont", { given: ["Jean-Pierre"], family: "Dupont" }],
    ["Plato", { given: [], family: "Plato" }],
    ["  ", { given: [], family: "" }],
  ])("parses %j", (input, expected) => {
    expect(parseName(input)).toEqual(expected);
  });
});

describe("isSamePerson", () => {
  const owner = "Adaeze Nkem Okafor";

  it.each([
    "Adaeze Okafor",
    "A. Okafor",
    "A. N. Okafor",
    "A.N. Okafor",
    "Okafor, A.",
    "Okafor, Adaeze N.",
    "Okafor AN",
    "adaeze okafor",
    "Adaeze Nkem Okafor",
  ])("matches %j", author => {
    expect(isSamePerson(author, owner)).toBe(true);
  });

  it.each(["B. Okafor", "A. C. Okafor", "Adaobi Okafor", "Adaeze Okeke", "Okafor", ""])("does not match %j", author => {
    expect(isSamePerson(author, owner)).toBe(false);
  });

  it("ignores accents and hyphenated initials", () => {
    expect(isSamePerson("J.-P. Müller", "Jean-Pierre Muller")).toBe(true);
    expect(isSamePerson("J. Müller", "Jean-Pierre Muller")).toBe(false);
  });
});

describe("formatName", () => {
  it("produces each style's form", () => {
    expect(formatName("Adaeze Nkem Okafor", "initials-first")).toBe("A. N. Okafor");
    expect(formatName("Adaeze Nkem Okafor", "family-first")).toBe("Okafor, A. N.");
    expect(formatName("Okafor, Adaeze", "full")).toBe("Adaeze Okafor");
    expect(formatName("Jean-Pierre Dupont", "initials-first")).toBe("J.-P. Dupont");
    expect(formatName("Plato", "family-first")).toBe("Plato");
  });
});
