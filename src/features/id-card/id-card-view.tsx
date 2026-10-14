import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { mediaUrl } from '@/api/config';
import { getIdCard, verifyUrl } from '@/api/id-card';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { QrCode } from '@/components/qr-code';
import { StateView } from '@/components/state-view';
import { fonts, makeStyles, radius, spacing, useTheme } from '@/theme';

type Props = {
  /** Undefined while the caller is still finding out whose card it is. */
  employeeId: number | undefined;
  /** An error from that lookup, shown instead of the card. */
  lookupError?: unknown;
  onRetryLookup?: () => void;
};

/**
 * The virtual ID card, full screen, with a Close button. Its QR code opens
 * the web app's /verify page. Used by employees (their own card) and admins.
 */
export function IdCardView({ employeeId, lookupError, onRetryLookup }: Props) {
  const styles = useStyles();
  const { text } = useTheme();
  const { t } = useTranslation();
  const card = useQuery({
    queryKey: ['id-card', employeeId],
    queryFn: () => getIdCard(employeeId!),
    enabled: employeeId != null,
  });

  const failed = lookupError ?? card.error;
  const c = card.data;

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
          <StateView kind="loading" />
        ) : (
          <View style={styles.card}>
            <Text style={styles.org}>{c.organisation_name ?? t('idCard.title')}</Text>
            <Avatar uri={mediaUrl(c.photo)} size={112} />
            <Text style={styles.name}>{`${c.first_name} ${c.last_name}`.trim()}</Text>
            <Text style={text.muted}>{c.designation_name ?? ''}</Text>

            <View style={styles.facts}>
              <Fact label={t('idCard.employeeId')} value={`#${c.employee_id}`} />
              <Fact label={t('idCard.department')} value={c.department_name ?? t('profile.notSet')} />
            </View>

            <QrCode value={verifyUrl(c.employee_id)} size={180} />
            <Text style={styles.scan}>{t('idCard.scan')}</Text>
          </View>
        )}
      </ScrollView>
      <View style={styles.actions}>
        <Button label={t('idCard.close')} variant="secondary" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  const { text } = useTheme();
  return (
    <View style={styles.fact}>
      <Text style={text.muted}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

const useStyles = makeStyles(({ colors, text }) => ({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  org: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  name: {
    ...text.title,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  facts: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'space-around',
    marginVertical: spacing.md,
  },
  fact: {
    alignItems: 'center',
    gap: 2,
  },
  factValue: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
  },
  scan: {
    ...text.muted,
    marginTop: spacing.xs,
  },
  actions: {
    padding: spacing.md,
  },
}));
