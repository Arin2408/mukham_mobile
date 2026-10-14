import { requireOptionalNativeModule } from 'expo';
import type { ReactNode } from 'react';
import { UIManager, View, type StyleProp, type ViewStyle } from 'react-native';

/**
 * Gradients and gradient text, loaded only when the installed app build
 * has their native code; older builds get the first colour instead.
 */

type LinearGradientModule = typeof import('expo-linear-gradient');
type MaskedViewModule = typeof import('@react-native-masked-view/masked-view');

let gradientModule: LinearGradientModule | null | undefined;
let maskedModule: MaskedViewModule | null | undefined;

export function linearGradient(): LinearGradientModule | null {
  if (gradientModule === undefined) {
    gradientModule = requireOptionalNativeModule('ExpoLinearGradient')
      ? // eslint-disable-next-line @typescript-eslint/no-require-imports
        (require('expo-linear-gradient') as LinearGradientModule)
      : null;
  }
  return gradientModule;
}

export function maskedView(): MaskedViewModule | null {
  if (maskedModule === undefined) {
    maskedModule = UIManager.hasViewManagerConfig?.('RNCMaskedView')
      ? // eslint-disable-next-line @typescript-eslint/no-require-imports
        (require('@react-native-masked-view/masked-view') as MaskedViewModule)
      : null;
  }
  return maskedModule;
}

type Props = {
  colors: readonly string[];
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  /** Direction: top-left to bottom-right by default, as the web's "to bottom right". */
  start?: { x: number; y: number };
  end?: { x: number; y: number };
};

/** A view filled with a gradient (or its first colour on builds without gradients). */
export function Gradient({ colors, style, children, start = { x: 0, y: 0 }, end = { x: 1, y: 1 } }: Props) {
  const native = linearGradient();
  if (!native) {
    return <View style={[{ backgroundColor: colors[0] }, style]}>{children}</View>;
  }
  const { LinearGradient } = native;
  return (
    <LinearGradient
      colors={colors as unknown as readonly [string, string, ...string[]]}
      start={start}
      end={end}
      style={style}>
      {children}
    </LinearGradient>
  );
}
