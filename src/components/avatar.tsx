import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

/** The employee's photo in a circle, or a person icon when there is none. */
export function Avatar({ uri, size = 96 }: { uri: string | null; size?: number }) {
  const style = { width: size, height: size, borderRadius: size / 2 };
  if (!uri) {
    return (
      <View style={[styles.avatarEmpty, style]}>
        <Ionicons name="person" size={size / 2} color={colors.textMuted} />
      </View>
    );
  }
  return <Image source={{ uri }} style={[styles.avatar, style]} contentFit="cover" transition={150} />;
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.card,
  },
  avatarEmpty: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
