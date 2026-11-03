import { Entity } from "#src/app/core/entity/model/entity";
import {
  SortValueFns,
  tableSort,
} from "#src/app/core/common-components/entities-table/table-sort/table-sort";
import { SortDirection } from "@angular/material/sort";

/**
 * Pure helpers to show records of one type as a tree, by a "parent" field linking to another record of the same type.
 */

/** One visible row of a hierarchy: a record with its position in the tree. */
export interface HierarchyRow<T extends Entity = Entity> {
  record: T;
  /** depth in the tree, 0 for the top level */
  level: number;
  /** number of direct sub-records shown below this record (when expanded) */
  childCount: number;
  /** the record does not match the filters and is only shown as the parent of a match */
  isContext: boolean;
  /** the record has sub-records that are currently hidden */
  isCollapsed: boolean;
}

export interface HierarchyOptions<T extends Entity> {
  /** field of the records that holds the id of their parent record */
  parentField: string;
  /** show only the records below this record (the root itself is not shown) */
  rootId?: string;
  /** sort order, applied to each level separately */
  sort?: {
    active: string;
    direction: SortDirection;
    sortValueFns?: SortValueFns<T>;
  };
  /** ids of the records whose sub-records are hidden */
  collapsedIds?: ReadonlySet<string>;
}

/** The rows of a hierarchy, in display order. */
export interface HierarchyView<T extends Entity = Entity> {
  rows: HierarchyRow<T>[];
  /** ids of the records that are part of the tree but hidden under a collapsed row */
  hiddenIds: ReadonlySet<string>;
  /** ids of the records that have sub-records in the tree (shown or hidden) */
  expandableIds: ReadonlySet<string>;
}

/** Parent id of each record in the tree; records at the top level have none. */
export type ParentIds = ReadonlyMap<string, string | undefined>;

/**
 * Resolve the parent of every record.
 *
 * A record is at the top level (without parent) if its parent is missing (deleted, not loaded or not permitted),
 * if it is its own parent or if it is part of a loop of parents, so that no record is ever hidden.
 * Records only leading into a loop keep their parent.
 *
 * @param rootId a record that is the top of the tree even if it has a parent itself
 */
export function resolveParentIds<T extends Entity>(
  records: readonly T[],
  parentField: string,
  rootId?: string,
): ParentIds {
  const ids = new Set(records.map((record) => record.getId()));
  const parents = new Map<string, string | undefined>();
  for (const record of records) {
    const id = record.getId();
    const parentId = record[parentField];
    const isValidParent =
      id !== rootId &&
      typeof parentId === "string" &&
      parentId !== id &&
      ids.has(parentId);
    parents.set(id, isValidParent ? parentId : undefined);
  }

  // walk up from every record; a walk that returns to a record of its own path found a loop
  const done = new Set<string>();
  for (const start of parents.keys()) {
    const path: string[] = [];
    let current: string | undefined = start;
    while (current !== undefined && !done.has(current)) {
      const loopStart = path.indexOf(current);
      if (loopStart !== -1) {
        path.slice(loopStart).forEach((id) => parents.set(id, undefined));
        break;
      }
      path.push(current);
      current = parents.get(current);
    }
    path.forEach((id) => done.add(id));
  }
  return parents;
}

/** Ids of all records below the given record, over all levels. */
export function descendantIds(
  parents: ParentIds,
  rootId: string,
): ReadonlySet<string> {
  const children = childIdsByParent(parents);
  const descendants = new Set<string>();
  const queue = [...(children.get(rootId) ?? [])];
  for (let i = 0; i < queue.length; i++) {
    descendants.add(queue[i]);
    queue.push(...(children.get(queue[i]) ?? []));
  }
  return descendants;
}

function childIdsByParent(parents: ParentIds): Map<string, string[]> {
  const children = new Map<string, string[]>();
  for (const [id, parentId] of parents) {
    if (parentId !== undefined) {
      getOrCreate(children, parentId).push(id);
    }
  }
  return children;
}

function getOrCreate<K, V>(map: Map<K, V[]>, key: K): V[] {
  let values = map.get(key);
  if (!values) {
    values = [];
    map.set(key, values);
  }
  return values;
}

/**
 * Arrange records as a tree, in the order to display them.
 *
 * Every matching record is shown below its parents. Parents that do not match themselves
 * (e.g. filtered out or archived) are shown as context rows (`isContext`).
 * Each level is sorted on its own; sub-records of collapsed records are left out.
 *
 * @param allRecords all records of the type, including those not matching (to find the parents)
 * @param matches the records passing the filters
 */
export function buildHierarchyView<T extends Entity>(
  allRecords: readonly T[],
  matches: readonly T[],
  options: HierarchyOptions<T>,
): HierarchyView<T> {
  const { parentField, rootId, sort, collapsedIds = new Set() } = options;
  const parents = resolveParentIds(allRecords, parentField, rootId);
  const byId = new Map(allRecords.map((record) => [record.getId(), record]));

  const matchIds = new Set<string>();
  const visible = new Map<string, T>();
  for (const match of matches) {
    const id = match.getId();
    matchIds.add(id);
    visible.set(id, match);
    // add the parents as context, up to the top (or the root)
    let parentId = parents.get(id);
    while (parentId !== undefined && parentId !== rootId) {
      if (!visible.has(parentId)) {
        visible.set(parentId, byId.get(parentId)!);
      }
      parentId = parents.get(parentId);
    }
  }

  const children = new Map<string | undefined, T[]>();
  for (const [id, record] of visible) {
    getOrCreate(children, parents.get(id)).push(record);
  }
  for (const siblings of children.values()) {
    sortLevel(siblings, sort);
  }

  const rows: HierarchyRow<T>[] = [];
  const hiddenIds = new Set<string>();
  const expandableIds = new Set<string>();
  const addRows = (records: T[], level: number, hidden: boolean) => {
    for (const record of records) {
      const id = record.getId();
      const subRecords = children.get(id) ?? [];
      if (subRecords.length > 0) {
        expandableIds.add(id);
      }
      const isCollapsed = subRecords.length > 0 && collapsedIds.has(id);
      if (hidden) {
        hiddenIds.add(id);
      } else {
        rows.push({
          record,
          level,
          childCount: subRecords.length,
          isContext: !matchIds.has(id),
          isCollapsed,
        });
      }
      addRows(subRecords, level + 1, hidden || isCollapsed);
    }
  };
  addRows(children.get(rootId) ?? [], 0, false);

  return { rows, hiddenIds, expandableIds };
}

/** Sort the records of one level in place, with the same rules as a flat table. */
function sortLevel<T extends Entity>(
  records: T[],
  sort: HierarchyOptions<T>["sort"],
) {
  if (!sort) {
    return;
  }
  tableSort<T, keyof T>(records, {
    active: sort.active as keyof T,
    direction: sort.direction,
    sortValueFns: sort.sortValueFns,
  });
}
