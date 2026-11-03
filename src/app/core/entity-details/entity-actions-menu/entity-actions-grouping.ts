import { EntityAction, EntityActionGroup } from "./entity-action.interface";

export type EntityActionsMenuEntry =
  | { kind: "action"; key: string; action: EntityAction }
  | {
      kind: "group";
      key: string;
      group: EntityActionGroup;
      actions: EntityAction[];
    };

/** Collapse actions sharing a group into one submenu entry. A group of one stays
 *  a plain item, as a submenu of one only adds a click. */
export function groupEntityActions(
  actions: EntityAction[],
): EntityActionsMenuEntry[] {
  const entries: EntityActionsMenuEntry[] = [];
  const groupEntries = new Map<string, GroupEntry>();

  for (const action of actions) {
    if (!action.group) {
      entries.push(asActionEntry(action));
      continue;
    }

    const existing = groupEntries.get(action.group.id);
    if (existing) {
      existing.actions.push(action);
    } else {
      const entry: GroupEntry = {
        kind: "group",
        key: `group:${action.group.id}`,
        group: action.group,
        actions: [action],
      };
      groupEntries.set(action.group.id, entry);
      entries.push(entry);
    }
  }

  return entries.map((entry) =>
    entry.kind === "group" && entry.actions.length === 1
      ? asActionEntry(entry.actions[0])
      : entry,
  );
}

type GroupEntry = Extract<EntityActionsMenuEntry, { kind: "group" }>;

function asActionEntry(action: EntityAction): EntityActionsMenuEntry {
  return { kind: "action", key: action.action, action };
}
