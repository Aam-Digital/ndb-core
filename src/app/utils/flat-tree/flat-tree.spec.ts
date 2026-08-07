import {
  FlatTreeAdapter,
  FlatTreeRow,
  flattenTree,
  insertChild,
  moveSubtree,
  normalizeLevels,
  rebuildTree,
  removeSubtree,
  subtreeLength,
  updateRow,
} from "./flat-tree";

interface TestNode {
  id: string;
  /** absent for nodes that cannot have children at all */
  children?: TestNode[];
}

const adapter: FlatTreeAdapter<TestNode> = {
  id: (node) => node.id,
  children: (node) => node.children,
  withChildren: (node, children) => ({ ...node, children }),
};

/** a group node (can have children) */
function group(id: string, ...children: TestNode[]): TestNode {
  return { id, children };
}

/** a leaf node that can never have children */
function leaf(id: string): TestNode {
  return { id };
}

/** compact representation of rows for assertions: `"id@level"` */
function describeRows(rows: FlatTreeRow<TestNode>[]): string[] {
  return rows.map((row) => `${row.id}@${row.level}`);
}

describe("flat-tree", () => {
  //     a
  //     G
  //      ├ b
  //      └ Sub
  //         └ c
  const tree = [leaf("a"), group("G", leaf("b"), group("Sub", leaf("c")))];

  it("flattens a tree into indented rows, without the nested children", () => {
    const rows = flattenTree(tree, adapter);

    expect(describeRows(rows)).toEqual(["a@0", "G@0", "b@1", "Sub@1", "c@2"]);
    expect(rows[1].data.children).toEqual([]);
    expect(rows[0].data.children).toBeUndefined();
  });

  it("rebuilds the original tree from the flat rows", () => {
    expect(rebuildTree(flattenTree(tree, adapter), adapter)).toEqual(tree);
  });

  it("clamps levels so rows form a valid tree", () => {
    const rows: FlatTreeRow<TestNode>[] = [
      { id: "a", level: 2, data: leaf("a") }, // first row -> forced to 0
      { id: "G", level: 3, data: group("G") }, // -> 0
      { id: "b", level: 9, data: leaf("b") }, // below a group -> 1
      { id: "c", level: 5, data: leaf("c") }, // below a leaf -> stays at 1
    ];

    expect(describeRows(normalizeLevels(rows, adapter))).toEqual([
      "a@0",
      "G@0",
      "b@1",
      "c@1",
    ]);
  });

  it("keeps all rows at the top level when maxLevel is 0", () => {
    const rows = flattenTree(tree, adapter);

    expect(
      describeRows(normalizeLevels(rows, adapter, { maxLevel: 0 })),
    ).toEqual(["a@0", "G@0", "b@0", "Sub@0", "c@0"]);
  });

  it("measures a subtree as the row itself plus its descendants", () => {
    const rows = flattenTree(tree, adapter);

    expect(subtreeLength(rows, 0)).toBe(1); // a
    expect(subtreeLength(rows, 1)).toBe(4); // G, b, Sub, c
    expect(subtreeLength(rows, 3)).toBe(2); // Sub, c
  });

  it("moveSubtree moves a group together with its whole subtree", () => {
    const rows = flattenTree(tree, adapter);

    // drag "G" (index 1) to the top
    const moved = moveSubtree(rows, 1, 0, adapter);

    expect(describeRows(moved)).toEqual(["G@0", "b@1", "Sub@1", "c@2", "a@0"]);
  });

  it("moveSubtree accounts for the descendants moved along when dropping further down", () => {
    const rows = flattenTree(
      [group("G", leaf("b")), leaf("x"), leaf("y")],
      adapter,
    );

    // drag "G" (index 0) below "y": cdk reports the index it would take without its child
    const moved = moveSubtree(rows, 0, 3, adapter, { levelDelta: 0 });

    expect(describeRows(moved)).toEqual(["x@0", "y@0", "G@0", "b@1"]);
  });

  it("moveSubtree nests a row into the group above it when dragged to the right", () => {
    const rows = flattenTree([group("G"), leaf("a")], adapter);

    const moved = moveSubtree(rows, 1, 1, adapter, { levelDelta: 1 });

    expect(describeRows(moved)).toEqual(["G@0", "a@1"]);
  });

  it("moveSubtree un-nests a row when dragged to the left", () => {
    const rows = flattenTree([group("G", leaf("a")), leaf("z")], adapter);

    const moved = moveSubtree(rows, 1, 1, adapter, { levelDelta: -1 });

    expect(describeRows(moved)).toEqual(["G@0", "a@0", "z@0"]);
  });

  it("moveSubtree does not nest deeper than the row above allows", () => {
    const rows = flattenTree([leaf("a"), leaf("b")], adapter);

    // "a" is a leaf and cannot take children, however far "b" is dragged to the right
    const moved = moveSubtree(rows, 1, 1, adapter, { levelDelta: 3 });

    expect(describeRows(moved)).toEqual(["a@0", "b@0"]);
  });

  it("moveSubtree does not nest beyond maxLevel", () => {
    const rows = flattenTree([group("G"), leaf("a")], adapter);

    const moved = moveSubtree(rows, 1, 1, adapter, {
      levelDelta: 1,
      maxLevel: 0,
    });

    expect(describeRows(moved)).toEqual(["G@0", "a@0"]);
  });

  it("moveSubtree does not drop in shallower than the row below, which it would adopt", () => {
    const rows = flattenTree(
      [group("G", group("S", leaf("x"), leaf("y"))), leaf("B")],
      adapter,
    );

    // drop "B" between "S" and its children: staying at level 0 would make x/y its children
    const moved = moveSubtree(rows, 4, 2, adapter, { levelDelta: 0 });

    expect(describeRows(moved)).toEqual(["G@0", "S@1", "B@2", "x@2", "y@2"]);
  });

  it("moveSubtree cannot un-nest a first child that has siblings following it", () => {
    const rows = flattenTree([group("G", leaf("a"), leaf("b"))], adapter);

    // promoting "a" would turn its sibling "b" into a child of "a"
    const moved = moveSubtree(rows, 1, 1, adapter, { levelDelta: -1 });

    expect(describeRows(moved)).toEqual(["G@0", "a@1", "b@1"]);
  });

  it("moveSubtree ignores dropping a group into its own subtree", () => {
    const rows = flattenTree(
      [group("G", leaf("b"), leaf("c")), leaf("z")],
      adapter,
    );

    const moved = moveSubtree(rows, 0, 1, adapter);

    expect(describeRows(moved)).toEqual(["G@0", "b@1", "c@1", "z@0"]);
  });

  it("moveSubtree promotes rows orphaned by the move", () => {
    const rows = flattenTree([group("G", leaf("b")), leaf("z")], adapter);

    // drag "G" (index 0) to the bottom, leaving its former child behind
    const moved = moveSubtree(rows, 0, 2, adapter);

    expect(describeRows(moved)).toEqual(["z@0", "G@0", "b@1"]);
  });

  it("removes a row together with its subtree", () => {
    const rows = flattenTree(tree, adapter);

    expect(describeRows(removeSubtree(rows, 1, adapter))).toEqual(["a@0"]);
    expect(describeRows(removeSubtree(rows, 3, adapter))).toEqual([
      "a@0",
      "G@0",
      "b@1",
    ]);
  });

  it("inserts a node as the first child of a group", () => {
    const rows = flattenTree(tree, adapter);

    const extended = insertChild(rows, 1, leaf("new"), adapter);

    expect(describeRows(extended)).toEqual([
      "a@0",
      "G@0",
      "new@1",
      "b@1",
      "Sub@1",
      "c@2",
    ]);
  });

  it("replaces the node of a single row", () => {
    const rows = flattenTree(tree, adapter);

    const updated = updateRow(rows, 0, { ...rows[0].data, id: "a" });

    expect(updated[0].data).not.toBe(rows[0].data);
    expect(describeRows(updated)).toEqual(describeRows(rows));
  });
});
