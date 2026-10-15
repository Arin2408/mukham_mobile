import { NativeModules, TurboModuleRegistry, type View } from 'react-native';

/**
 * A picture of the screen, for the wave when the theme changes.
 * Null when this app build doesn't include the screenshot module (older
 * builds): the switch is then instant instead.
 */
export async function snapshot(view: View | null): Promise<string | null> {
  if (!view || !(TurboModuleRegistry.get('RNViewShot') ?? NativeModules.RNViewShot)) return null;
  try {
    // Loaded only here: importing it in a build without the module would fail at startup.
    const { captureRef } = await import('react-native-view-shot');
    return await captureRef(view, { format: 'jpg', quality: 0.9, result: 'tmpfile' });
  } catch {
    return null;
  }
}

export async function release(uri: string): Promise<void> {
  try {
    const { releaseCapture } = await import('react-native-view-shot');
    releaseCapture(uri);
  } catch {
    // A temp file; the system clears it eventually.
  }
}

/** The browser animates the switch on its own (web only); on a phone the provider draws the wave. */
export function viewTransition(_apply: () => void, _origin: { x: number; y: number }): boolean {
  return false;
}
