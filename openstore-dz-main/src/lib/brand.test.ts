import { describe, expect, it } from "vitest";
import { brandCss, textOn } from "./brand";

describe("brand colour", () => {
  it("puts readable text on light and dark brands", () => {
    expect(textOn("#f5d90a")).toBe("#111111");
    expect(textOn("#1c2a4a")).toBe("#ffffff");
  });

  it("refuses anything that is not a plain hex colour", () => {
    expect(brandCss("red;}body{display:none")).toBeNull();
    expect(brandCss(null)).toBeNull();
    const out = brandCss("#c2410c");
    expect(out).toContain("--primary:#c2410c");
    // Dark-mode override must also be present.
    expect(out).toContain("--primary:#ffffff");
    expect(out).toContain("--on-primary:#111111");
  });
});
