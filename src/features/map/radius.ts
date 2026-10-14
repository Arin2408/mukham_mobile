export const MIN_RADIUS = 10;
export const MAX_RADIUS = 5000;

/**
 * The next check-in radius up or down: 10 m steps up to 200 m, 50 m steps
 * up to 1 km, then 250 m, always landing on a round number, 10 m to 5 km.
 */
export function stepRadius(current: number, direction: 1 | -1): number {
  const size = direction > 0 ? current : current - 1;
  const step = size < 200 ? 10 : size < 1000 ? 50 : 250;
  const next =
    direction > 0 ? Math.floor(current / step) * step + step : Math.ceil(current / step) * step - step;
  return Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, next));
}
