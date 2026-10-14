import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { errorMessage } from '@/api/errors';
import { addOffice, deleteOffice, getOffices, searchPlaces, updateOffice, type Office, type Place } from '@/api/setup';
import { Button } from '@/components/button';
import { ErrorBanner } from '@/components/error-banner';
import { Segmented } from '@/components/segmented';
import { StateView } from '@/components/state-view';
import { TextField } from '@/components/text-field';
import { getPosition, PositionError } from '@/features/location/get-position';
import { OfficeMap, type MapPoint, type OfficeMapHandle } from '@/features/map/office-map';
import { MAX_RADIUS, MIN_RADIUS, stepRadius } from '@/features/map/radius';
import { formatDistance } from '@/lib/format';
import { fonts, makeStyles, radius, spacing, useTheme } from '@/theme';

const LOCATION_PROBLEM = {
  permission: 'checkIn.permissionBody',
  permissionBlocked: 'checkIn.permissionBlocked',
  servicesOff: 'checkIn.servicesOff',
  timeout: 'checkIn.timeout',
} as const;

/** Add an office (no id) or edit one (?id=): name, pin on the map, check-in radius. */
export default function OfficeScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const officeId = id ? Number(id) : null;
  const offices = useQuery({ queryKey: ['admin', 'offices'], queryFn: getOffices });
  const existing = offices.data?.find((o) => o.location_id === officeId);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <Stack.Screen options={{ title: existing ? existing.location_name : t('setup.addOffice') }} />
      {offices.isError ? (
        <StateView kind="error" error={offices.error} onRetry={() => offices.refetch()} />
      ) : !offices.data || (officeId != null && !existing) ? (
        <StateView kind="loading" />
      ) : (
        <OfficeForm existing={existing} />
      )}
    </SafeAreaView>
  );
}

function OfficeForm({ existing }: { existing?: Office }) {
  const styles = useStyles();
  const { colors, text } = useTheme();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const map = useRef<OfficeMapHandle>(null);
  const [name, setName] = useState(existing?.location_name ?? '');
  const [point, setPoint] = useState<MapPoint | null>(
    existing ? { latitude: Number(existing.latitude), longitude: Number(existing.longitude) } : null,
  );
  const [radiusM, setRadiusM] = useState(existing?.radius_meters ?? 100);
  const [satellite, setSatellite] = useState(false);
  const [query, setQuery] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  // The page stops scrolling while a finger is on the map, so dragging moves the map.
  const [onMap, setOnMap] = useState(false);
  // The first point, for the map's starting view; later moves go through the handle.
  const [initial] = useState(point);

  const moveTo = (next: MapPoint) => {
    setPoint(next);
    map.current?.moveTo(next);
  };
  const changeRadius = (next: number) => {
    setRadiusM(next);
    map.current?.setRadius(next);
  };

  const search = useMutation({ mutationFn: () => searchPlaces(query.trim()) });

  const useMyLocation = async () => {
    setLocating(true);
    try {
      const here = await getPosition();
      moveTo({ latitude: here.latitude, longitude: here.longitude });
    } catch (error) {
      Alert.alert(
        t('setup.locationFailed'),
        error instanceof PositionError ? t(LOCATION_PROBLEM[error.problem]) : errorMessage(error, t),
      );
    } finally {
      setLocating(false);
    }
  };

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin'] });
  const save = useMutation({
    mutationFn: () => {
      const input = {
        location_name: name.trim(),
        latitude: Number(point!.latitude.toFixed(6)),
        longitude: Number(point!.longitude.toFixed(6)),
        radius_meters: radiusM,
      };
      return existing ? updateOffice(existing.location_id, input) : addOffice(input);
    },
    onSuccess: async () => {
      await refresh();
      router.back();
    },
  });
  const remove = useMutation({
    mutationFn: () => deleteOffice(existing!.location_id),
    onSuccess: async () => {
      await refresh();
      router.back();
    },
  });

  const submit = () => {
    const issue = !name.trim() ? t('setup.invalid.name') : !point ? t('setup.invalid.pin') : null;
    setProblem(issue);
    if (!issue) save.mutate();
  };

  const confirmRemove = () =>
    Alert.alert(t('setup.deleteTitle', { name: existing!.location_name }), t('setup.deleteOfficeBody'), [
      { text: t('checkIn.cancel'), style: 'cancel' },
      { text: t('setup.delete'), style: 'destructive', onPress: () => remove.mutate() },
    ]);

  const failure = save.error ?? remove.error;

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" scrollEnabled={!onMap}>
      <TextField label={t('setup.officeName')} value={name} onChangeText={setName} />

      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('setup.searchAddress')}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={t('setup.searchAddress')}
          returnKeyType="search"
          onSubmitEditing={() => query.trim().length >= 3 && search.mutate()}
          style={styles.searchInput}
        />
        <Button
          label={t('setup.search')}
          onPress={() => search.mutate()}
          loading={search.isPending}
          disabled={query.trim().length < 3}
        />
      </View>
      {search.isError ? <ErrorBanner message={errorMessage(search.error, t)} /> : null}
      {search.data?.length === 0 ? <Text style={text.muted}>{t('setup.noPlaces')}</Text> : null}
      {search.data?.map((place: Place) => (
        <Pressable
          key={`${place.latitude},${place.longitude}`}
          onPress={() => {
            moveTo({ latitude: place.latitude, longitude: place.longitude });
            search.reset();
          }}
          accessibilityRole="button"
          style={({ pressed }) => [styles.place, pressed && styles.pressed]}>
          <Text style={text.body} numberOfLines={2}>
            {place.name}
          </Text>
        </Pressable>
      ))}

      <Segmented
        value={satellite ? 'satellite' : 'street'}
        onChange={(v) => {
          setSatellite(v === 'satellite');
          map.current?.setSatellite(v === 'satellite');
        }}
        options={[
          { value: 'street', label: t('setup.street') },
          { value: 'satellite', label: t('setup.satellite') },
        ]}
      />
      <View onTouchStart={() => setOnMap(true)} onTouchEnd={() => setOnMap(false)} onTouchCancel={() => setOnMap(false)}>
        <OfficeMap ref={map} initial={initial} radiusMeters={radiusM} satellite={false} onPick={setPoint} />
      </View>
      <View style={styles.between}>
        <Text style={text.muted}>
          {point ? `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}` : t('setup.tapMap')}
        </Text>
        <Button variant="link" label={locating ? t('setup.locating') : t('setup.useMyLocation')} onPress={useMyLocation} disabled={locating} />
      </View>

      <Text style={text.muted}>{t('setup.radius')}</Text>
      <View style={styles.radiusRow}>
        <Pressable
          onPress={() => changeRadius(stepRadius(radiusM, -1))}
          disabled={radiusM <= MIN_RADIUS}
          accessibilityRole="button"
          accessibilityLabel={t('setup.smaller')}
          style={styles.stepper}>
          <Text style={styles.stepperText}>−</Text>
        </Pressable>
        <Text style={styles.radiusValue} accessibilityLiveRegion="polite">
          {formatDistance(radiusM)}
        </Text>
        <Pressable
          onPress={() => changeRadius(stepRadius(radiusM, 1))}
          disabled={radiusM >= MAX_RADIUS}
          accessibilityRole="button"
          accessibilityLabel={t('setup.bigger')}
          style={styles.stepper}>
          <Text style={styles.stepperText}>+</Text>
        </Pressable>
      </View>

      <ErrorBanner message={problem ?? (failure ? errorMessage(failure, t) : null)} />
      <Button label={t('setup.saveOffice')} onPress={submit} loading={save.isPending} />
      {existing ? (
        <Button variant="danger" label={t('setup.deleteOffice')} onPress={confirmRemove} loading={remove.isPending} />
      ) : null}
    </ScrollView>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    backgroundColor: colors.cardRaised,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
  },
  place: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  between: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepper: {
    width: 56,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    backgroundColor: colors.cardRaised,
  },
  stepperText: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.text,
  },
  radiusValue: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.text,
  },
}));
