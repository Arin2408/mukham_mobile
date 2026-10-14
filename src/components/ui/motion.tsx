import { useEffect, type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { motion } from '@/theme';

/** The web's easing for things arriving: cubic-bezier(0.22, 1, 0.36, 1). */
export const easeOut = Easing.bezier(0.22, 1, 0.36, 1);

/** The web's card entrance: fade up 12 px, staggered by position (capped, so long lists don't wait). */
export function enter(index = 0) {
  return FadeInDown.duration(motion.enter)
    .delay(Math.min(index, 8) * motion.stagger)
    .easing(easeOut)
    .withInitialValues({ opacity: 0, transform: [{ translateY: motion.rise }] });
}

type FadeInProps = { index?: number; style?: StyleProp<ViewStyle>; children: ReactNode };

/** Fades its content up into place when it first appears. */
export function FadeIn({ index = 0, style, children }: FadeInProps) {
  return (
    <Animated.View entering={enter(index)} style={style}>
      {children}
    </Animated.View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ScaleProps = PressableProps & { style?: StyleProp<ViewStyle>; children: ReactNode };

/** A Pressable that dips slightly while pressed, so a tap feels answered. */
export function PressableScale({ style, children, onPressIn, onPressOut, disabled, ...rest }: ScaleProps) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        scale.set(withTiming(0.97, { duration: 90 }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.set(withTiming(1, { duration: 160, easing: easeOut }));
        onPressOut?.(e);
      }}
      style={[style, animated]}>
      {children}
    </AnimatedPressable>
  );
}

/** A value that drifts back and forth forever (still when "reduce motion" is on). */
export function useLoop(duration: number, delay = 0) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    const half = { duration: duration / 2, easing: Easing.inOut(Easing.sin) };
    const start = setTimeout(() => {
      t.set(withRepeat(withSequence(withTiming(1, half), withTiming(0, half)), -1));
    }, delay);
    return () => clearTimeout(start);
  }, [reduced, duration, delay, t]);
  return t;
}

/** A value that runs 0 → 1 and starts again, forever (still when "reduce motion" is on). */
export function useCycle(duration: number, delay = 0) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    const start = setTimeout(() => {
      t.set(withRepeat(withTiming(1, { duration, easing: Easing.out(Easing.quad) }), -1, false));
    }, delay);
    return () => clearTimeout(start);
  }, [reduced, duration, delay, t]);
  return t;
}
