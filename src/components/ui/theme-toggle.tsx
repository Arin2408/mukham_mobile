import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { makeStyles, useThemeChoice } from '@/theme';

import { PressableScale } from './motion';

type Props = {
  /** On the coloured sign-in panel: white glass instead of a card. */
  onPanel?: boolean;
};

/** Light / dark switch, as on the web: a moon in dark mode, a sun in light mode. */
export function ThemeToggle({ onPanel }: Props) {
  const { t } = useTranslation();
  const { theme, toggle } = useThemeChoice();
  const styles = useStyles();
  const dark = theme.scheme === 'dark';
  const iconColor = onPanel ? '#FFFFFF' : theme.colors.textMuted;

  return (
    <PressableScale
      // The new theme spreads out from here.
      onPress={(e) => toggle({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY })}
      accessibilityRole="button"
      accessibilityLabel={dark ? t('theme.toLight') : t('theme.toDark')}
      hitSlop={8}
      style={[styles.button, onPanel && styles.onPanel]}>
      {/* A new key on each switch, so the icon spins in. */}
      <Animated.View key={theme.scheme} entering={ZoomIn.springify().damping(14)}>
        <Ionicons name={dark ? 'moon-outline' : 'sunny-outline'} size={18} color={iconColor} />
      </Animated.View>
    </PressableScale>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  onPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
}));
