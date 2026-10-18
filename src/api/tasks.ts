import { api } from './client';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export type Task = {
  task_id: number;
  employee_id: number;
  employee_name: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high';
  status: TaskStatus;
  assigned_date: string; // "2026-10-13"
  due_date: string | null;
  completed_date: string | null;
  /** Open and past its due date. */
  is_overdue: boolean;
  /** Completed after its due date. */
  completed_late: boolean;
  /** Who assigned it: the admin, or the employee's manager. */
  created_by_id?: number | null;
  assigned_by_name?: string | null;
  assigned_by_manager?: boolean;
  updated_at: string;
};

/** The signed-in employee's tasks; the server only returns their own. */
export function getTasks(status?: TaskStatus) {
  return api<Task[]>(status ? `/tasks?status=${status}` : '/tasks');
}

/** Someone who reports to the signed-in manager. */
export type TeamMember = {
  employee_id: number;
  first_name: string;
  last_name: string;
  designation_name: string | null;
};

/** The signed-in manager's direct reports (empty for everyone else). */
export function getTeam() {
  return api<TeamMember[]>('/team');
}

/** A manager's direct reports' tasks. */
export function getTeamTasks(status?: TaskStatus) {
  return api<Task[]>(status ? `/tasks?scope=team&status=${status}` : '/tasks?scope=team');
}

export function getTask(id: number) {
  return api<Task>(`/tasks/${id}`);
}

export function setTaskStatus(id: number, status: TaskStatus) {
  return api<Task>(`/tasks/${id}/status`, { method: 'PATCH', body: { status } });
}

export type TaskPriority = Task['priority'];

/** What the assign and edit form sends (admin, or a manager for their team). */
export type TaskInput = {
  employee_id: number;
  title: string;
  description: string | null;
  priority: TaskPriority;
  assigned_date: string;
  due_date: string | null;
};

/** The organisation's tasks whose assigned-to-completed span overlaps the dates. */
export function getOrgTasks(from: string, to: string) {
  return api<Task[]>(`/tasks?${new URLSearchParams({ from, to })}`);
}

export function createTask(input: TaskInput) {
  return api<Task>('/tasks', { method: 'POST', body: input });
}

export function updateTask(id: number, input: TaskInput) {
  return api<Task>(`/tasks/${id}`, { method: 'PUT', body: input });
}

export function deleteTask(id: number) {
  return api<unknown>(`/tasks/${id}`, { method: 'DELETE' });
}
