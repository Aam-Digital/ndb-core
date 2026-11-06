import { groupEntityActions } from "./entity-actions-grouping";
import { EntityAction, EntityActionGroup } from "./entity-action.interface";

describe("groupEntityActions", () => {
  const group: EntityActionGroup = {
    id: "import-related",
    label: "Import related",
    icon: "file-import",
  };

  function action(id: string, actionGroup?: EntityActionGroup): EntityAction {
    return {
      action: id,
      label: id,
      icon: "test",
      group: actionGroup,
      execute: async () => true,
    };
  }

  it("keeps ungrouped actions as individual entries in their original order", () => {
    const actions = [action("archive"), action("delete")];

    expect(groupEntityActions(actions)).toEqual([
      { kind: "action", key: "archive", action: actions[0] },
      { kind: "action", key: "delete", action: actions[1] },
    ]);
  });

  it("collapses actions of the same group into one entry at the position of the first one", () => {
    const actions = [
      action("archive"),
      action("import-a", group),
      action("delete"),
      action("import-b", group),
    ];

    expect(groupEntityActions(actions)).toEqual([
      { kind: "action", key: "archive", action: actions[0] },
      {
        kind: "group",
        key: "group:import-related",
        group,
        actions: [actions[1], actions[3]],
      },
      { kind: "action", key: "delete", action: actions[2] },
    ]);
  });

  it("displays a group with only one action as a plain action", () => {
    const actions = [action("import-a", group)];

    expect(groupEntityActions(actions)).toEqual([
      { kind: "action", key: "import-a", action: actions[0] },
    ]);
  });

  it("keeps several groups separate", () => {
    const otherGroup: EntityActionGroup = {
      id: "attendance-downloads",
      label: "Download attendance lists",
      icon: "download",
    };
    const actions = [
      action("import-a", group),
      action("download-a", otherGroup),
      action("import-b", group),
      action("download-b", otherGroup),
    ];

    const entries = groupEntityActions(actions);

    expect(entries.map((e) => e.key)).toEqual([
      "group:import-related",
      "group:attendance-downloads",
    ]);
  });
});
