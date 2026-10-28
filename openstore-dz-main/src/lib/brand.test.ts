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
    expect(out).toContain("--brand-orange:#c2410c");
    expect(out).toContain("--scroll-thumb-hi:#c2410c");
    expect(out).toContain("--table-header-fg:#c2410c");
    expect(out).toContain("--primary-glow:rgba(194, 65, 12, 0.18)");
    expect(out).toContain("--toggle-border:rgba(194, 65, 12, 0.22)");
    // Dark-mode override must also be present.
    expect(out).toContain("--primary:#ffffff");
    expect(out).toContain("--on-primary:#111111");
    expect(out).toContain("--primary-glow:rgba(255, 255, 255, 0.2)");
  });
});
