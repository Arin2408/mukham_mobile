import { compareVersions } from '@/lib/version';

describe('compareVersions', () => {
  it('compares each part as a number, not as text', () => {
    expect(compareVersions('1.10.0', '1.9.2')).toBeGreaterThan(0);
    expect(compareVersions('1.9.2', '1.10.0')).toBeLessThan(0);
  });

  it('treats missing parts as zero', () => {
    expect(compareVersions('1.2', '1.2.0')).toBe(0);
    expect(compareVersions('2', '1.99.99')).toBeGreaterThan(0);
  });

  it('finds an outdated app version', () => {
    expect(compareVersions('1.0.0', '1.0.1')).toBeLessThan(0);
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
  });
});
