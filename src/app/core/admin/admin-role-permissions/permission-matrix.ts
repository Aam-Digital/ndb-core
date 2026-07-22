import {
  DatabaseRule,
  EntityActionPermission,
} from "../../permissions/permission-types";

/**
 * State of one action for a subject in the permission matrix.
 */
export interface MatrixCell {
  allowed: boolean;

  /** CASL mongo-query conditions restricting the permission, undefined = unconditional */
  conditions?: any;

  /**
   * Any further properties of the original rule that the matrix does not model
   * directly (e.g. `reason`). Preserved so they survive an edit round-trip.
   */
  extra?: Record<string, any>;
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
   * non-string subjects). Preserved verbatim and re-emitted on save.
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

  const subjects = Array.isArray(rule.subject) ? rule.subject : [rule.subject];
  if (subjects.some((s) => typeof s !== "string")) return false;

  const actions = Array.isArray(rule.action) ? rule.action : [rule.action];
  return actions.every((a) =>
    MATRIX_ACTIONS.includes(a as EntityActionPermission),
  );
}

/** properties of a rule beyond subject/action/conditions (e.g. reason), or undefined if none */
function extractExtra(rule: DatabaseRule): Record<string, any> | undefined {
  const { subject, action, conditions, ...extra } = rule as any;
  return Object.keys(extra).length > 0 ? extra : undefined;
}

/**
 * Convert permission rules into the matrix model.
 * Rules for the same subject are merged, with later rules winning per action.
 */
export function rulesToMatrix(rules: DatabaseRule[]): MatrixModel {
  const rows: MatrixRow[] = [];
  const unsupportedRules: DatabaseRule[] = [];

  for (const rule of rules ?? []) {
    if (!isSupported(rule)) {
      unsupportedRules.push(rule);
      continue;
    }

    const subjects = (
      Array.isArray(rule.subject) ? rule.subject : [rule.subject]
    ) as string[];
    const actions = (
      Array.isArray(rule.action) ? rule.action : [rule.action]
    ) as EntityActionPermission[];
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
  }

  return { rows, unsupportedRules };
}

/**
 * Convert the matrix model back into minimal permission rules:
 * actions of one subject sharing identical conditions (and extra properties)
 * become one rule, and subjects with completely identical permissions are
 * grouped into one rule. Unsupported rules are appended unchanged.
 */
export function matrixToRules(model: MatrixModel): DatabaseRule[] {
  interface RuleFragment {
    subjects: string[];
    actions: EntityActionPermission[];
    key: string;
    conditions?: any;
    extra?: Record<string, any>;
  }

  const fragments: RuleFragment[] = [];

  for (const row of model.rows) {
    // group this row's allowed actions by identical conditions + extra properties
    const byKey = new Map<
      string,
      {
        actions: EntityActionPermission[];
        conditions?: any;
        extra?: Record<string, any>;
      }
    >();
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

    for (const [key, group] of byKey) {
      // merge with a previous subject's fragment that has identical actions + key
      const signatureMatch = fragments.find(
        (f) => f.key === key && f.actions.join(",") === group.actions.join(","),
      );
      if (signatureMatch) {
        signatureMatch.subjects.push(row.subject);
      } else {
        fragments.push({
          subjects: [row.subject],
          actions: group.actions,
          key,
          conditions: group.conditions,
          extra: group.extra,
        });
      }
    }
  }

  const rules: DatabaseRule[] = fragments.map(
    (f) =>
      ({
        subject: f.subjects.length === 1 ? f.subjects[0] : f.subjects,
        action: f.actions.length === 1 ? f.actions[0] : f.actions,
        ...(f.conditions !== undefined ? { conditions: f.conditions } : {}),
        ...(f.extra ?? {}),
      }) as DatabaseRule,
  );

  // unsupported rules are appended last on purpose: later rules take precedence
  // in CASL, so restrictions (inverted rules) always win over the matrix's allow rules
  return [...rules, ...(model.unsupportedRules ?? [])];
}
