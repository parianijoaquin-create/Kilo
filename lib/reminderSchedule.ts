export function minutesOfDay(time: string) {
  const [hours, minutes] = time.split(":");
  return (Number(hours) || 0) * 60 + (Number(minutes) || 0);
}

function previousIsoWeekday(weekday: number) {
  return weekday === 1 ? 7 : weekday - 1;
}

export function isReminderDue(
  reminder: { time_of_day: string; days_of_week: number[] },
  currentWeekday: number,
  currentMinute: number,
  windowMinutes: number
) {
  const reminderMinute = minutesOfDay(reminder.time_of_day);
  const windowStart = currentMinute - windowMinutes;
  const crossesMidnight = windowStart < 0;
  const belongsToPreviousDay = crossesMidnight && reminderMinute > 1440 + windowStart;
  const scheduledWeekday = belongsToPreviousDay
    ? previousIsoWeekday(currentWeekday)
    : currentWeekday;

  if (!reminder.days_of_week.includes(scheduledWeekday)) return false;
  return belongsToPreviousDay || (reminderMinute <= currentMinute && reminderMinute > windowStart);
}
