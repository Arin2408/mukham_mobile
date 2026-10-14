import { monthWeeks } from '@/components/month-grid';
import { tasksOn } from '@/features/people/tasks-view';
import { validateEmployee, validateTask } from '@/features/people/validate';
import type { Task } from '@/api/tasks';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const base = {
  first_name: 'Ravi',
  last_name: '',
  mobile_number: '9876543210',
  email: 'ravi@example.com',
  department: null,
  designation: null,
  shift: null,
  office_location: null,
  manager: null,
};

describe('form checks', () => {
  it('needs a first name, a 10-digit mobile and an email', () => {
    expect(validateEmployee(base)).toBeNull();
    expect(validateEmployee({ ...base, first_name: ' ' })).toBe('name');
    expect(validateEmployee({ ...base, mobile_number: '98765' })).toBe('mobile');
    expect(validateEmployee({ ...base, email: 'ravi@' })).toBe('email');
  });

  it("needs an employee and a title, and a due date that isn't before the start", () => {
    const task = { employee_id: 1, title: 'Count stock', description: null, priority: 'low' as const, assigned_date: '2026-10-13', due_date: null };
    expect(validateTask(task)).toBeNull();
    expect(validateTask({ ...task, employee_id: null })).toBe('employee');
    expect(validateTask({ ...task, title: '' })).toBe('title');
    expect(validateTask({ ...task, due_date: '2026-10-12' })).toBe('due');
    expect(validateTask({ ...task, due_date: '2026-10-13' })).toBeNull();
  });
});

describe('the task calendar', () => {
  it('covers whole weeks, Monday first', () => {
    const weeks = monthWeeks(new Date(2026, 9, 1)); // October 2026 starts on a Thursday
    expect(weeks).toHaveLength(5);
    expect(weeks[0][0].param).toBe('2026-09-28');
    expect(weeks[0][3]).toMatchObject({ param: '2026-10-01', inMonth: true });
    expect(weeks.at(-1)!.at(-1)!.param).toBe('2026-11-01');
  });

  it('lists tasks running on a day: assigned by then, not completed before it', () => {
    const t = (id: number, assigned: string, completed: string | null) =>
      ({ task_id: id, assigned_date: assigned, completed_date: completed }) as Task;
    const tasks = [t(1, '2026-10-10', null), t(2, '2026-10-14', null), t(3, '2026-10-01', '2026-10-12'), t(4, '2026-10-01', '2026-10-13')];
    expect(tasksOn(tasks, '2026-10-13').map((x) => x.task_id)).toEqual([1, 4]);
  });
});
