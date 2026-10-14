const pad = (n: number) => String(n).padStart(2, '0');

/** "09:02" from an ISO date-time, in the phone's time zone. */
export function formatTime(iso: string): string {
  const date = new Date(iso);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** "09:00" from a shift time such as "09:00:00". */
export function formatShiftTime(time: string | null): string {
  return time ? time.slice(0, 5) : '';
}

/** "35 m" below 1 km, "2.1 km" above. */
export function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

/** "8.5 h". */
export function formatHours(hours: number): string {
  return `${hours.toFixed(1)} h`;
}

/** True when an ISO date-time falls on today's date in the phone's time zone. */
export function isToday(iso: string, now: Date = new Date()): boolean {
  const date = new Date(iso);
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-10-13", the phone's local date, as the server's date filters expect. */
export function toDateParam(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** A local Date from "2026-10-13" (not UTC midnight, which can be the day before). */
export function parseDateParam(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** "Tue, 13 Oct" for a date-time, in the phone's time zone. */
export function formatDay(iso: string): string {
  const date = new Date(iso);
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** "13 Oct 2026" for a date such as "2026-10-13". */
export function formatDate(value: string): string {
  const date = parseDateParam(value);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** "Mon" … "Sun" for the weekly chart. */
export const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Monday of the week that contains `date`, at midnight. */
export function startOfWeek(date: Date): Date {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
}

export type RangePreset = 'week' | 'month' | 'quarter';

/** The dates History asks for: this week, this month, or the last 3 months. */
export function rangeFor(preset: RangePreset, now: Date = new Date()): { from: string; to: string } {
  const to = toDateParam(now);
  if (preset === 'week') {
    return { from: toDateParam(startOfWeek(now)), to };
  }
  const monthsBack = preset === 'month' ? 0 : 2;
  return { from: toDateParam(new Date(now.getFullYear(), now.getMonth() - monthsBack, 1)), to };
}

/**
 * Hours worked on each day Monday to Sunday of the week starting `monday`,
 * by check-in day. Open records (still checked in) count as 0.
 */
export function hoursByWeekday(
  records: { check_in: string; hours_worked: number | null }[],
  monday: Date,
): number[] {
  const hours = [0, 0, 0, 0, 0, 0, 0];
  const start = monday.getTime();
  for (const record of records) {
    const checkIn = new Date(record.check_in);
    const day = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate());
    const index = Math.round((day.getTime() - start) / 86_400_000);
    if (index >= 0 && index < 7) {
      hours[index] += record.hours_worked ?? 0;
    }
  }
  return hours;
}

export type DayStatus =
  | { kind: 'in'; since: string }
  | { kind: 'out'; at: string; hours: number }
  | { kind: 'absent' };

/**
 * Where an employee stands today, from their recent records (any order):
 * checked in (an open record, even one from last night), checked out
 * today, or not in yet.
 */
export function dayStatus(
  records: { check_in: string; check_out: string | null; hours_worked: number | null }[],
  now: Date = new Date(),
): DayStatus {
  const latest = [...records].sort((a, b) => Date.parse(b.check_in) - Date.parse(a.check_in))[0];
  if (!latest) {
    return { kind: 'absent' };
  }
  if (!latest.check_out) {
    return { kind: 'in', since: latest.check_in };
  }
  if (isToday(latest.check_in, now)) {
    return { kind: 'out', at: latest.check_out, hours: latest.hours_worked ?? 0 };
  }
  return { kind: 'absent' };
}

/** Today minus `days`, as a date parameter. */
export function daysAgo(days: number, now: Date = new Date()): string {
  return toDateParam(new Date(now.getFullYear(), now.getMonth(), now.getDate() - days));
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "October 2026". */
export function formatMonth(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

/** "Tue, 13 Oct" for a date such as "2026-10-13". */
export function formatDateShort(value: string): string {
  return formatDay(parseDateParam(value).toISOString());
}

/** "8 h" or "8 h 30 min" for a duration in minutes. */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/**
 * Minutes a shift lasts, and whether it ends the next day (end before
 * start), as the backend counts them. Equal times are not a shift.
 */
export function shiftLength(start: string, end: string): { minutes: number; overnight: boolean } {
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const s = toMin(start);
  const e = toMin(end);
  const overnight = e < s;
  return { minutes: overnight ? e + 1440 - s : e - s, overnight };
}
