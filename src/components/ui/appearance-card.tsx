import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { makeStyles, spacing, useTheme } from '@/theme';

import { Card } from './card';
import { ThemeToggle } from './theme-toggle';

/** Light or dark, as on the web: one sun/moon button. The choice is kept on this phone. */
export function AppearanceCard({ index = 0 }: { index?: number }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  return (
    <Card index={index} style={styles.card}>
      <View style={styles.label}>
        <Text style={theme.text.heading}>{t('theme.title')}</Text>
        <Text style={theme.text.muted}>{theme.scheme === 'dark' ? t('theme.dark') : t('theme.light')}</Text>
      </View>
      <ThemeToggle />
    </Card>
  );
}

const useStyles = makeStyles(() => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  label: {
    flex: 1,
    gap: 2,
  },
}));
