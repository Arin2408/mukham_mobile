import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { Gradient } from '@/components/ui/gradient';
import { PressableScale, useCycle } from '@/components/ui/motion';
import { colors, fonts, gradients } from '@/theme';

const SIZE = 148;

type Props = {
  label: string;
  /** "in": shows Check out, calm; "out": Check in, pulsing to invite a tap. */
  mode: 'check-in' | 'check-out';
  disabled?: boolean;
  onPress: () => void;
};

/** The big round check-in button: brand gradient, with a ring pulsing outward while there's something to do. */
export function CheckInButton({ label, mode, disabled, onPress }: Props) {
  const pulse = useCycle(2200);
  const ring = useAnimatedStyle(() => ({
    opacity: disabled ? 0 : 0.5 * (1 - pulse.get()),
    transform: [{ scale: 1 + pulse.get() * 0.35 }],
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.ring, mode === 'check-out' && styles.ringOut, ring]} pointerEvents="none" />
      <PressableScale
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !!disabled }}
        style={[styles.button, disabled && styles.disabled]}>
        <Gradient
          colors={mode === 'check-out' ? ['#16A34A', '#0D9488'] : gradients.panel}
          style={styles.fill}>
          <Ionicons name={mode === 'check-out' ? 'log-out-outline' : 'scan-outline'} size={44} color="#FFFFFF" />
          <Text style={styles.label}>{label}</Text>
        </Gradient>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE + 60,
    height: SIZE + 60,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 3,
    borderColor: '#818CF8',
  },
  ringOut: {
    borderColor: '#34D399',
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    shadowColor: colors.primary,
    shadowOpacity: 0.55,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  fill: {
    flex: 1,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: '#FFFFFF',
  },
  disabled: {
    opacity: 0.4,
  },
});
