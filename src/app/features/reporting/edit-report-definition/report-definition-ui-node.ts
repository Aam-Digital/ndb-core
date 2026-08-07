import { v4 as uuid } from "uuid";
import { FlatTreeAdapter } from "#src/app/utils/flat-tree/flat-tree";
import { ReportDefinitionDto } from "../report-config";

/**
 * UI-only representation of a {@link ReportDefinitionDto} node, carrying a transient
 * `uniqueId` used for drag & drop (`@for` tracking). The id is not persisted —
 * {@link toReportDefinition} strips it back to the plain DTO shape.
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

/**
 * Edit the definition as a flat, indented list: only groups can hold nested items,
 * queries are always leaves.
 */
export const reportDefinitionTree: FlatTreeAdapter<ReportDefinitionUiNode> = {
  id: (node) => node.uniqueId,
  children: (node) => node.items,
  withChildren: (node, items) => ({ ...node, items }),
};

/** A new, empty query node. */
export function newQueryNode(): ReportDefinitionUiNode {
  return { uniqueId: uuid(), query: "" };
}

/** A new, empty group node. */
export function newGroupNode(): ReportDefinitionUiNode {
  return {
    uniqueId: uuid(),
    groupTitle: $localize`:ReportConfig:New group`,
    items: [],
  };
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
