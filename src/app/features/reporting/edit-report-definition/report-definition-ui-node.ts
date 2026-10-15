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

/**
 * A persisted entry is a group when it carries `items`, or a `groupTitle` but no `query`
 * (an incomplete group, which must keep its title to be fixed in the editor).
 */
function isGroupDto(dto: ReportDefinitionDto): boolean {
  return (
    Array.isArray(dto.items) ||
    (dto.query === undefined && dto.groupTitle !== undefined)
  );
}

/**
 * Why a report-definition entry cannot be calculated, or `undefined` if it can.
 * Mirrors the rule the backend enforces: every entry needs a non-empty `query`,
 * or a non-empty `groupTitle` with non-empty `items`.
 *
 * @param entry the entry to check (its child entries are not checked)
 * @param hasItems whether the entry has child entries; in the editor's flat rows these
 *  are rows of their own rather than the entry's `items`
 */
export function getReportDefinitionEntryError(
  entry: ReportDefinitionDto,
  hasItems = (entry.items?.length ?? 0) > 0,
): string | undefined {
  if (entry.query?.trim()) {
    return undefined;
  }
  if (!isGroupDto(entry)) {
    return $localize`:ReportConfig:Enter an SQL query or remove this entry.`;
  }
  if (!entry.groupTitle?.trim()) {
    return $localize`:ReportConfig:Enter a title for this group.`;
  }
  if (!hasItems) {
    return $localize`:ReportConfig:Add a query or sub-group to this group, or remove it.`;
  }
  return undefined;
}

/** Whether any entry of the definition, at any nesting level, cannot be calculated. */
export function hasInvalidReportDefinitionEntry(
  entries: ReportDefinitionDto[],
): boolean {
  return entries.some(
    (entry) =>
      getReportDefinitionEntryError(entry) !== undefined ||
      hasInvalidReportDefinitionEntry(entry.items ?? []),
  );
}

/** Convert persisted report-definition DTOs into UI nodes with transient ids. */
export function toUiNodes(
  dtos: ReportDefinitionDto[] | undefined,
): ReportDefinitionUiNode[] {
  return (dtos ?? []).map((dto) =>
    isGroupDto(dto)
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
