import { splitNegation } from "./condition-negation";

/** How the rows of a condition combine: any one row ("or") or every row ("and") has to match. */
export type Combinator = "any" | "all";

/**
 * Combinator of a condition that does not exist yet. "all" is the safe default: in permissions
 * "any" would widen access when a second row is added, where "all" narrows it.
 */
export const DEFAULT_COMBINATOR: Combinator = "all";

export interface ParsedConditions {
  combinator: Combinator;
  /** one object per row, e.g. `{ center: "x" }` */
  rows: any[];
}

const isPlainObject = (value: any): boolean =>
  !!value && typeof value === "object" && !Array.isArray(value);

/**
 * Whether a row's value is set: not null, undefined or an empty list. Negating an empty value
 * leaves it just as empty, so an "is not" row that is still waiting for its value does not count.
 */
const hasValue = (value: any): boolean => {
  const { positive } = splitNegation(value);
  const operand =
    isPlainObject(positive) && "$eq" in positive ? positive.$eq : positive;

  return (
    operand !== null &&
    operand !== undefined &&
    !(Array.isArray(operand) && operand.length === 0)
  );
};

/** A row is complete once its field has a value. */
const isCompleteRow = (row: any): boolean =>
  isPlainObject(row) &&
  Object.keys(row).length > 0 &&
  Object.values(row).every(hasValue);

/**
 * Split a stored condition into the combinator it implies and its rows.
 *
 * An `$or` only implies "any" once a row in it is filled in, so a section that was seeded with one
 * blank row still gets the default. A condition can also combine `$or` / `$and` with sibling keys
 * (Mango's implicit AND, e.g. `{ status: "active", $or: [...] }`). The row editor has no concept
 * of nested groups, so such a sibling key cannot stay ANDed with the array - it becomes one more
 * row, which keeps it visible and editable instead of silently dropping it.
 *
 * The result never shares objects with `stored`, because the editor mutates rows in place.
 */
export function parseConditions(stored: any): ParsedConditions {
  if (!isPlainObject(stored)) {
    return { combinator: DEFAULT_COMBINATOR, rows: [] };
  }

  const copy = structuredClone(stored);
  const rows: any[] = [];
  let combinator = DEFAULT_COMBINATOR;

  if (Array.isArray(copy.$or)) {
    combinator = copy.$or.some(isCompleteRow) ? "any" : DEFAULT_COMBINATOR;
    rows.push(...copy.$or);
    delete copy.$or;
  } else if (Array.isArray(copy.$and)) {
    combinator = "all";
    rows.push(...copy.$and);
    delete copy.$and;
  }
  rows.push(...Object.entries(copy).map(([key, value]) => ({ [key]: value })));

  return { combinator, rows: rows.filter(isPlainObject) };
}

/**
 * Assemble the stored condition for a combinator. Incomplete rows are left out.
 *
 * "all" merges the rows into one object when no field repeats and uses an explicit `$and`
 * otherwise, because one object cannot hold the same key twice.
 */
export function buildConditions(combinator: Combinator, rows: any[]): any {
  const complete = structuredClone(rows ?? []).filter(isCompleteRow);
  if (complete.length === 0) {
    return {};
  }
  if (combinator === "any") {
    return { $or: complete };
  }

  const keys = complete.flatMap((row) => Object.keys(row));
  return new Set(keys).size === keys.length
    ? Object.assign({}, ...complete)
    : { $and: complete };
}

/** The same condition in the shape the editor would store it. */
export function normalizeConditions(stored: any): any {
  const { combinator, rows } = parseConditions(stored);
  return buildConditions(combinator, rows);
}
