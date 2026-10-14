import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Segmented } from '@/components/segmented';
import { makeStyles, spacing, useThemeChoice, type Scheme } from '@/theme';

import { Card } from './card';

/** Light or dark, as on the web; the choice is kept on this phone. */
export function AppearanceCard({ index = 0 }: { index?: number }) {
  const { t } = useTranslation();
  const { theme, setScheme } = useThemeChoice();
  const styles = useStyles();
  return (
    <Card index={index} style={styles.card}>
      <View style={styles.head}>
        <Ionicons name={theme.scheme === 'dark' ? 'moon-outline' : 'sunny-outline'} size={18} color={theme.colors.infoText} />
        <Text style={theme.text.heading}>{t('theme.title')}</Text>
      </View>
      <Segmented<Scheme>
        value={theme.scheme}
        onChange={setScheme}
        options={[
          { value: 'dark', label: t('theme.dark') },
          { value: 'light', label: t('theme.light') },
        ]}
      />
    </Card>
  );
}

const useStyles = makeStyles(() => ({
  card: {
    gap: spacing.md,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
}));
