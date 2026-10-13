import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

export type PillTone = 'good' | 'warn' | 'bad' | 'neutral' | 'info';

const TONES: Record<PillTone, { bg: string; fg: string }> = {
  good: { bg: 'rgba(22, 163, 74, 0.15)', fg: '#4ADE80' },
  warn: { bg: 'rgba(234, 179, 8, 0.15)', fg: '#FACC15' },
  bad: { bg: colors.dangerSoft, fg: '#F87171' },
  info: { bg: colors.primarySoft, fg: '#60A5FA' },
  neutral: { bg: 'rgba(163, 163, 163, 0.15)', fg: colors.textMuted },
};

/** A small coloured label: "On time", "Late", "Overdue"… */
export function Pill({ label, tone = 'neutral' }: { label: string; tone?: PillTone }) {
  const { bg, fg } = TONES[tone];
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
