import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, radius, spacing, text } from '@/theme';

import { Button } from './button';

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

type Props = {
  label: string;
  /** "20:00" */
  value: string;
  onChange: (value: string) => void;
};

/** A form field that opens an hour and minute picker (minutes in 5s, plus the current one). */
export function TimeField({ label, value, onChange }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState(value.slice(0, 2));
  const [minute, setMinute] = useState(value.slice(3, 5));
  // Keep an odd minute (e.g. 09:07 from the web) choosable.
  const minutes = MINUTES.includes(minute) ? MINUTES : [...MINUTES, minute].sort();

  const show = () => {
    setHour(value.slice(0, 2));
    setMinute(value.slice(3, 5));
    setOpen(true);
  };

  return (
    <View style={styles.field}>
      <Text style={text.muted}>{label}</Text>
      <Pressable onPress={show} accessibilityRole="button" accessibilityLabel={label} style={styles.input}>
        <Text style={styles.value}>{value}</Text>
        <Ionicons name="time-outline" size={18} color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={text.heading}>{`${label}: ${hour}:${minute}`}</Text>
            <Text style={text.muted}>{t('time.hour')}</Text>
            <Grid items={HOURS} selected={hour} onSelect={setHour} />
            <Text style={text.muted}>{t('time.minute')}</Text>
            <Grid items={minutes} selected={minute} onSelect={setMinute} />
            <Button
              label={t('time.set')}
              onPress={() => {
                onChange(`${hour}:${minute}`);
                setOpen(false);
              }}
            />
            <Button variant="link" label={t('form.close')} onPress={() => setOpen(false)} />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

function Grid({ items, selected, onSelect }: { items: string[]; selected: string; onSelect: (v: string) => void }) {
  return (
    <View style={styles.grid}>
      {items.map((item) => {
        const on = item === selected;
        return (
          <Pressable
            key={item}
            onPress={() => onSelect(item)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[styles.cell, on && styles.cellOn]}>
            <Text style={[styles.cellText, on && styles.cellTextOn]}>{item}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flex: 1,
    gap: spacing.xs,
  },
  input: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
  },
  value: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 18,
    color: colors.text,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: spacing.md,
  },
  sheet: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    gap: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cell: {
    width: '14%',
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cellOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  cellText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
  },
  cellTextOn: {
    color: colors.primaryText,
  },
});
