import {
  FlatReportRow,
  flattenTree,
  groupNodeIds,
  isGroupNode,
  normalizeLevels,
  rebuildTree,
  subtreeLength,
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

  it("round-trips a nested definition through flat rows and back", () => {
    const nodes = toUiNodes([
      { query: "a" },
      {
        groupTitle: "G",
        items: [{ query: "b" }, { groupTitle: "Sub", items: [{ query: "c" }] }],
      },
    ]);

    const flat = flattenTree(nodes);
    expect(flat.map((r) => [r.isGroup, r.level])).toEqual([
      [false, 0], // a
      [true, 0], // G
      [false, 1], // b
      [true, 1], // Sub
      [false, 2], // c
    ]);
    expect(toReportDefinition(rebuildTree(flat))).toEqual(
      toReportDefinition(nodes),
    );
  });

  it("clamps levels so a row is at most one deeper than the group above it", () => {
    const rows: FlatReportRow[] = [
      { uniqueId: "q1", query: "", isGroup: false, level: 2 }, // first row -> forced to 0
      { uniqueId: "g", groupTitle: "", isGroup: true, level: 3 }, // -> 0
      { uniqueId: "q2", query: "", isGroup: false, level: 9 }, // under group -> 1
      { uniqueId: "q3", query: "", isGroup: false, level: 5 }, // under a query -> capped at 1
    ];

    expect(normalizeLevels(rows).map((r) => r.level)).toEqual([0, 0, 1, 1]);
  });

  it("measures the subtree length of a group (itself plus its descendants)", () => {
    const flat = flattenTree(
      toUiNodes([
        {
          groupTitle: "G",
          items: [{ query: "b" }, { groupTitle: "Sub", items: [{ query: "c" }] }],
        },
        { query: "after" },
      ]),
    );

    expect(subtreeLength(flat, 0)).toBe(4); // G, b, Sub, c
    expect(subtreeLength(flat, 4)).toBe(1); // "after"
  });
});
