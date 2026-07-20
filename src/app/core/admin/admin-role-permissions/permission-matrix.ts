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
        };
      }
    }
  }

  return { rows, unsupportedRules };
}

/**
 * Convert the matrix model back into minimal permission rules:
 * actions of one subject sharing identical conditions become one rule and
 * subjects with completely identical permissions are grouped into one rule.
 * Unsupported rules are appended unchanged.
 */
export function matrixToRules(model: MatrixModel): DatabaseRule[] {
  interface RuleFragment {
    subjects: string[];
    actions: EntityActionPermission[];
    conditionsKey: string;
    conditions?: any;
  }

  const fragments: RuleFragment[] = [];

  for (const row of model.rows) {
    // group this row's allowed actions by identical conditions
    const byConditions = new Map<
      string,
      { actions: EntityActionPermission[]; conditions?: any }
    >();
    for (const action of MATRIX_ACTIONS) {
      const cell = row.cells[action];
      if (!cell?.allowed) continue;

      const key = JSON.stringify(cell.conditions ?? null);
      if (!byConditions.has(key)) {
        byConditions.set(key, { actions: [], conditions: cell.conditions });
      }
      byConditions.get(key).actions.push(action);
    }

    for (const [conditionsKey, group] of byConditions) {
      // merge with a fragment of a previous subject that has identical actions + conditions
      const signatureMatch = fragments.find(
        (f) =>
          f.conditionsKey === conditionsKey &&
          f.actions.join(",") === group.actions.join(","),
      );
      if (signatureMatch) {
        signatureMatch.subjects.push(row.subject);
      } else {
        fragments.push({
          subjects: [row.subject],
          actions: group.actions,
          conditionsKey,
          conditions: group.conditions,
        });
      }
    }
  }

  const rules: DatabaseRule[] = fragments.map((f) => ({
    subject: f.subjects.length === 1 ? f.subjects[0] : f.subjects,
    action: f.actions.length === 1 ? f.actions[0] : f.actions,
    ...(f.conditions !== undefined ? { conditions: f.conditions } : {}),
  }));

  return [...rules, ...(model.unsupportedRules ?? [])];
}
