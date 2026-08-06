import { flattenTree, rebuildTree } from "#src/app/utils/flat-tree/flat-tree";
import {
  isGroupNode,
  newGroupNode,
  newQueryNode,
  reportDefinitionTree,
  toReportDefinition,
  toUiNodes,
} from "./report-definition-ui-node";

describe("report-definition-ui-node", () => {
  it("round-trips a nested definition through ui nodes and back", () => {
    const definition = [
      { query: "SELECT a FROM t" },
      {
        groupTitle: "G",
        items: [
          { query: "SELECT count(*) FROM t" },
          { groupTitle: "Sub", items: [{ query: "SELECT b FROM t" }] },
        ],
      },
    ];

    expect(toReportDefinition(toUiNodes(definition))).toEqual(definition);
  });

  it("assigns a unique id to every node and marks groups", () => {
    const nodes = toUiNodes([
      { query: "q" },
      { groupTitle: "G", items: [{ query: "q2" }] },
    ]);

    expect(nodes[0].uniqueId).toBeTruthy();
    expect(isGroupNode(nodes[0])).toBe(false);
    expect(isGroupNode(nodes[1])).toBe(true);
    expect(nodes[1].items[0].uniqueId).not.toBe(nodes[0].uniqueId);
  });

  it("creates new query and group nodes with distinct ids", () => {
    expect(isGroupNode(newQueryNode())).toBe(false);
    expect(isGroupNode(newGroupNode())).toBe(true);
    expect(newQueryNode().uniqueId).not.toBe(newQueryNode().uniqueId);
  });

  it("round-trips a nested definition through flat rows and back", () => {
    const nodes = toUiNodes([
      { query: "a" },
      {
        groupTitle: "G",
        items: [{ query: "b" }, { groupTitle: "Sub", items: [{ query: "c" }] }],
      },
    ]);

    const rows = flattenTree(nodes, reportDefinitionTree);
    expect(rows.map((r) => [isGroupNode(r.data), r.level])).toEqual([
      [false, 0], // a
      [true, 0], // G
      [false, 1], // b
      [true, 1], // Sub
      [false, 2], // c
    ]);
    expect(toReportDefinition(rebuildTree(rows, reportDefinitionTree))).toEqual(
      toReportDefinition(nodes),
    );
  });
});
