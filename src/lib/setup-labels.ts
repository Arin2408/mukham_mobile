/**
 * Names that tell apart things that look the same: two offices can each have
 * a "Sales" department, a "Manager" designation or a "Night 20:00 - 04:00"
 * shift. Each label adds where the thing belongs: department → office.
 */

type Office = { location_id: number; location_name: string };
type Department = { department_id: number; details: string; location_id: number };
type Designation = { designation_id: number; department_id: number; details: string };
type Shift = { shift_id: number; shift_name: string; shift_start_time: string; shift_end_time: string; department_id: number };

const join = (...parts: (string | undefined | null)[]) => parts.filter(Boolean).join(' · ');

/** "Sales · HQ" */
export function departmentLabel(d: Department, offices: Office[]): string {
  return join(d.details, offices.find((o) => o.location_id === d.location_id)?.location_name);
}

/** "Manager · Sales · HQ" */
export function designationLabel(x: Designation, departments: Department[], offices: Office[]): string {
  const d = departments.find((dep) => dep.department_id === x.department_id);
  return join(x.details, d ? departmentLabel(d, offices) : null);
}

/** "Night 20:00 - 04:00" */
export function shiftTimes(s: Shift): string {
  return `${s.shift_name} ${s.shift_start_time.slice(0, 5)} - ${s.shift_end_time.slice(0, 5)}`;
}

/** "Night 20:00 - 04:00 · Stores · HQ" */
export function shiftLabel(s: Shift, departments: Department[], offices: Office[]): string {
  const d = departments.find((dep) => dep.department_id === s.department_id);
  return join(shiftTimes(s), d ? departmentLabel(d, offices) : null);
}
