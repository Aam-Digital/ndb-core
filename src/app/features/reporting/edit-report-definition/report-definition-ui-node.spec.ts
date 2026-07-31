import {
  groupNodeIds,
  isGroupNode,
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

  it("collects the ids of every group (drop target), including nested ones", () => {
    const nodes = toUiNodes([
      { query: "q" },
      { groupTitle: "G", items: [{ groupTitle: "Sub", items: [] }] },
    ]);

    expect(groupNodeIds(nodes)).toEqual([
      nodes[1].uniqueId,
      nodes[1].items[0].uniqueId,
    ]);
  });
});
