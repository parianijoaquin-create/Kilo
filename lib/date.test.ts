import { describe, expect, it } from "vitest";
import { localDayRangeUtc, localNoonUtc, localTimeOnDateUtc, shiftLocalDate, toLocalDate } from "./date";
import { userCacheKey } from "./localCache";

describe("local date helpers", () => {
  it("formats the calendar date without converting it to UTC first", () => {
    expect(toLocalDate(new Date(2026, 8, 20, 23, 30))).toBe("2026-09-20");
  });

  it("builds a complete local day and keeps local noon inside it", () => {
    const range = localDayRangeUtc("2026-09-20");
    const start = Date.parse(range.start);
    const end = Date.parse(range.end);
    const noon = Date.parse(localNoonUtc("2026-09-20"));

    expect(end - start).toBe(24 * 60 * 60 * 1000 - 1);
    expect(noon).toBeGreaterThan(start);
    expect(noon).toBeLessThan(end);
  });

  it("moves an instant to another local date without changing its local time", () => {
    const source = new Date(2026, 8, 19, 21, 45, 12).toISOString();
    const moved = new Date(localTimeOnDateUtc("2026-09-20", source));

    expect(toLocalDate(moved)).toBe("2026-09-20");
    expect([moved.getHours(), moved.getMinutes(), moved.getSeconds()]).toEqual([21, 45, 12]);
  });

  it("shifts calendar dates across month boundaries", () => {
    expect(shiftLocalDate("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("user cache keys", () => {
  it("isolates the same resource between accounts", () => {
    expect(userCacheKey("user-a", "profile")).not.toBe(userCacheKey("user-b", "profile"));
  });
});
