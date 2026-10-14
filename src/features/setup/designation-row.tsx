import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { errorMessage } from '@/api/errors';
import { deleteDesignation, updateDesignation, type Designation } from '@/api/setup';
import { colors, fonts, radius, spacing, text } from '@/theme';

/** One designation: tap the pencil to rename, the bin to delete. */
export function DesignationRow({ designation, onChanged }: { designation: Designation; onChanged: () => void }) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(designation.details);
  const onError = (error: unknown) => Alert.alert(t('setup.couldNotSave'), errorMessage(error, t));

  const rename = useMutation({
    mutationFn: () => updateDesignation(designation.designation_id, name.trim()),
    onSuccess: () => {
      setEditing(false);
      onChanged();
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: () => deleteDesignation(designation.designation_id),
    onSuccess: onChanged,
    onError,
  });

  const confirmRemove = () =>
    Alert.alert(t('setup.deleteTitle', { name: designation.details }), undefined, [
      { text: t('checkIn.cancel'), style: 'cancel' },
      { text: t('setup.delete'), style: 'destructive', onPress: () => remove.mutate() },
    ]);

  return (
    <View style={styles.row}>
      {editing ? (
        <TextInput
          value={name}
          onChangeText={setName}
          autoFocus
          accessibilityLabel={t('setup.rename')}
          style={styles.inlineInput}
          onSubmitEditing={() => name.trim() && rename.mutate()}
        />
      ) : (
        <Text style={styles.rowText}>{designation.details}</Text>
      )}
      <Pressable
        onPress={() => (editing ? name.trim() && rename.mutate() : setEditing(true))}
        accessibilityRole="button"
        accessibilityLabel={editing ? t('person.save') : t('setup.renameItem', { name: designation.details })}
        hitSlop={8}>
        <Ionicons name={editing ? 'checkmark' : 'create-outline'} size={20} color={colors.text} />
      </Pressable>
      <Pressable
        onPress={confirmRemove}
        accessibilityRole="button"
        accessibilityLabel={t('setup.deleteItem', { name: designation.details })}
        hitSlop={8}>
        <Ionicons name="trash-outline" size={20} color={colors.danger} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  rowText: {
    ...text.body,
    flex: 1,
  },
  inlineInput: {
    flex: 1,
    minHeight: 44,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
  },
});
