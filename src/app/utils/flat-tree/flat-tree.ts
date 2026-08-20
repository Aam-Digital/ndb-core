/**
 * Helpers to edit a tree of nodes as a single flat, indented list.
 *
 * Editing a nested structure with `@angular/cdk/drag-drop` through nested `cdkDropList`s is
 * unreliable: items cannot be moved into or out of arbitrary nesting levels, and a parent can be
 * dropped into its own child. Instead, the tree is flattened into one list of {@link FlatTreeRow}s
 * where nesting is only expressed by {@link FlatTreeRow.level} (rendered as indentation) and shown
 * as a single `cdkDropList`. Dragging then is plain reordering, the nesting level is chosen by how
 * far a row is dragged horizontally, and the nested tree is reconstructed via {@link rebuildTree}.
 *
 * The helpers are generic over the node type; a {@link FlatTreeAdapter} maps them onto a concrete
 * structure (e.g. `MenuItem.subMenu` or a report definition's `items`).
 */

/** A single row of the flattened tree: one node, with its depth in the tree. */
export interface FlatTreeRow<T> {
  /** unique, stable id of the node (used for drag & drop tracking) */
  id: string;
  /** nesting depth; a row is a child of the nearest preceding row with a smaller level */
  level: number;
  /** the node itself, without its children (they are rows of their own) */
  data: T;
}

/** Maps the generic flat-tree helpers onto a concrete node type. */
export interface FlatTreeAdapter<T> {
  /** unique, stable id of a node */
  id: (node: T) => string;
  /**
   * The child nodes of a node, or `undefined` if the node cannot have children at all.
   * Nodes returning an (empty) array can be nested into, others are always leaves.
   */
  children: (node: T) => T[] | undefined;
  /** a copy of the node with the given child nodes */
  withChildren: (node: T, children: T[]) => T;
}

/** Options restricting how deep rows may be nested. */
export interface FlatTreeOptions {
  /** maximum allowed nesting level; 0 disables nesting entirely (default: unlimited) */
  maxLevel?: number;
}

/** Flatten a nested tree into rows (pre-order), carrying the depth as `level`. */
export function flattenTree<T>(
  nodes: T[] | undefined,
  adapter: FlatTreeAdapter<T>,
  level = 0,
): FlatTreeRow<T>[] {
  const rows: FlatTreeRow<T>[] = [];
  for (const node of nodes ?? []) {
    const children = adapter.children(node);
    rows.push({
      id: adapter.id(node),
      level,
      // children become rows of their own, so they are cleared on the row's own node
      data: children ? adapter.withChildren(node, []) : node,
    });
    rows.push(...flattenTree(children, adapter, level + 1));
  }
  return rows;
}

/** Reconstruct the nested tree from flat rows: each row owns the following rows of greater level. */
export function rebuildTree<T>(
  rows: FlatTreeRow<T>[],
  adapter: FlatTreeAdapter<T>,
): T[] {
  const nodes: T[] = [];
  let i = 0;
  while (i < rows.length) {
    const row = rows[i];
    const length = subtreeLength(rows, i);
    nodes.push(
      adapter.children(row.data) === undefined
        ? row.data
        : adapter.withChildren(
            row.data,
            rebuildTree(rows.slice(i + 1, i + length), adapter),
          ),
    );
    i += length;
  }
  return nodes;
}

/**
 * Clamp levels so the flat list always describes a valid tree: the first row is at level 0, every
 * other row is at most one level deeper than the row above it — and only deeper if that row can
 * have children at all — and no row is deeper than `maxLevel`.
 */
export function normalizeLevels<T>(
  rows: FlatTreeRow<T>[],
  adapter: FlatTreeAdapter<T>,
  options?: FlatTreeOptions,
): FlatTreeRow<T>[] {
  const normalized: FlatTreeRow<T>[] = [];
  for (const row of rows) {
    const max = maxLevelBelow(
      normalized[normalized.length - 1],
      adapter,
      options,
    );
    normalized.push({ ...row, level: Math.max(0, Math.min(row.level, max)) });
  }
  return normalized;
}

/** The deepest level a row directly below `above` may have (0 if there is no row above). */
function maxLevelBelow<T>(
  above: FlatTreeRow<T> | undefined,
  adapter: FlatTreeAdapter<T>,
  options?: FlatTreeOptions,
): number {
  if (!above) {
    return 0;
  }
  const level = adapter.children(above.data) ? above.level + 1 : above.level;
  return Math.min(level, options?.maxLevel ?? Number.MAX_SAFE_INTEGER);
}

/** Number of rows forming the subtree rooted at `index` (the row itself plus its descendants). */
export function subtreeLength<T>(
  rows: FlatTreeRow<T>[],
  index: number,
): number {
  const base = rows[index].level;
  let end = index + 1;
  while (end < rows.length && rows[end].level > base) {
    end++;
  }
  return end - index;
}

/**
 * Move the subtree rooted at `previousIndex` to `currentIndex` (as reported by a `cdkDropList`,
 * which only moves the dragged row itself — its descendants follow it here) and re-nest it by
 * `levelDelta` levels, within what the rows it comes to rest between allow.
 */
export function moveSubtree<T>(
  rows: FlatTreeRow<T>[],
  previousIndex: number,
  currentIndex: number,
  adapter: FlatTreeAdapter<T>,
  options?: FlatTreeOptions & {
    /** how many levels to nest the row in or out, e.g. from the horizontal drag distance */
    levelDelta?: number;
  },
): FlatTreeRow<T>[] {
  const length = subtreeLength(rows, previousIndex);
  const dragged = rows[previousIndex];

  // move the subtree as a whole; `currentIndex` counts the dragged row only, so dropping it
  // further down has to account for the descendants taken out of the list along with it
  const moved = [...rows];
  const subtree = moved.splice(previousIndex, length);
  const insertAt =
    currentIndex <= previousIndex
      ? currentIndex
      : Math.max(previousIndex, currentIndex - length + 1);
  moved.splice(insertAt, 0, ...subtree);

  // Nest by the dragged distance, but only as deep as the row above allows and not shallower
  // than the row below: a shallower row would adopt the rows following it as its own children.
  const maxLevel = maxLevelBelow(moved[insertAt - 1], adapter, options);
  const minLevel = Math.min(moved[insertAt + length]?.level ?? 0, maxLevel);
  const targetLevel = Math.max(
    minLevel,
    Math.min(dragged.level + (options?.levelDelta ?? 0), maxLevel),
  );
  const delta = targetLevel - dragged.level;
  for (let i = insertAt; i < insertAt + length; i++) {
    moved[i] = { ...moved[i], level: moved[i].level + delta };
  }

  return normalizeLevels(moved, adapter, options);
}

/** Remove the row at `index` together with its whole subtree. */
export function removeSubtree<T>(
  rows: FlatTreeRow<T>[],
  index: number,
  adapter: FlatTreeAdapter<T>,
  options?: FlatTreeOptions,
): FlatTreeRow<T>[] {
  const remaining = [...rows];
  remaining.splice(index, subtreeLength(rows, index));
  return normalizeLevels(remaining, adapter, options);
}

/** Insert `node` as the first child of the row at `parentIndex`. */
export function insertChild<T>(
  rows: FlatTreeRow<T>[],
  parentIndex: number,
  node: T,
  adapter: FlatTreeAdapter<T>,
  options?: FlatTreeOptions,
): FlatTreeRow<T>[] {
  const extended = [...rows];
  extended.splice(parentIndex + 1, 0, {
    id: adapter.id(node),
    level: rows[parentIndex].level + 1,
    data: node,
  });
  return normalizeLevels(extended, adapter, options);
}

/** Replace the node of the row at `index`, keeping its position and nesting. */
export function updateRow<T>(
  rows: FlatTreeRow<T>[],
  index: number,
  node: T,
): FlatTreeRow<T>[] {
  return rows.map((row, i) => (i === index ? { ...row, data: node } : row));
}
