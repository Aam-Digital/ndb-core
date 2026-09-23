import { asArray } from "#src/app/utils/asArray";

import {
  DatabaseRule,
  EntityActionPermission,
} from "../../permissions/permission-types";

/** CASL mongo-query conditions restricting a permission, as stored on a rule */
export type RuleConditions = DatabaseRule["conditions"];

/**
 * Properties of a rule beyond subject/action/conditions (e.g. `reason`) that the
 * matrix does not model directly but preserves verbatim.
 */
export type RuleExtraProperties = Record<string, unknown>;

/**
 * State of one action for a subject in the permission matrix.
 */
export interface MatrixCell {
  allowed: boolean;

  /** CASL mongo-query conditions restricting the permission, undefined = unconditional */
  conditions?: RuleConditions;

  /**
   * Any further properties of the original rule that the matrix does not model
   * directly (e.g. `reason`). Preserved so they survive an edit round-trip.
   */
  extra?: RuleExtraProperties;
}

/**
 * All permissions of one record type (or "all") in the permission matrix.
 */
export interface MatrixRow {
  /** ENTITY_TYPE string or the wildcard "all" */
  subject: string;

  cells: Partial<Record<EntityActionPermission, MatrixCell>>;
}

/**
 * Editable matrix representation of a role's permission rules.
 */
export interface MatrixModel {
  rows: MatrixRow[];

  /**
   * Rules the matrix cannot represent (inverted, field-restricted or
   * non-string subjects). Preserved verbatim and re-emitted on save,
   * see {@link matrixToRules} on why their position is not tracked.
   */
  unsupportedRules: DatabaseRule[];
}

const MATRIX_ACTIONS: EntityActionPermission[] = [
  "read",
  "create",
  "update",
  "delete",
  "manage",
];

function isSupported(rule: DatabaseRule): boolean {
  if (rule.inverted || rule.fields) return false;

  const subjects = asArray(rule.subject);
  if (subjects.some((s) => typeof s !== "string")) return false;

  return asArray(rule.action).every((a) =>
    MATRIX_ACTIONS.includes(a as EntityActionPermission),
  );
}

/** properties of a rule beyond subject/action/conditions (e.g. reason), or undefined if none */
function extractExtra(rule: DatabaseRule): RuleExtraProperties | undefined {
  const { subject, action, conditions, ...extra } = rule;
  return Object.keys(extra).length > 0 ? extra : undefined;
}

/**
 * Convert permission rules into the matrix model.
 * Rules for the same subject are merged, with later rules winning per action.
 */
export function rulesToMatrix(rules: DatabaseRule[]): MatrixModel {
  const rows: MatrixRow[] = [];
  const unsupportedRules: DatabaseRule[] = [];

  (rules ?? []).forEach((rule) => {
    if (!isSupported(rule)) {
      unsupportedRules.push(rule);
      return;
    }

    const subjects = asArray(rule.subject) as string[];
    const actions = asArray(rule.action) as EntityActionPermission[];
    const extra = extractExtra(rule);

    for (const subject of subjects) {
      let row = rows.find((r) => r.subject === subject);
      if (!row) {
        row = { subject, cells: {} };
        rows.push(row);
      }
      for (const action of actions) {
        row.cells[action] = {
          allowed: true,
          ...(rule.conditions !== undefined
            ? { conditions: rule.conditions }
            : {}),
          ...(extra ? { extra } : {}),
        };
      }
    }
  });

  return { rows, unsupportedRules };
}

/**
 * Convert the matrix model back into minimal permission rules:
 * actions of one subject sharing identical conditions (and extra properties)
 * become one rule, and subjects with completely identical permissions are
 * grouped into one rule. The unsupported rules are appended unchanged at the
 * end (see {@link matrixToRules}).
 */
interface ActionGroup {
  actions: EntityActionPermission[];
  conditions?: RuleConditions;
  extra?: RuleExtraProperties;
}

interface RuleFragment extends ActionGroup {
  subjects: string[];
  key: string;
}

/** group a row's allowed actions by identical conditions + extra properties */
function groupAllowedActions(row: MatrixRow): Map<string, ActionGroup> {
  const byKey = new Map<string, ActionGroup>();
  for (const action of MATRIX_ACTIONS) {
    const cell = row.cells[action];
    if (!cell?.allowed) continue;

    const key = JSON.stringify([cell.conditions ?? null, cell.extra ?? null]);
    if (!byKey.has(key)) {
      byKey.set(key, {
        actions: [],
        conditions: cell.conditions,
        extra: cell.extra,
      });
    }
    byKey.get(key).actions.push(action);
  }
  return byKey;
}

function fragmentToRule(fragment: RuleFragment): DatabaseRule {
  return {
    subject:
      fragment.subjects.length === 1 ? fragment.subjects[0] : fragment.subjects,
    action:
      fragment.actions.length === 1 ? fragment.actions[0] : fragment.actions,
    ...(fragment.conditions !== undefined
      ? { conditions: fragment.conditions }
      : {}),
    ...(fragment.extra ?? {}),
  } as DatabaseRule;
}

export function matrixToRules(model: MatrixModel): DatabaseRule[] {
  const fragments: RuleFragment[] = [];
  for (const row of model.rows) {
    for (const [key, group] of groupAllowedActions(row)) {
      // merge with a previous subject's fragment that has identical actions + key
      const signatureMatch = fragments.find(
        (f) => f.key === key && f.actions.join(",") === group.actions.join(","),
      );
      if (signatureMatch) {
        signatureMatch.subjects.push(row.subject);
      } else {
        fragments.push({ subjects: [row.subject], key, ...group });
      }
    }
  }

  // Rule order does not matter for the permissions we use: CASL grants an action
  // as soon as any rule matches it, so a list of plain "allow" rules has the same
  // effect however it is sorted. Only an inverted ("cannot") rule is
  // order-sensitive, and we do not use those. Appending the unsupported rules
  // therefore keeps the meaning of every role we have.
  //
  // Should a role ever carry an inverted rule after all, coming last makes it
  // restrict rather than be overridden - the safe direction, but it also means a
  // matrix checkbox ticked for an action such a rule denies has no effect.
  return [...fragments.map(fragmentToRule), ...(model.unsupportedRules ?? [])];
}
