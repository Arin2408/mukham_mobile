import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Option } from '@/api/people';
import { fonts, makeStyles, radius, spacing, useTheme } from '@/theme';

type Props = {
  label: string;
  value: number | null;
  options: Option[];
  onChange: (value: number | null) => void;
  /** Offered first, for "no choice" (e.g. "None" or "The organisation"). */
  noneLabel?: string;
};

/** A form field that opens a searchable list of choices. */
export function PickerField({ label, value, options, onChange, noneLabel }: Props) {
  const styles = useStyles();
  const { colors, text } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.id === value);

  return (
    <View style={styles.field}>
      <Text style={text.muted}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={styles.input}>
        <Text style={[styles.value, !current && styles.placeholder]} numberOfLines={1}>
          {current?.name ?? noneLabel ?? t('form.choose')}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>
      <OptionSheet
        visible={open}
        title={label}
        options={options}
        value={value}
        noneLabel={noneLabel}
        onChoose={(choice) => {
          onChange(choice);
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}

type SheetProps = {
  visible: boolean;
  title: string;
  options: Option[];
  value: number | null;
  noneLabel?: string;
  onChoose: (value: number | null) => void;
  onClose: () => void;
};

/** A full-screen, searchable list of choices. */
export function OptionSheet({ visible, title, options, value, noneLabel, onChoose, onClose }: SheetProps) {
  const styles = useStyles();
  const { colors, text } = useTheme();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase();
  const shown = useMemo(
    () => (query ? options.filter((o) => o.name.toLowerCase().includes(query)) : options),
    [options, query],
  );
  const rows: (Option | null)[] = noneLabel && !query ? [null, ...shown] : shown;

  const close = () => {
    setSearch('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <SafeAreaView style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <Text style={text.heading}>{title}</Text>
          <Pressable onPress={close} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('form.close')}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('form.search')}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={t('form.search')}
          autoCorrect={false}
          style={styles.search}
        />
        <FlatList
          data={rows}
          keyExtractor={(o) => (o ? String(o.id) : 'none')}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Text style={[text.muted, styles.empty]}>{t('form.noMatch')}</Text>}
          renderItem={({ item }) => {
            const selected = (item?.id ?? null) === value;
            return (
              <Pressable
                onPress={() => {
                  setSearch('');
                  onChoose(item?.id ?? null);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
                <Text style={[styles.optionText, !item && styles.placeholder]}>{item?.name ?? noneLabel}</Text>
                {selected ? <Ionicons name="checkmark" size={20} color={colors.primary} /> : null}
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const useStyles = makeStyles(({ colors, text }) => ({
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
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
    gap: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  search: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    backgroundColor: colors.cardRaised,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  pressed: {
    opacity: 0.6,
  },
  optionText: {
    ...text.body,
    fontSize: 16,
    flex: 1,
  },
  empty: {
    textAlign: 'center',
    marginTop: spacing.lg,
  },
}));
