import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { mediaUrl } from '@/api/config';
import { getIdCard, verifyUrl, type IdCard } from '@/api/id-card';
import { QrCode } from '@/components/qr-code';
import { StateView } from '@/components/state-view';
import { Gradient } from '@/components/ui/gradient';
import { GradientText } from '@/components/ui/gradient-text';
import { easeOut, FadeIn, PressableScale } from '@/components/ui/motion';
import { PersonAvatar } from '@/components/ui/person-avatar';
import { fonts, makeStyles, radius, spacing, useTheme } from '@/theme';

type Props = {
  /** Undefined while the caller is still finding out whose card it is. */
  employeeId: number | undefined;
  /** An error from that lookup, shown instead of the card. */
  lookupError?: unknown;
  onRetryLookup?: () => void;
};

/**
 * The virtual ID card, as on the web: a badge with a front (photo and
 * details) and a back (the QR code that opens the web's /verify page),
 * turned over with Flip. Used by employees (their own card) and admins.
 */
export function IdCardView({ employeeId, lookupError, onRetryLookup }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const card = useQuery({
    queryKey: ['id-card', employeeId],
    queryFn: () => getIdCard(employeeId!),
    enabled: employeeId != null,
  });

  const [flipped, setFlipped] = useState(false);
  const turn = useSharedValue(0);
  const flip = () => {
    const next = !flipped;
    setFlipped(next);
    turn.set(withTiming(next ? 180 : 0, { duration: 700, easing: easeOut }));
  };
  const front = useAnimatedStyle(() => ({
    transform: [{ perspective: 1400 }, { rotateY: `${turn.get()}deg` }],
  }));
  const back = useAnimatedStyle(() => ({
    transform: [{ perspective: 1400 }, { rotateY: `${turn.get() + 180}deg` }],
  }));

  const failed = lookupError ?? card.error;
  const c = card.data;
  const cardWidth = Math.min(340, width - spacing.md * 2);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {failed ? (
          <StateView
            kind="error"
            error={failed}
            onRetry={() => (lookupError ? onRetryLookup?.() : card.refetch())}
          />
        ) : !c ? (
          <View style={{ width: cardWidth }}>
            <StateView kind="loading" />
          </View>
        ) : (
          <FadeIn style={{ width: cardWidth, height: CARD_HEIGHT }}>
            <Animated.View
              style={[styles.face, front]}
              pointerEvents={flipped ? 'none' : 'auto'}
              importantForAccessibility={flipped ? 'no-hide-descendants' : 'auto'}>
              <Front card={c} />
            </Animated.View>
            <Animated.View
              style={[styles.face, back]}
              pointerEvents={flipped ? 'auto' : 'none'}
              importantForAccessibility={flipped ? 'auto' : 'no-hide-descendants'}>
              <Back card={c} />
            </Animated.View>
          </FadeIn>
        )}
      </ScrollView>

      {/* Flip and Close, under the card: easy to reach, and clear of the corner. */}
      <View style={styles.controls}>
        <PressableScale onPress={flip} disabled={!c} accessibilityRole="button" style={styles.flipButton}>
          <Ionicons name="sync-outline" size={16} color={colors.primaryText} />
          <Text style={styles.flipText}>{flipped ? t('idCard.front') : t('idCard.flip')}</Text>
        </PressableScale>
        <PressableScale
          onPress={() => router.back()}
          accessibilityRole="button"
          style={styles.closeButton}>
          <Ionicons name="close" size={18} color={colors.text} />
          <Text style={styles.closeText}>{t('idCard.close')}</Text>
        </PressableScale>
      </View>
    </SafeAreaView>
  );
}

/** Tall enough for the front's details and the back's QR code. */
const CARD_HEIGHT = 480;

type IconName = ComponentProps<typeof Ionicons>['name'];

function Front({ card: c }: { card: IdCard }) {
  const styles = useStyles();
  const { colors, gradients } = useTheme();
  const { t } = useTranslation();
  const name = `${c.first_name} ${c.last_name}`.trim();
  const photo = mediaUrl(c.photo);
  const details: [IconName, string, string, boolean?][] = [
    ['keypad-outline', t('idCard.employeeId'), `#${c.employee_id}`, true],
    ['business-outline', t('idCard.department'), c.department_name ?? t('profile.notSet')],
    ['briefcase-outline', t('idCard.designation'), c.designation_name ?? t('profile.notSet')],
  ];

  return (
    <View style={styles.cardShell}>
      <Gradient colors={['#2563EB', '#4F46E5', '#9333EA']} style={styles.band}>
        <View style={styles.bandRow}>
          <View style={styles.logoTile}>
            <Ionicons name="scan-outline" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.logo}>Mukham</Text>
          <View style={styles.grow} />
          <Text style={styles.bandLabel}>{t('idCard.title')}</Text>
        </View>
      </Gradient>

      <View style={styles.identity}>
        <View>
          <Gradient colors={gradients.brand} style={styles.photoFrame}>
            <View style={styles.photoInner}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" transition={150} />
              ) : (
                <PersonAvatar name={name} size={108} />
              )}
            </View>
          </Gradient>
          <View style={styles.verified}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          </View>
        </View>

        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        {c.designation_name ? (
          <GradientText style={styles.designation}>{c.designation_name}</GradientText>
        ) : null}
        <View style={styles.active}>
          <View style={styles.activeDot} />
          <Text style={styles.activeText}>{t('idCard.active')}</Text>
        </View>

        <View style={styles.details}>
          {details.map(([icon, label, value, mono], i) => (
            <View key={label} style={[styles.detailRow, i > 0 && styles.detailDivider]}>
              <Ionicons name={icon} size={14} color={colors.textMuted} />
              <Text style={styles.detailLabel}>{label}</Text>
              <Text style={[styles.detailValue, mono && styles.mono]} numberOfLines={1}>
                {value}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Gradient colors={['#3B82F6', '#6366F1', '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.strip} />
    </View>
  );
}

function Back({ card: c }: { card: IdCard }) {
  const styles = useStyles();
  const { gradients } = useTheme();
  const { t } = useTranslation();
  const organisation = c.organisation_name ?? t('idCard.yourOrganisation');

  return (
    <View style={styles.cardShell}>
      <Gradient colors={['#3B82F6', '#6366F1', '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.strip} />
      <View style={styles.backBody}>
        <View style={styles.center}>
          <Gradient colors={gradients.brand} style={styles.qrTile}>
            <Ionicons name="qr-code-outline" size={20} color="#FFFFFF" />
          </Gradient>
          <Text style={styles.backTitle}>{t('idCard.scan')}</Text>
          <Text style={styles.backSub}>{t('idCard.scanHint')}</Text>
        </View>

        <View style={styles.qrBox}>
          <QrCode value={verifyUrl(c.employee_id)} size={150} />
        </View>

        <View style={styles.note}>
          <Text style={styles.noteText}>{t('idCard.note', { organisation })}</Text>
        </View>

        <View style={styles.center}>
          <Text style={styles.backSub}>{t('idCard.validatedBy')}</Text>
          <Text style={styles.validator}>{organisation}</Text>
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ colors, scheme }) => ({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  flipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    minWidth: 130,
    paddingHorizontal: spacing.lg,
    borderRadius: 23,
    backgroundColor: colors.primary,
  },
  flipText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.primaryText,
  },
  closeButton: {
    flexDirection: 'row',
    gap: 6,
    height: 46,
    minWidth: 130,
    paddingHorizontal: spacing.lg,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  closeText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backfaceVisibility: 'hidden',
  },
  cardShell: {
    flex: 1,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    overflow: 'hidden',
    shadowColor: scheme === 'dark' ? '#2563EB' : colors.shadow,
    shadowOpacity: scheme === 'dark' ? 0.25 : 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  band: {
    height: 132,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  bandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoTile: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#FFFFFF',
  },
  bandLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  identity: {
    flex: 1,
    alignItems: 'center',
    marginTop: -64,
    paddingHorizontal: spacing.lg,
  },
  photoFrame: {
    width: 124,
    height: 124,
    borderRadius: 22,
    padding: 3,
  },
  photoInner: {
    flex: 1,
    borderRadius: 19,
    borderWidth: 4,
    borderColor: colors.card,
    backgroundColor: colors.cardRaised,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  verified: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.success,
    borderWidth: 4,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  designation: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    marginTop: 2,
  },
  active: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  activeText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.successText,
  },
  details: {
    alignSelf: 'stretch',
    marginTop: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.subtle,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
  },
  detailDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  detailLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    flex: 1,
  },
  detailValue: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
    maxWidth: '58%',
  },
  mono: {
    fontFamily: 'monospace',
  },
  strip: {
    height: 6,
  },
  grow: {
    flex: 1,
  },
  backBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  center: {
    alignItems: 'center',
    gap: 2,
  },
  qrTile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  backTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text,
  },
  backSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  qrBox: {
    padding: spacing.sm + 4,
    borderRadius: radius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  note: {
    alignSelf: 'stretch',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.subtle,
  },
  noteText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    textAlign: 'center',
  },
  validator: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
  },
}));
