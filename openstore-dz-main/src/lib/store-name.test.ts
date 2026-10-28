import { describe, expect, it } from "vitest";
import { DEFAULT_STORE_NAME, isPlaceholderStoreName, resolveStoreName } from "./store-name";

describe("store name defaults", () => {
  it("uses the default only when no nonblank name is saved", () => {
    expect(DEFAULT_STORE_NAME).toBe("wewe-store");
    expect(resolveStoreName(null)).toBe("wewe-store");
    expect(resolveStoreName("")).toBe("wewe-store");
    expect(resolveStoreName("  ")).toBe("wewe-store");
  });

  it("preserves every nonblank saved name", () => {
    expect(resolveStoreName("Boutique Amel")).toBe("Boutique Amel");
    expect(resolveStoreName("OpenStore DZ")).toBe("OpenStore DZ");
  });

  it("recognizes the current default and legacy demo names during setup", () => {
    expect(isPlaceholderStoreName("wewe-store")).toBe(true);
    expect(isPlaceholderStoreName("OpenStore DZ")).toBe(true);
    expect(isPlaceholderStoreName("Boutique Amel")).toBe(false);
  });
});
