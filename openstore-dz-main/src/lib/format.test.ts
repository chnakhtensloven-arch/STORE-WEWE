import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, formatRelative } from "./format";

describe("date formatting", () => {
  it.each([null, undefined, "", "2026-02", "2026-02-30", "not-a-date"])(
    "returns a placeholder for invalid or incomplete date %s",
    (date) => {
      expect(formatDate(date)).toBe("—");
      expect(formatDateTime(date)).toBe("—");
      expect(formatRelative(date)).toBe("—");
    },
  );

  it("formats complete ISO dates", () => {
    expect(formatDate("2026-02-28", "en")).not.toBe("—");
    expect(formatDateTime("2026-02-28T12:30:00.000Z", "en")).not.toBe("—");
  });
});
