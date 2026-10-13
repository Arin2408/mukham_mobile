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
