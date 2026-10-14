import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useTranslation } from 'react-i18next';

import { useCycle, useLoop } from '@/components/ui/motion';
import { colors, fonts } from '@/theme';

const SIZE = 132;

/** A ring that grows and fades out, over and over (the web's auth-ring). */
function Ring({ delay }: { delay: number }) {
  const t = useCycle(3000, delay);
  const style = useAnimatedStyle(() => {
    const p = t.get();
    return { opacity: 0.6 * (1 - p), transform: [{ scale: 0.85 + p * 0.5 }] };
  });
  return <Animated.View style={[styles.ring, style]} />;
}

/** The web's face-scan illustration: face icon, scan line, pulsing rings, corner brackets, a status chip. */
export function FaceScan() {
  const { t } = useTranslation();
  const scan = useCycle(2800);
  const float = useLoop(6000);
  // Sweeps down, fading in at the top and out at the bottom (the web's auth-scan-line).
  const line = useAnimatedStyle(() => {
    const p = scan.get();
    return { top: 12 + p * (SIZE - 28), opacity: p < 0.1 ? p * 10 : p > 0.9 ? (1 - p) * 10 : 1 };
  });
  const chip = useAnimatedStyle(() => ({ transform: [{ translateY: -10 * float.get() }] }));

  return (
    <View style={styles.wrap} accessible accessibilityLabel={t('brand.faceCheck')}>
      <Ring delay={0} />
      <Ring delay={1500} />
      <View style={styles.box}>
        <Ionicons name="scan-outline" size={84} color="rgba(255, 255, 255, 0.92)" />
        <Ionicons name="person-outline" size={38} color="rgba(255, 255, 255, 0.92)" style={styles.person} />
        <Animated.View style={[styles.scanLine, line]} />
      </View>
      <View style={[styles.corner, styles.tl]} />
      <View style={[styles.corner, styles.tr]} />
      <View style={[styles.corner, styles.bl]} />
      <View style={[styles.corner, styles.br]} />
      <Animated.View style={[styles.chip, chip]}>
        <Ionicons name="checkmark-circle" size={14} color={colors.success} />
        <Text style={styles.chipText}>{t('brand.faceVerified')}</Text>
      </Animated.View>
    </View>
  );
}

const corner = { position: 'absolute', width: 22, height: 22, borderColor: '#FFFFFF' } as const;

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignSelf: 'center',
  },
  ring: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  box: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  person: {
    position: 'absolute',
  },
  scanLine: {
    position: 'absolute',
    left: 18,
    right: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#67E8F9',
    shadowColor: '#67E8F9',
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
  corner,
  tl: { top: -6, left: -6, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 14 },
  tr: { top: -6, right: -6, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 14 },
  bl: { bottom: -6, left: -6, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 14 },
  br: { bottom: -6, right: -6, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 14 },
  chip: {
    position: 'absolute',
    right: -124,
    top: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: '#111827',
  },
});
