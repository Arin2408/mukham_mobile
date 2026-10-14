import { Image, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useTheme } from '@/theme';

import { useLoop } from './motion';

const GLOW = require('../../../assets/images/glow.png');

type BlobProps = {
  color: string;
  size: number;
  top: number;
  left: number;
  opacity: number;
  delay: number;
};

function Blob({ color, size, top, left, opacity, delay }: BlobProps) {
  const t = useLoop(18000, delay);
  // The web's blob-drift: wander about 40 px and breathe a little.
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: (t.get() - 0.5) * 70 },
      { translateY: (0.5 - t.get()) * 50 },
      { scale: 0.95 + t.get() * 0.13 },
    ],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', top, left, width: size, height: size }, style]}>
      <Image source={GLOW} style={{ width: size, height: size, tintColor: color, opacity }} />
    </Animated.View>
  );
}

type Props = {
  /** "panel": strong glows for a coloured header; "page": faint ones behind content. */
  variant?: 'panel' | 'page';
};

/** Soft blue, purple and cyan light drifting slowly, as behind the web's sign-in. */
export function GlowBackground({ variant = 'page' }: Props) {
  const { scheme } = useTheme();
  const strong = variant === 'panel';
  // On a white page the same glow looks twice as strong.
  const k = !strong && scheme === 'light' ? 0.5 : 1;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Blob color={strong ? '#22D3EE' : '#3B82F6'} size={340} top={-140} left={-120} opacity={(strong ? 0.25 : 0.22) * k} delay={0} />
      <Blob color={strong ? '#D946EF' : '#A855F7'} size={380} top={strong ? 60 : 260} left={140} opacity={(strong ? 0.22 : 0.18) * k} delay={6000} />
      {strong ? null : <Blob color="#06B6D4" size={260} top={520} left={-60} opacity={0.12 * k} delay={3000} />}
    </View>
  );
}
