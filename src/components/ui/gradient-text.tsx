import { Text, type StyleProp, type TextStyle } from 'react-native';

import { makeStyles, useTheme } from '@/theme';

import { Gradient, maskedView } from './gradient';

type Props = {
  children: string;
  style?: StyleProp<TextStyle>;
  colors?: readonly string[];
  accessibilityRole?: 'header';
};

/** Text filled with a left-to-right gradient, like the web's page titles. */
export function GradientText({ children, style, colors, accessibilityRole }: Props) {
  const { gradients } = useTheme();
  const styles = useStyles();
  const masked = maskedView();
  if (!masked) {
    return (
      <Text style={[style, styles.fallback]} accessibilityRole={accessibilityRole}>
        {children}
      </Text>
    );
  }
  const MaskedView = masked.default;
  return (
    <MaskedView
      accessible
      accessibilityRole={accessibilityRole}
      accessibilityLabel={children}
      maskElement={<Text style={style}>{children}</Text>}>
      <Gradient colors={colors ?? gradients.title} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        {/* Invisible copy that gives the gradient the text's size. */}
        <Text style={[style, styles.hidden]}>{children}</Text>
      </Gradient>
    </MaskedView>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  hidden: {
    opacity: 0,
  },
  fallback: {
    color: colors.infoText,
  },
}));
