import type { PresenceMove } from '@/api/attendance';

/** Each time out of the office: left at `from`, back at `to` (null while still out). */
export function awayPeriods(moves: PresenceMove[] = []): { from: string; to: string | null }[] {
  const periods: { from: string; to: string | null }[] = [];
  for (const move of moves) {
    if (move.event === 'exit') periods.push({ from: move.at, to: null });
    else if (periods.length && periods.at(-1)!.to === null) periods.at(-1)!.to = move.at;
  }
  return periods;
}
