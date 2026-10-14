import { ActivityIndicator, StyleSheet, Text } from 'react-native';

import { colors, fonts, radius, spacing } from '@/theme';

import { PressableScale } from './ui/motion';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'link' | 'danger';
  loading?: boolean;
  disabled?: boolean;
};

export function Button({ label, onPress, variant = 'primary', loading, disabled }: Props) {
  const inactive = disabled || loading;

  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={[styles.base, styles[variant], inactive && styles.inactive]}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.primaryText : colors.text} />
      ) : (
        <Text style={[styles.label, labelStyles[variant]]}>{label}</Text>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  // A soft blue glow under the main button, as the web's hover shadow.
  primary: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  secondary: { borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card },
  danger: { borderWidth: 1, borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  link: { minHeight: 40 },
  inactive: { opacity: 0.5 },
  label: { fontFamily: fonts.semibold, fontSize: 16 },
});

const labelStyles = StyleSheet.create({
  primary: { color: colors.primaryText },
  secondary: { color: colors.text },
  danger: { color: colors.danger },
  link: { color: colors.primary, fontFamily: fonts.medium, fontSize: 15 },
});
