import makeQr from 'qrcode-generator';
import { memo, useMemo } from 'react';
import { View } from 'react-native';

type Props = {
  value: string;
  /** Width and height in points, including the quiet zone. */
  size: number;
};

/**
 * A QR code made on the phone (no web service sees the data), drawn as
 * views: each row's dark runs become one view, which keeps the count low.
 */
export const QrCode = memo(function QrCode({ value, size }: Props) {
  const runs = useMemo(() => {
    const qr = makeQr(0, 'M');
    qr.addData(value);
    qr.make();
    const count = qr.getModuleCount();
    const cells: { row: number; col: number; length: number }[] = [];
    for (let row = 0; row < count; row++) {
      let col = 0;
      while (col < count) {
        if (!qr.isDark(row, col)) {
          col++;
          continue;
        }
        const start = col;
        while (col < count && qr.isDark(row, col)) col++;
        cells.push({ row, col: start, length: col - start });
      }
    }
    return { count, cells };
  }, [value]);

  // Four modules of white around the code, as scanners expect.
  const cell = size / (runs.count + 8);
  const offset = cell * 4;

  return (
    <View style={{ width: size, height: size, backgroundColor: '#FFFFFF' }} accessible accessibilityRole="image" accessibilityLabel={`QR code: ${value}`}>
      {runs.cells.map(({ row, col, length }) => (
        <View
          key={`${row}-${col}`}
          style={{
            position: 'absolute',
            top: offset + row * cell,
            left: offset + col * cell,
            width: length * cell + 0.5,
            height: cell + 0.5,
            backgroundColor: '#000000',
          }}
        />
      ))}
    </View>
  );
});
