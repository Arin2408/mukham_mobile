import * as Application from 'expo-application';
import { Platform } from 'react-native';

/**
 * This phone's ID for this app (Android ID or iOS vendor ID). Sent with a
 * check-in so the admin can spot one phone checking in several people.
 * Not a permanent hardware ID: it can change after a factory reset.
 */
export async function getDeviceId(): Promise<string | null> {
  try {
    if (Platform.OS === 'android') {
      return Application.getAndroidId();
    }
    if (Platform.OS === 'ios') {
      return await Application.getIosIdForVendorAsync();
    }
  } catch {
    // An ID is helpful, never required.
  }
  return null;
}
