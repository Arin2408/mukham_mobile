import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { mediaUrl } from '@/api/config';
import { fonts } from '@/theme';

import { Gradient } from './gradient';

// Gradient pairs for initials, picked by name so a person keeps their colour.
const PAIRS = [
  ['#3B82F6', '#6366F1'],
  ['#8B5CF6', '#A855F7'],
  ['#06B6D4', '#3B82F6'],
  ['#10B981', '#06B6D4'],
  ['#F59E0B', '#EF4444'],
  ['#EC4899', '#8B5CF6'],
] as const;

function pairFor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PAIRS[h % PAIRS.length];
}

type Props = { name: string; photo?: string | null; size?: number };

/** A person's photo, or their initials on a colour picked from their name. */
export function PersonAvatar({ name, photo, size = 44 }: Props) {
  const round = { width: size, height: size, borderRadius: size / 2 };
  const uri = mediaUrl(photo);
  if (uri) return <Image source={{ uri }} style={round} contentFit="cover" transition={150} />;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
  return (
    <Gradient colors={pairFor(name)} style={[round, { alignItems: 'center', justifyContent: 'center' }]}>
      <View>
        <Text style={{ fontFamily: fonts.bold, fontSize: size * 0.38, color: '#FFFFFF' }}>{initials || '?'}</Text>
      </View>
    </Gradient>
  );
}
