import { api } from '@/api/client';
import { getIdCard, verifyUrl } from '@/api/id-card';
import { getTasks, setTaskStatus } from '@/api/tasks';
import { getAttendanceHistory } from '@/api/attendance';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
jest.mock('@/api/config', () => ({ WEB_BASE_URL: 'https://app.mukham.test' }));

const apiMock = api as jest.Mock;

beforeEach(() => apiMock.mockReset().mockResolvedValue([]));

describe('Phase 4 server calls', () => {
  it('asks for history between two dates', async () => {
    await getAttendanceHistory('2026-10-01', '2026-10-13');
    expect(apiMock).toHaveBeenCalledWith('/attendance/history?from=2026-10-01&to=2026-10-13&limit=1000');
  });

  it('filters tasks by status, and changes a status with PATCH', async () => {
    await getTasks('in_progress');
    expect(apiMock).toHaveBeenCalledWith('/tasks?status=in_progress');
    await setTaskStatus(7, 'completed');
    expect(apiMock).toHaveBeenCalledWith('/tasks/7/status', { method: 'PATCH', body: { status: 'completed' } });
  });

  it('reads the ID card signed in, and links the QR code to /verify with the private card code', async () => {
    await getIdCard(42);
    expect(apiMock).toHaveBeenCalledWith('/employees/42/card');
    expect(verifyUrl('42-AbC_d1')).toBe('https://app.mukham.test/verify/42-AbC_d1');
  });
});
