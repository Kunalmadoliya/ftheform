import { describe, expect, it } from "vitest";
import { slugifyFormTitle } from "./slug-utils";

describe("slugifyFormTitle", () => {
  it("normalizes punctuation and path/query delimiters", () => {
    expect(slugifyFormTitle("  My / Form? #1  ")).toBe("my-form-1");
  });

  it("preserves non-ASCII letters and removes combining marks", () => {
    expect(slugifyFormTitle("Crème 東京")).toBe("creme-東京");
  });

  it("uses a safe fallback for titles without letters or numbers", () => {
    expect(slugifyFormTitle(" /?# ")).toBe("form");
    expect(slugifyFormTitle("")).toBe("form");
  });
});
