import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatDateShort, parseDateParam } from '@/lib/format';
import { colors, fonts, radius, spacing, text } from '@/theme';

import { Button } from './button';
import { MonthGrid } from './month-grid';

type Props = {
  label: string;
  /** "2026-10-13", or null for none. */
  value: string | null;
  onChange: (value: string | null) => void;
  /** Offer "No date" (for optional dates). */
  clearable?: boolean;
};

/** A form field that opens a month calendar to pick a date. */
export function DateField({ label, value, onChange, clearable }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => (value ? parseDateParam(value) : new Date()));

  const show = () => {
    setMonth(value ? parseDateParam(value) : new Date());
    setOpen(true);
  };

  return (
    <View style={styles.field}>
      <Text style={text.muted}>{label}</Text>
      <Pressable onPress={show} accessibilityRole="button" accessibilityLabel={label} style={styles.input}>
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value ? formatDateShort(value) : t('form.noDate')}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={text.heading}>{label}</Text>
            <MonthGrid
              month={month}
              onMonthChange={setMonth}
              selected={value}
              onSelect={(date) => {
                onChange(date);
                setOpen(false);
              }}
            />
            {clearable ? (
              <Button
                variant="secondary"
                label={t('form.noDate')}
                onPress={() => {
                  onChange(null);
                  setOpen(false);
                }}
              />
            ) : null}
            <Button variant="link" label={t('form.close')} onPress={() => setOpen(false)} />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
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
    backgroundColor: colors.cardRaised,
    paddingHorizontal: spacing.md,
  },
  value: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
  },
  placeholder: {
    color: colors.textMuted,
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
    gap: spacing.md,
  },
});
