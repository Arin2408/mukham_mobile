import { requireOptionalNativeModule } from 'expo';
import { File, Paths } from 'expo-file-system';

import { employeesCsv, type Employee } from '@/api/people';
import { toDateParam } from '@/lib/format';

/**
 * Saves the employee list as a CSV file in the app's cache and opens the
 * phone's share menu (WhatsApp, email, Drive…). Returns false when this
 * phone can't share files, or when the installed app build predates
 * sharing (expo-sharing is loaded only then, so an older build still
 * opens the People tab).
 */
export async function shareEmployeesCsv(employees: Employee[], dialogTitle: string): Promise<boolean> {
  if (!requireOptionalNativeModule('ExpoSharing')) {
    return false;
  }
  // Loaded only now: importing it at the top fails on builds without the module.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Sharing: typeof import('expo-sharing') = require('expo-sharing');
  if (!(await Sharing.isAvailableAsync())) {
    return false;
  }
  const file = new File(Paths.cache, `employees-${toDateParam(new Date())}.csv`);
  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(employeesCsv(employees));
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
    dialogTitle,
  });
  return true;
}
