import {
  formatDate,
  formatDay,
  formatDistance,
  formatHours,
  formatShiftTime,
  hoursByWeekday,
  isToday,
  rangeFor,
  startOfWeek,
  toDateParam,
} from '@/lib/format';

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

describe('dates for History', () => {
  const tue = new Date(2026, 9, 13, 18, 0); // Tuesday 13 Oct 2026

  it('formats days and dates in plain English', () => {
    expect(formatDay(new Date(2026, 9, 13, 9, 2).toISOString())).toBe('Tue, 13 Oct');
    expect(formatDate('2026-10-13')).toBe('13 Oct 2026');
    expect(toDateParam(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('starts weeks on Monday, including from a Sunday', () => {
    expect(toDateParam(startOfWeek(tue))).toBe('2026-10-12');
    expect(toDateParam(startOfWeek(new Date(2026, 9, 18)))).toBe('2026-10-12');
  });

  it('gives the date range for each choice', () => {
    expect(rangeFor('week', tue)).toEqual({ from: '2026-10-12', to: '2026-10-13' });
    expect(rangeFor('month', tue)).toEqual({ from: '2026-10-01', to: '2026-10-13' });
    expect(rangeFor('quarter', tue)).toEqual({ from: '2026-08-01', to: '2026-10-13' });
    expect(rangeFor('quarter', new Date(2026, 0, 20))).toEqual({ from: '2025-11-01', to: '2026-01-20' });
  });

  it('adds up hours per weekday and ignores open records and other weeks', () => {
    const at = (d: number, h: number) => new Date(2026, 9, d, h).toISOString();
    const hours = hoursByWeekday(
      [
        { check_in: at(12, 9), hours_worked: 8 },
        { check_in: at(12, 19), hours_worked: 1.5 },
        { check_in: at(13, 9), hours_worked: null },
        { check_in: at(18, 9), hours_worked: 4 },
        { check_in: at(11, 9), hours_worked: 9 },
      ],
      new Date(2026, 9, 12),
    );
    expect(hours).toEqual([9.5, 0, 0, 0, 0, 0, 4]);
  });
});
