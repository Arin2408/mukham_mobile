import { getOrgHistory, markManually } from '@/api/admin';
import { api } from '@/api/client';

jest.mock('@/api/client', () => ({ api: jest.fn() }));

const apiMock = api as jest.Mock;

beforeEach(() => apiMock.mockReset().mockResolvedValue([]));

describe('admin server calls', () => {
  it("asks for everyone's history, or one employee's", async () => {
    await getOrgHistory('2026-10-12', '2026-10-13');
    expect(apiMock).toHaveBeenLastCalledWith('/attendance/history?from=2026-10-12&to=2026-10-13&limit=1000');
    await getOrgHistory('2026-09-14', '2026-10-13', 5);
    expect(apiMock).toHaveBeenLastCalledWith(
      '/attendance/history?from=2026-09-14&to=2026-10-13&limit=1000&employee_id=5',
    );
  });

  it('marks attendance by hand with only the employee and the action', async () => {
    await markManually(5, 'checkout');
    expect(apiMock).toHaveBeenCalledWith('/attendance/manual', {
      method: 'POST',
      body: { employee_id: 5, action: 'checkout' },
    });
  });
});
