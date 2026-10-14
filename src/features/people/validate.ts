import type { EmployeeInput } from '@/api/people';
import type { TaskInput } from '@/api/tasks';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Checks the employee form; returns what's wrong, or null. */
export function validateEmployee(input: EmployeeInput): 'name' | 'mobile' | 'email' | null {
  if (!input.first_name.trim()) return 'name';
  if (!/^\d{10}$/.test(input.mobile_number)) return 'mobile';
  if (!EMAIL.test(input.email.trim())) return 'email';
  return null;
}

/** Checks the task form; returns what's wrong, or null. */
export function validateTask(input: Omit<TaskInput, 'employee_id'> & { employee_id: number | null }):
  | 'employee'
  | 'title'
  | 'due'
  | null {
  if (input.employee_id == null) return 'employee';
  if (!input.title.trim()) return 'title';
  if (input.due_date && input.due_date < input.assigned_date) return 'due';
  return null;
}
