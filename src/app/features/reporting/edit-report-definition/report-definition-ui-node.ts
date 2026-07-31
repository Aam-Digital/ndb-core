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
