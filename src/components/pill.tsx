import { StyleSheet, Text, View } from 'react-native';

import { fonts, useTheme, type Palette } from '@/theme';

export type PillTone = 'good' | 'warn' | 'bad' | 'neutral' | 'info';

function tones(colors: Palette): Record<PillTone, { bg: string; fg: string }> {
  return {
    good: { bg: 'rgba(22, 163, 74, 0.15)', fg: colors.successText },
    warn: { bg: 'rgba(234, 179, 8, 0.15)', fg: colors.warningText },
    bad: { bg: colors.dangerSoft, fg: colors.dangerText },
    info: { bg: colors.primarySoft, fg: colors.infoText },
    neutral: { bg: colors.subtle, fg: colors.textMuted },
  };
}

/** A small coloured label: "On time", "Late", "Overdue"… */
export function Pill({ label, tone = 'neutral' }: { label: string; tone?: PillTone }) {
  const { colors } = useTheme();
  const { bg, fg } = tones(colors)[tone];
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
});
