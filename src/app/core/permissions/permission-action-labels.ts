import { DEFAULT_ROLE } from "./reserved-roles";

/** the CRUD actions shown as their own column, in the order they are displayed */
export const CRUD_ACTIONS = ["read", "create", "update", "delete"] as const;

export type CrudAction = (typeof CRUD_ACTIONS)[number];

/**
 * User-facing name of each action, so that the role administration and the
 * per-feature dialog label their columns identically.
 */
export const CRUD_ACTION_LABELS: Record<CrudAction, string> = {
  read: $localize`:Permission column header:Read`,
  create: $localize`:Permission column header:Create`,
  update: $localize`:Permission column header:Update`,
  delete: $localize`:Permission column header:Delete`,
};

/** the CASL "manage" action, which covers every other action */
export const MANAGE_ALL_LABEL = $localize`:Permission column header:Manage (all)`;

/** the actions with their labels, in display order */
export const CRUD_ACTION_COLUMNS: { action: CrudAction; label: string }[] =
  CRUD_ACTIONS.map((action) => ({
    action,
    label: CRUD_ACTION_LABELS[action],
  }));

/**
 * Explains a checkbox that is ticked but disabled because the shared default
 * role already grants the action to every logged-in user.
 */
export function grantedByDefaultRoleTooltip(): string {
  return $localize`:Permission locked by the default role tooltip:Already granted to every logged-in user by the "${DEFAULT_ROLE.label}" role, so it cannot be revoked for a single role here.`;
}

/**
 * Explains a checkbox that is ticked but disabled because a rule this UI cannot
 * express (wildcard subject, grouped subjects, conditions, an inverted rule or a
 * rule managed by the server) decides the access.
 */
export function grantedByAdvancedRuleTooltip(): string {
  return $localize`:Permission locked by an advanced rule tooltip:This access comes from an advanced permission rule and can only be changed in the user role administration.`;
}
