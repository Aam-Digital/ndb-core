import {
  ACTION_META,
  actionMetaFor,
  ChangeAction,
  OPERATION_TO_ACTION,
} from "./change-history.types";

it("has display metadata for every change action", () => {
  const actions: ChangeAction[] = ["baseline", "created", "updated", "deleted"];
  for (const action of actions) {
    expect(ACTION_META[action]).toBeDefined();
    expect(ACTION_META[action].icon).toBeTruthy();
    expect(ACTION_META[action].label).toBeTruthy();
  }
});

it("maps the backend operations to display actions", () => {
  expect(OPERATION_TO_ACTION.create).toBe("created");
  expect(OPERATION_TO_ACTION.update).toBe("updated");
  expect(OPERATION_TO_ACTION.delete).toBe("deleted");
  expect(OPERATION_TO_ACTION.baseline).toBe("baseline");
});

it("falls back to 'updated' metadata for an unknown action", () => {
  expect(actionMetaFor("nonsense" as ChangeAction)).toBe(ACTION_META.updated);
});

it("returns the matching metadata for a known action", () => {
  expect(actionMetaFor("deleted")).toBe(ACTION_META.deleted);
});
