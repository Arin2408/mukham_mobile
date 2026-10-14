import type { HierarchyPerson } from '@/api/people';

/**
 * The org chart as a tree, flattened into the rows the screen shows: the
 * same rules as the web's org chart (mukham_frontend/app/org-chart).
 */

export const fullName = (p: HierarchyPerson) => `${p.first_name} ${p.last_name}`.trim();

/** manager id → their direct reports, sorted by name. `null` = the organisation. */
export function buildChildren(people: HierarchyPerson[]): Map<number | null, HierarchyPerson[]> {
  const ids = new Set(people.map((p) => p.employee_id));
  const children = new Map<number | null, HierarchyPerson[]>([[null, []]]);
  for (const p of people) {
    // Someone whose manager isn't in the list shows under the organisation.
    const parent = p.manager_id != null && ids.has(p.manager_id) ? p.manager_id : null;
    children.set(parent, [...(children.get(parent) ?? []), p]);
  }
  for (const list of children.values()) list.sort((a, b) => fullName(a).localeCompare(fullName(b)));
  return children;
}

export type TreeStats = { total: number; topLevel: number; managers: number; levels: number };

export function treeStats(children: Map<number | null, HierarchyPerson[]>, total: number): TreeStats {
  const depth = (id: number | null, seen = new Set<number | null>()): number => {
    if (seen.has(id)) return 0; // never loop, even on bad data
    seen.add(id);
    const kids = children.get(id) ?? [];
    return kids.length ? 1 + Math.max(...kids.map((k) => depth(k.employee_id, seen))) : 0;
  };
  const managers = [...children.entries()].filter(([id, kids]) => id != null && kids.length > 0).length;
  return { total, topLevel: (children.get(null) ?? []).length, managers, levels: depth(null) };
}

export type TreeRow = {
  person: HierarchyPerson;
  depth: number;
  /** For each level above: does a line continue down past this row? (the ancestor has later siblings) */
  rails: boolean[];
  last: boolean;
  reports: number;
  open: boolean;
  match: boolean;
};

/**
 * The rows to show. With a search, only matches and the managers above them
 * show, opened up so the matches are visible.
 */
export function visibleRows(
  children: Map<number | null, HierarchyPerson[]>,
  expanded: Set<number>,
  query: string,
): TreeRow[] {
  const q = query.trim().toLowerCase();
  const matches = new Set<number>();
  const keep = new Set<number>();
  if (q) {
    const parentOf = new Map<number, number | null>();
    for (const [parent, kids] of children) for (const k of kids) parentOf.set(k.employee_id, parent);
    for (const kids of children.values()) {
      for (const p of kids) {
        const text = [fullName(p), p.designation_name, p.department_name].filter(Boolean).join(' ').toLowerCase();
        if (text.includes(q)) {
          matches.add(p.employee_id);
          // Keep every manager above a match.
          let up: number | null | undefined = p.employee_id;
          while (up != null && !keep.has(up)) {
            keep.add(up);
            up = parentOf.get(up);
          }
        }
      }
    }
  }

  const rows: TreeRow[] = [];
  const walk = (parent: number | null, depth: number, rails: boolean[], seen: Set<number>) => {
    const kids = (children.get(parent) ?? []).filter((k) => !q || keep.has(k.employee_id));
    kids.forEach((person, i) => {
      if (seen.has(person.employee_id)) return;
      const reports = (children.get(person.employee_id) ?? []).length;
      const last = i === kids.length - 1;
      const open = q ? reports > 0 : expanded.has(person.employee_id);
      rows.push({ person, depth, rails, last, reports, open, match: matches.has(person.employee_id) });
      if (open) walk(person.employee_id, depth + 1, [...rails, !last], new Set(seen).add(person.employee_id));
    });
  };
  walk(null, 0, [], new Set());
  return rows;
}

/** Everyone who has a team: what "Expand all" opens. */
export function allManagers(children: Map<number | null, HierarchyPerson[]>): Set<number> {
  return new Set([...children.entries()].filter(([id, kids]) => id != null && kids.length).map(([id]) => id as number));
}
