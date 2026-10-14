import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { fonts, makeStyles, spacing, useTheme } from '@/theme';

/** Shown once, before a face is saved for the first time (India's DPDP Act). */
export default function ConsentScreen() {
  const styles = useStyles();
  const { colors, text } = useTheme();
  const { t } = useTranslation();
  const [agreed, setAgreed] = useState(false);

  return (
    <Screen title={t('consent.title')}>
      <View style={styles.points}>
        <Text style={styles.point}>{t('consent.p1')}</Text>
        <Text style={styles.point}>{t('consent.p2')}</Text>
        <Text style={styles.point}>{t('consent.p3')}</Text>
      </View>

      <Pressable
        onPress={() => setAgreed(!agreed)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agreed }}
        style={styles.agree}>
        <Ionicons
          name={agreed ? 'checkbox' : 'square-outline'}
          size={26}
          color={agreed ? colors.primary : colors.textMuted}
        />
        <Text style={text.body}>{t('consent.agree')}</Text>
      </Pressable>

      <Button label={t('consent.accept')} onPress={() => router.replace('/face')} disabled={!agreed} />
      <Button variant="link" label={t('consent.back')} onPress={() => router.back()} />
    </Screen>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  points: {
    gap: spacing.md,
  },
  point: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  agree: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
}));
