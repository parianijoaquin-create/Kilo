import { describe, expect, it } from "vitest";
import { isReminderDue, minutesOfDay } from "./reminderSchedule";

describe("reminder scheduling", () => {
  it("converts database times to minutes", () => {
    expect(minutesOfDay("12:34:00")).toBe(754);
  });

  it("matches a reminder inside the current window", () => {
    expect(isReminderDue(
      { time_of_day: "12:03:00", days_of_week: [1] },
      1,
      12 * 60 + 5,
      5
    )).toBe(true);
  });

  it("does not match a reminder outside the current window", () => {
    expect(isReminderDue(
      { time_of_day: "11:59:00", days_of_week: [1] },
      1,
      12 * 60 + 5,
      5
    )).toBe(false);
  });

  it("uses the previous weekday when a window crosses midnight", () => {
    expect(isReminderDue(
      { time_of_day: "23:59:00", days_of_week: [7] },
      1,
      3,
      5
    )).toBe(true);
  });

  it("does not assign a previous-day reminder to the new weekday", () => {
    expect(isReminderDue(
      { time_of_day: "23:59:00", days_of_week: [1] },
      1,
      3,
      5
    )).toBe(false);
  });
});
