import { v4 as uuid } from "uuid";
import { ReportDefinitionDto } from "../report-config";

/**
 * UI-only representation of a {@link ReportDefinitionDto} node, carrying a transient
 * `uniqueId` used for drag & drop (CdkDropList ids / `@for` tracking). The id is not
 * persisted — {@link toReportDefinition} strips it back to the plain DTO shape.
 */
export interface ReportDefinitionUiNode {
  uniqueId: string;
  /** SQL query (query node) */
  query?: string;
  /** group heading (group node) */
  groupTitle?: string;
  /** nested items (group node) */
  items?: ReportDefinitionUiNode[];
}

/** A node is a group when it carries an `items` array; otherwise it is a query. */
export function isGroupNode(node: ReportDefinitionUiNode): boolean {
  return Array.isArray(node.items);
}

/** Convert persisted report-definition DTOs into UI nodes with transient ids. */
export function toUiNodes(
  dtos: ReportDefinitionDto[] | undefined,
): ReportDefinitionUiNode[] {
  return (dtos ?? []).map((dto) =>
    Array.isArray(dto.items)
      ? {
          uniqueId: uuid(),
          groupTitle: dto.groupTitle ?? "",
          items: toUiNodes(dto.items),
        }
      : { uniqueId: uuid(), query: dto.query ?? "" },
  );
}

/** Convert UI nodes back to plain report-definition DTOs (dropping the transient ids). */
export function toReportDefinition(
  nodes: ReportDefinitionUiNode[],
): ReportDefinitionDto[] {
  return nodes.map((node) =>
    isGroupNode(node)
      ? { groupTitle: node.groupTitle, items: toReportDefinition(node.items) }
      : { query: node.query ?? "" },
  );
}

/** Collect the ids of every group node (the connectable drop targets) in the tree. */
export function groupNodeIds(nodes: ReportDefinitionUiNode[]): string[] {
  let ids: string[] = [];
  for (const node of nodes) {
    if (isGroupNode(node)) {
      ids.push(node.uniqueId);
      ids = ids.concat(groupNodeIds(node.items));
    }
  }
  return ids;
}

/**
 * A single visible row of the flattened editor: the tree rendered as one linear list where
 * nesting is expressed by {@link level} (indentation). Editing / drag & drop happen on this flat
 * list (a single CdkDropList), which sidesteps the CDK nested-drop-list limitations, and the
 * nested {@link ReportDefinitionUiNode} tree is reconstructed from it via {@link rebuildTree}.
 */
export interface FlatReportRow {
  uniqueId: string;
  query?: string;
  groupTitle?: string;
  isGroup: boolean;
  /** nesting depth; a row is a child of the nearest preceding group with a smaller level */
  level: number;
}

/** Flatten the nested tree into rows (pre-order DFS), carrying the depth as `level`. */
export function flattenTree(
  nodes: ReportDefinitionUiNode[],
  level = 0,
): FlatReportRow[] {
  const rows: FlatReportRow[] = [];
  for (const node of nodes) {
    if (isGroupNode(node)) {
      rows.push({
        uniqueId: node.uniqueId,
        groupTitle: node.groupTitle ?? "",
        isGroup: true,
        level,
      });
      rows.push(...flattenTree(node.items, level + 1));
    } else {
      rows.push({
        uniqueId: node.uniqueId,
        query: node.query ?? "",
        isGroup: false,
        level,
      });
    }
  }
  return rows;
}

/** Reconstruct the nested tree from flat rows: each group owns the following rows of greater level. */
export function rebuildTree(rows: FlatReportRow[]): ReportDefinitionUiNode[] {
  const root: ReportDefinitionUiNode[] = [];
  // stack of the currently-open groups' item arrays, keyed by their level
  const stack: { level: number; items: ReportDefinitionUiNode[] }[] = [
    { level: -1, items: root },
  ];
  for (const row of rows) {
    while (stack.length > 1 && stack[stack.length - 1].level >= row.level) {
      stack.pop();
    }
    const parent = stack[stack.length - 1].items;
    if (row.isGroup) {
      const node: ReportDefinitionUiNode = {
        uniqueId: row.uniqueId,
        groupTitle: row.groupTitle ?? "",
        items: [],
      };
      parent.push(node);
      stack.push({ level: row.level, items: node.items });
    } else {
      parent.push({ uniqueId: row.uniqueId, query: row.query ?? "" });
    }
  }
  return root;
}

/**
 * Clamp levels so the flat list is always a valid tree: the first row is at level 0, and every
 * other row is at most one level deeper than the row above it — and only deeper when that row is
 * a group (a query cannot have children).
 */
export function normalizeLevels(rows: FlatReportRow[]): FlatReportRow[] {
  const out: FlatReportRow[] = [];
  for (let i = 0; i < rows.length; i++) {
    if (i === 0) {
      out.push({ ...rows[i], level: 0 });
      continue;
    }
    const prev = out[i - 1];
    const max = prev.isGroup ? prev.level + 1 : prev.level;
    out.push({ ...rows[i], level: Math.max(0, Math.min(rows[i].level, max)) });
  }
  return out;
}

/** Number of rows making up the subtree rooted at `index` (the row itself plus its descendants). */
export function subtreeLength(rows: FlatReportRow[], index: number): number {
  const base = rows[index].level;
  let end = index + 1;
  while (end < rows.length && rows[end].level > base) {
    end++;
  }
  return end - index;
}
