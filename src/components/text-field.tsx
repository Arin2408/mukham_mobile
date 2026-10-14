import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { fonts, makeStyles, radius, spacing, useTheme } from '@/theme';

type Props = TextInputProps & {
  label: string;
};

export function TextField({ label, style, ...inputProps }: Props) {
  const styles = useStyles();
  const { colors, text } = useTheme();
  return (
    <View style={styles.field}>
      <Text style={text.muted}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={label}
        style={[styles.input, inputProps.multiline && styles.multiline, style]}
        {...inputProps}
      />
    </View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  field: {
    gap: spacing.xs,
  },
  input: {
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
  multiline: {
    minHeight: 96,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
  },
}));
