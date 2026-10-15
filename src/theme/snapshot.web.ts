import type { View } from 'react-native';
import { flushSync } from 'react-dom';

// In the browser the page animates itself with a view transition, as on the web app.

export async function snapshot(_view: View | null): Promise<string | null> {
  return null;
}

export async function release(_uri: string): Promise<void> {}

// The old page stays still; the new one is revealed by the circle below.
const STILL = `::view-transition-old(root), ::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}`;

/**
 * Grows the page after `apply` out of the page before it, in a circle from
 * `origin`. False if the browser can't.
 */
export function viewTransition(apply: () => void, origin: { x: number; y: number }): boolean {
  if (typeof document === 'undefined' || !document.startViewTransition) return false;
  if (!document.getElementById('theme-wave')) {
    const style = document.createElement('style');
    style.id = 'theme-wave';
    style.textContent = STILL;
    document.head.appendChild(style);
  }
  const { x, y } = origin;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const transition = document.startViewTransition(() => flushSync(apply));
  transition.ready
    .then(() =>
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 650, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' },
      ),
    )
    // A quick second tap skips this transition; the theme still changes.
    .catch(() => {});
  return true;
}
