import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import type { SetupCounts } from '@/api/admin';
import { Card } from '@/components/ui/card';
import { PressableScale } from '@/components/ui/motion';
import { fonts, makeStyles, radius, spacing, useTheme } from '@/theme';

const STEPS: { key: keyof SetupCounts; href: Href }[] = [
  { key: 'locations', href: '/setup/offices' },
  { key: 'departments', href: '/setup/departments' },
  { key: 'designations', href: '/setup/designations' },
  { key: 'shifts', href: '/setup/shifts' },
  { key: 'employees', href: '/person/form' },
  { key: 'faces', href: '/people' },
];

/** "Finish setting up" for a new organisation; gone once every step is done. */
export function SetupChecklist({ setup, index = 0 }: { setup: SetupCounts | undefined; index?: number }) {
  const styles = useStyles();
  const { colors, text } = useTheme();
  const { t } = useTranslation();
  if (!setup) return null;

  const done = STEPS.filter((s) => setup[s.key] > 0).length;
  if (done === STEPS.length) return null;

  return (
    <Card index={index} style={styles.card}>
      <View style={styles.header}>
        <Text style={text.heading}>{t('setupChecklist.title')}</Text>
        <Text style={text.muted}>{t('setupChecklist.progress', { done, total: STEPS.length })}</Text>
      </View>
      <Text style={text.muted}>{t('setupChecklist.intro')}</Text>
      {STEPS.map((step) => {
        const complete = setup[step.key] > 0;
        return (
          <PressableScale
            key={step.key}
            accessibilityRole="button"
            accessibilityState={{ checked: complete }}
            onPress={() => router.push(step.href)}
            style={[styles.step, complete && styles.stepDone]}>
            <Ionicons
              name={complete ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
              color={complete ? colors.success : colors.textMuted}
            />
            <View style={styles.stepText}>
              <Text style={[styles.label, complete && styles.labelDone]}>{t(`setupChecklist.${step.key}`)}</Text>
              {!complete ? <Text style={text.muted}>{t(`setupChecklist.${step.key}Hint`)}</Text> : null}
            </View>
            {!complete ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null}
          </PressableScale>
        );
      })}
    </Card>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  card: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  stepDone: {
    borderColor: 'transparent',
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  stepText: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
  labelDone: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
}));
