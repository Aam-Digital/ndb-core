import { IconName } from "@fortawesome/fontawesome-svg-core";

import { DEFAULT_SECTION_KEY, PUBLIC_SECTION_KEY } from "./permission-types";

/**
 * User-facing details of one reserved (virtual) role, i.e. a section of the
 * permissions config that does not name a realm role but carries special
 * semantics (see {@link RESERVED_RULE_CONFIG_KEYS}).
 */
export interface ReservedRoleInfo {
  /** the section key in the permissions config, e.g. "_default" */
  key: string;

  /** short name of the role, e.g. as a permission matrix row label */
  label: string;

  /** who the role's permissions apply to, as a short phrase below the label */
  appliesTo: string;

  /** full sentence describing the role, e.g. in the roles overview */
  description: string;

  /** icon marking the role in listings and matrix rows */
  icon: IconName;
}

/**
 * The "_default" role, whose permissions every logged-in user has
 * in addition to the permissions of their own roles.
 */
export const DEFAULT_ROLE: ReservedRoleInfo = {
  key: DEFAULT_SECTION_KEY,
  label: $localize`:Reserved role name of the "_default" role:Default`,
  appliesTo: $localize`applies to any logged-in user, in addition to their roles`,
  description: $localize`Base permissions that apply to every logged-in user, combined with their other roles`,
  icon: "lock",
};

/** The "_public" role, whose permissions apply to visitors before login. */
export const PUBLIC_ROLE: ReservedRoleInfo = {
  key: PUBLIC_SECTION_KEY,
  label: $localize`:Reserved role name of the "_public" role:Public`,
  appliesTo: $localize`applies to visitors who are not logged in`,
  description: $localize`Permissions that apply before login (e.g. public registration forms)`,
  icon: "globe",
};

/**
 * The reserved roles with their user-facing name and description, so that all
 * places explaining them to the user (roles overview, permission matrix,
 * permission dialogs) use the same wording.
 *
 * Ordered as they should be listed to the user.
 */
export const RESERVED_ROLES: ReservedRoleInfo[] = [DEFAULT_ROLE, PUBLIC_ROLE];

/** details of the given reserved role, or undefined if it is an ordinary role */
export function getReservedRole(
  roleName: string,
): ReservedRoleInfo | undefined {
  return RESERVED_ROLES.find((role) => role.key === roleName);
}

/** the reserved role's readable name, or the plain role name for ordinary roles */
export function roleDisplayName(roleName: string): string {
  return getReservedRole(roleName)?.label ?? roleName;
}
