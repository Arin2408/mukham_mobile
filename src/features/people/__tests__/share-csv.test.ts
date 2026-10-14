import { shareEmployeesCsv } from '@/features/people/share-csv';

const mockNative = jest.fn();
jest.mock('expo', () => ({ requireOptionalNativeModule: (name: string) => mockNative(name) }));

const mockWrite = jest.fn();
jest.mock('expo-file-system', () => ({
  Paths: { cache: 'cache' },
  File: jest.fn().mockImplementation((_dir: string, name: string) => ({
    exists: false,
    uri: `file:///cache/${name}`,
    create: jest.fn(),
    delete: jest.fn(),
    write: (text: string) => mockWrite(text),
  })),
}));

const mockShare = jest.fn();
jest.mock('expo-sharing', () => ({
  isAvailableAsync: async () => true,
  shareAsync: (...args: unknown[]) => mockShare(...args),
}));

beforeEach(() => jest.clearAllMocks());

describe('sharing the employee CSV', () => {
  it('writes the file and opens the share menu', async () => {
    mockNative.mockReturnValue({});
    await expect(shareEmployeesCsv([], 'Share')).resolves.toBe(true);
    expect(mockWrite).toHaveBeenCalledWith(expect.stringContaining('Employee ID,First name'));
    expect(mockShare).toHaveBeenCalledWith(expect.stringMatching(/^file:\/\/\/cache\/employees-\d{4}-\d\d-\d\d\.csv$/), {
      mimeType: 'text/csv',
      UTI: 'public.comma-separated-values-text',
      dialogTitle: 'Share',
    });
  });

  it('says no, without crashing, on an app build without the sharing module', async () => {
    mockNative.mockReturnValue(null);
    await expect(shareEmployeesCsv([], 'Share')).resolves.toBe(false);
    expect(mockShare).not.toHaveBeenCalled();
  });
});
