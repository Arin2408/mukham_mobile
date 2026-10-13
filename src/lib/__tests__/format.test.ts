import { formatDistance, formatHours, formatShiftTime, isToday } from '@/lib/format';

describe('format', () => {
  it('shows short distances in metres and long ones in kilometres', () => {
    expect(formatDistance(35.4)).toBe('35 m');
    expect(formatDistance(999)).toBe('999 m');
    expect(formatDistance(2100)).toBe('2.1 km');
  });

  it('trims shift times to hours and minutes', () => {
    expect(formatShiftTime('09:00:00')).toBe('09:00');
    expect(formatShiftTime(null)).toBe('');
  });

  it('shows hours with one decimal', () => {
    expect(formatHours(8.46)).toBe('8.5 h');
  });

  it('knows whether a time is today', () => {
    const now = new Date(2026, 9, 13, 18, 0);
    expect(isToday(new Date(2026, 9, 13, 9, 2).toISOString(), now)).toBe(true);
    expect(isToday(new Date(2026, 9, 12, 9, 2).toISOString(), now)).toBe(false);
  });
});
