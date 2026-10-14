import type { PermissionResponse } from 'expo-camera';
import { useTranslation } from 'react-i18next';
import { Linking, Text } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { makeStyles } from '@/theme';


type Props = {
  permission: PermissionResponse | null;
  requestPermission: () => void;
  onCancel: () => void;
  cancelLabel: string;
};

/** Explains why the camera is needed, then asks (or links to Settings). */
export function CameraPermissionRequest({ permission, requestPermission, onCancel, cancelLabel }: Props) {
  const styles = useStyles();
  const { t } = useTranslation();
  const blocked = permission && !permission.canAskAgain;

  return (
    <Screen title={t('face.permissionTitle')}>
      <Text style={styles.body}>{t('face.permissionBody')}</Text>
      <Button
        label={blocked ? t('face.openSettings') : t('face.allowCamera')}
        onPress={() => (blocked ? Linking.openSettings() : requestPermission())}
      />
      <Button variant="link" label={cancelLabel} onPress={onCancel} />
    </Screen>
  );
}

const useStyles = makeStyles(({ text }) => ({
  body: {
    ...text.body,
    lineHeight: 22,
  },
}));
