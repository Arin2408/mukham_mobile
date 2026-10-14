import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { askPushPermission, markPushAsked, registerForPush } from '@/features/notifications/push';
import { fonts, makeStyles, spacing, useTheme } from '@/theme';

/**
 * Shown once, before the phone's own permission question, so people know
 * what the reminders are for. "Not now" leaves the choice in Profile.
 */
export default function NotificationsIntroScreen() {
  const styles = useStyles();
  const { colors, text } = useTheme();
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const turnOn = async () => {
    setBusy(true);
    try {
      if ((await askPushPermission()) === 'granted') {
        await registerForPush();
      }
    } catch (error) {
      if (__DEV__) console.warn('[push] could not turn on:', error);
    } finally {
      router.back();
    }
  };

  const notNow = async () => {
    await markPushAsked();
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <View style={styles.icon}>
          <Ionicons name="notifications-outline" size={40} color={colors.text} />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          {t('push.introTitle')}
        </Text>
        {[t('push.introShift'), t('push.introCheckOut'), t('push.introTask')].map((line) => (
          <View key={line} style={styles.line}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            <Text style={styles.lineText}>{line}</Text>
          </View>
        ))}
        <Text style={text.muted}>{t('push.introNote')}</Text>
      </View>
      <View style={styles.actions}>
        <Button label={t('push.turnOn')} onPress={turnOn} loading={busy} />
        <Button variant="link" label={t('push.notNow')} onPress={notNow} disabled={busy} />
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ colors, text }) => ({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  icon: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  lineText: {
    ...text.body,
    flex: 1,
  },
  actions: {
    gap: spacing.sm,
  },
}));
