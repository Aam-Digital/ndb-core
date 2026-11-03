import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import {
  buildHierarchyView,
  descendantIds,
  HierarchyOptions,
  HierarchyView,
  resolveParentIds,
} from "./hierarchy-tree";

/** a record named `name` with id `TestEntity:<name>`, linking to the record named `parent` through `ref` */
function record(name: string, parent?: string, other?: string): TestEntity {
  return Object.assign(new TestEntity(name), {
    name,
    ref: parent && `TestEntity:${parent}`,
    other,
  });
}

/**
 * compact form of the rows for assertions:
 * indentation by level, "(name)" for context rows, "name +3" for a collapsed row hiding 3 sub-records
 */
function describeRows(view: HierarchyView<TestEntity>): string[] {
  return view.rows.map(
    (row) =>
      "-".repeat(row.level) +
      (row.isContext ? `(${row.record.name})` : row.record.name) +
      (row.isCollapsed ? ` +${row.childCount}` : ""),
  );
}

const byRef: HierarchyOptions<TestEntity> = { parentField: "ref" };
const sortedByName: HierarchyOptions<TestEntity> = {
  parentField: "ref",
  sort: { active: "name", direction: "asc" },
};

// Clean Water
//  ├ Mobilisation
//  │  ├ Meetings
//  │  │  ├ Preparation
//  │  │  └ Rampur
//  │  └ Training
//  └ Well
// Garden
const plan = [
  record("Well", "Clean Water"),
  record("Rampur", "Meetings"),
  record("Clean Water"),
  record("Training", "Mobilisation"),
  record("Meetings", "Mobilisation"),
  record("Garden"),
  record("Preparation", "Meetings"),
  record("Mobilisation", "Clean Water"),
];
const named = (...names: string[]) =>
  names.map((name) => plan.find((r) => r.name === name)!);

describe("hierarchy-tree", () => {
  it("shows every record below its parent, each level sorted on its own", () => {
    const view = buildHierarchyView(plan, plan, sortedByName);

    expect(describeRows(view)).toEqual([
      "Clean Water",
      "-Mobilisation",
      "--Meetings",
      "---Preparation",
      "---Rampur",
      "--Training",
      "-Well",
      "Garden",
    ]);
    expect(view.rows.map((row) => row.childCount)).toEqual([
      2, 2, 2, 0, 0, 0, 0, 0,
    ]);
  });

  it("sorts each level in the given direction, also by a custom sort value", () => {
    const view = buildHierarchyView(plan, plan, {
      parentField: "ref",
      sort: {
        active: "name",
        direction: "desc",
        sortValueFns: { name: (value: string) => value.length },
      },
    });

    expect(describeRows(view)).toEqual([
      "Clean Water",
      "-Mobilisation",
      "--Training",
      "--Meetings",
      "---Preparation",
      "---Rampur",
      "-Well",
      "Garden",
    ]);
  });

  it.each([
    {
      scenario: "a matching sub-record with its parents as context",
      matches: ["Rampur"],
      expected: [
        "(Clean Water)",
        "-(Mobilisation)",
        "--(Meetings)",
        "---Rampur",
      ],
    },
    {
      scenario: "a matching parent without its sub-records",
      matches: ["Mobilisation"],
      expected: ["(Clean Water)", "-Mobilisation"],
    },
    {
      scenario: "matches in several branches sharing a parent once",
      matches: ["Preparation", "Well", "Garden"],
      expected: [
        "(Clean Water)",
        "-(Mobilisation)",
        "--(Meetings)",
        "---Preparation",
        "-Well",
        "Garden",
      ],
    },
    { scenario: "nothing without matches", matches: [], expected: [] },
  ])("shows $scenario", ({ matches, expected }) => {
    const view = buildHierarchyView(plan, named(...matches), sortedByName);

    expect(describeRows(view)).toEqual(expected);
  });

  it("leaves out the sub-records of collapsed records, counting only direct sub-records", () => {
    const view = buildHierarchyView(plan, plan, {
      ...sortedByName,
      collapsedIds: new Set(["TestEntity:Mobilisation", "TestEntity:Garden"]),
    });

    expect(describeRows(view)).toEqual([
      "Clean Water",
      "-Mobilisation +2",
      "-Well",
      "Garden",
    ]);
    expect([...view.hiddenIds].sort()).toEqual(
      [
        "TestEntity:Meetings",
        "TestEntity:Preparation",
        "TestEntity:Rampur",
        "TestEntity:Training",
      ].sort(),
    );
    expect(view.expandableIds).toEqual(
      new Set([
        "TestEntity:Clean Water",
        "TestEntity:Mobilisation",
        "TestEntity:Meetings",
      ]),
    );
  });

  it("shows only the records below the root record, starting at level 0", () => {
    const view = buildHierarchyView(plan, plan, {
      ...sortedByName,
      rootId: "TestEntity:Mobilisation",
    });

    expect(describeRows(view)).toEqual([
      "Meetings",
      "-Preparation",
      "-Rampur",
      "Training",
    ]);
  });

  it("shows the parents of a match below the root record as context, but not the root", () => {
    const view = buildHierarchyView(plan, named("Rampur", "Garden"), {
      ...sortedByName,
      rootId: "TestEntity:Clean Water",
    });

    expect(describeRows(view)).toEqual([
      "(Mobilisation)",
      "-(Meetings)",
      "--Rampur",
    ]);
  });

  it.each([
    {
      scenario: "a missing (deleted or not permitted) parent",
      records: [record("A", "deleted"), record("B", "A")],
      expected: ["A", "-B"],
    },
    {
      scenario: "a record that is its own parent",
      records: [record("A", "A"), record("B", "A")],
      expected: ["A", "-B"],
    },
    {
      scenario: "two records that are each other's parent",
      records: [record("A", "B"), record("B", "A"), record("C", "A")],
      expected: ["A", "-C", "B"],
    },
    {
      scenario: "a longer loop, keeping records that only lead into it",
      records: [
        record("A", "C"),
        record("B", "A"),
        record("C", "B"),
        record("D", "B"),
      ],
      expected: ["A", "B", "-D", "C"],
    },
    {
      scenario: "a parent value that is not a record id",
      records: [Object.assign(record("A"), { ref: { id: "x" } })],
      expected: ["A"],
    },
  ])("puts records at the top level for $scenario", ({ records, expected }) => {
    const view = buildHierarchyView(records, records, sortedByName);

    expect(describeRows(view)).toEqual(expected);
  });

  it("treats the root record as the top even if it is part of a loop", () => {
    const records = [record("A", "B"), record("B", "A"), record("C", "B")];
    const parents = resolveParentIds(records, "ref", "TestEntity:A");

    expect(descendantIds(parents, "TestEntity:A")).toEqual(
      new Set(["TestEntity:B", "TestEntity:C"]),
    );
  });

  it("arranges by another parent field", () => {
    const records = [
      record("Survey"),
      record("Well", undefined, "TestEntity:Survey"),
    ];
    const view = buildHierarchyView(records, records, {
      ...byRef,
      parentField: "other",
    });

    expect(describeRows(view)).toEqual(["Survey", "-Well"]);
  });
});
