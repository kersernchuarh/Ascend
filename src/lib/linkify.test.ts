import { describe, expect, it } from "vitest";
import { splitLinkify } from "./linkify";

describe("splitLinkify", () => {
  it("returns nothing for empty text", () => {
    expect(splitLinkify("")).toEqual([]);
  });

  it("returns one plain segment for text with no link", () => {
    expect(splitLinkify("Bring lab notebook")).toEqual([{ text: "Bring lab notebook", isLink: false }]);
  });

  it("splits a trailing URL into plain + link segments", () => {
    expect(splitLinkify("Rubric: https://example.com/rubric.pdf")).toEqual([
      { text: "Rubric: ", isLink: false },
      { text: "https://example.com/rubric.pdf", isLink: true },
    ]);
  });

  it("treats a bare URL as a single link segment", () => {
    expect(splitLinkify("https://example.com")).toEqual([{ text: "https://example.com", isLink: true }]);
  });

  it("does not swallow trailing sentence punctuation into the link", () => {
    expect(splitLinkify("Grab from https://example.com/store, need graph paper")).toEqual([
      { text: "Grab from ", isLink: false },
      { text: "https://example.com/store", isLink: true },
      { text: ",", isLink: false },
      { text: " need graph paper", isLink: false },
    ]);
  });

  it("keeps a balanced trailing parenthesis that's part of the URL itself", () => {
    expect(splitLinkify("see https://en.wikipedia.org/wiki/Ascend_(disambiguation)")).toEqual([
      { text: "see ", isLink: false },
      { text: "https://en.wikipedia.org/wiki/Ascend_(disambiguation)", isLink: true },
    ]);
  });

  it("strips an unbalanced trailing parenthesis that closes the surrounding sentence", () => {
    expect(splitLinkify("(see https://example.com/x)")).toEqual([
      { text: "(see ", isLink: false },
      { text: "https://example.com/x", isLink: true },
      { text: ")", isLink: false },
    ]);
  });

  it("handles a link surrounded by text, and multiple links", () => {
    expect(splitLinkify("see https://a.test and https://b.test too")).toEqual([
      { text: "see ", isLink: false },
      { text: "https://a.test", isLink: true },
      { text: " and ", isLink: false },
      { text: "https://b.test", isLink: true },
      { text: " too", isLink: false },
    ]);
  });
});
