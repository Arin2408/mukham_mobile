import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { GlowBackground } from '@/components/ui/glow-background';
import { Gradient } from '@/components/ui/gradient';
import { FadeIn } from '@/components/ui/motion';
import { ScanFaceIcon } from '@/components/ui/scan-face-icon';
import { fonts, spacing, useTheme } from '@/theme';

import { FaceScan } from './face-scan';

type Props = { tagline: string; scan?: boolean; topInset?: number };

// The face-scan illustration is off by default: the sign-in page stays calm.

/** The sign-in header, as the web's brand panel: gradient, glows, logo, face scan. */
export function BrandPanel({ tagline, scan = false, topInset = 0 }: Props) {
  const { gradients } = useTheme();
  const { t } = useTranslation();
  return (
    <Gradient colors={gradients.panel} style={[styles.panel, { paddingTop: topInset + spacing.lg }]}>
      <GlowBackground variant="panel" />
      <FadeIn style={styles.logoRow}>
        <View style={styles.logoTile}>
          <ScanFaceIcon size={22} color="#FFFFFF" />
        </View>
        <Text style={styles.logo}>Mukham</Text>
      </FadeIn>
      {scan ? (
        <FadeIn index={1} style={styles.scan}>
          <FaceScan />
        </FadeIn>
      ) : null}
      <FadeIn index={2}>
        <Text style={styles.headline}>{t('brand.headline')}</Text>
        <Text style={styles.tagline}>{tagline}</Text>
      </FadeIn>
    </Gradient>
  );
}

const styles = StyleSheet.create({
  panel: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl + spacing.lg,
    overflow: 'hidden',
    gap: spacing.xl,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoTile: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: '#FFFFFF',
  },
  scan: {
    paddingVertical: spacing.md,
    marginRight: 80,
  },
  headline: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: '#FFFFFF',
  },
  tagline: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.78)',
    marginTop: 4,
  },
});
