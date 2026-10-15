import { StyleSheet, View } from 'react-native';

type Props = { size?: number; color?: string; strokeWidth?: number };

/**
 * The Mukham mark, drawn as the web's lucide ScanFace: four corner brackets,
 * two eyes and a smile on lucide's 24-unit grid.
 */
export function ScanFaceIcon({ size = 24, color = '#FFFFFF', strokeWidth = 2 }: Props) {
  const u = size / 24;
  const sw = strokeWidth * u;
  const half = strokeWidth / 2;
  // Brackets run from 3 to 7 with round ends, so each box spans 3 - half to 7 + half.
  const at = (3 - half) * u;
  const corner = { position: 'absolute', width: (4 + strokeWidth) * u, height: (4 + strokeWidth) * u, borderColor: color } as const;
  const bend = (2 + half) * u;
  const eye = {
    position: 'absolute',
    top: (9 - half) * u,
    width: sw,
    height: sw,
    borderRadius: sw / 2,
    backgroundColor: color,
  } as const;
  // The smile is the bottom of a circle through (8, 14), (12, 16) and (16, 14): centre (12, 11), radius 5.
  const ring = (5 + half) * u;

  return (
    <View style={{ width: size, height: size }}>
      <View style={[corner, { left: at, top: at, borderTopWidth: sw, borderLeftWidth: sw, borderTopLeftRadius: bend }]} />
      <View style={[corner, { right: at, top: at, borderTopWidth: sw, borderRightWidth: sw, borderTopRightRadius: bend }]} />
      <View style={[corner, { left: at, bottom: at, borderBottomWidth: sw, borderLeftWidth: sw, borderBottomLeftRadius: bend }]} />
      <View style={[corner, { right: at, bottom: at, borderBottomWidth: sw, borderRightWidth: sw, borderBottomRightRadius: bend }]} />
      <View style={[eye, { left: (9 - half) * u }]} />
      <View style={[eye, { left: (15 - half) * u }]} />
      <View style={[styles.clip, { top: 13.5 * u, height: (2.5 + half) * u }]}>
        <View
          style={{
            position: 'absolute',
            left: 12 * u - ring,
            top: 11 * u - ring - 13.5 * u,
            width: ring * 2,
            height: ring * 2,
            borderRadius: ring,
            borderWidth: sw,
            borderColor: color,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { position: 'absolute', left: 0, right: 0, overflow: 'hidden' },
});
