import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from 'react-native';

import { PressableScale } from '@/components/ui/motion';
import { fonts, makeStyles, radius, spacing } from '@/theme';

type Props = {
  label: string;
  /** "check-in": blue, as the web's Start Shift; "check-out": red, as its End Session. */
  mode: 'check-in' | 'check-out';
  disabled?: boolean;
  onPress: () => void;
};

/** A plain full-width check-in / check-out button, as on the web member page. */
export function CheckInButton({ label, mode, disabled, onPress }: Props) {
  const styles = useStyles();
  const out = mode === 'check-out';

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={[styles.button, out && styles.out, disabled && styles.disabled]}>
      <Ionicons name={out ? 'log-out-outline' : 'location-outline'} size={18} color="#FFFFFF" />
      <Text style={styles.label}>{label}</Text>
    </PressableScale>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  button: {
    height: 52,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  out: {
    backgroundColor: colors.danger,
    shadowColor: colors.danger,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.primaryText,
  },
  disabled: {
    opacity: 0.4,
  },
}));
