/**
 * Compare dotted version strings numerically: "1.10.0" is newer than "1.9.2".
 * Returns a negative number if a < b, 0 if equal, positive if a > b.
 * Missing parts count as 0, so "1.2" equals "1.2.0".
 */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((part) => parseInt(part, 10) || 0);
  const pb = b.split('.').map((part) => parseInt(part, 10) || 0);
  const length = Math.max(pa.length, pb.length);

  for (let i = 0; i < length; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) {
      return diff;
    }
  }
  return 0;
}
