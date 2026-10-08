import { applyConfigMigrations } from "../../src/app/core/config/config-migrations.js";
import type { MigrationContext } from "./migration-definition.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Utilities for migrations to find out whether (and where) a field of an entity type is in use:
 * referenced in config (columns, filters, form fields, ...) or holding data in the entity docs.
 */

/** A place in a config referencing a field */
export interface FieldReference {
  /** keys from the root of the searched config, e.g. `["view:note", "config", "columns", "2"]` */
  path: string[];
  /**
   * whether this is an entry of a list (e.g. `"children"` in columns, `{ id: "children" }` in filters)
   * that can be removed without breaking the config
   */
  removable: boolean;
}

/** Components implying the entity type of their config, if it does not state an `entityType` (e.g. in older formats) */
const COMPONENT_ENTITY_TYPES: Record<string, string> = {
  NotesRelatedToEntity: "Note",
  NotesManager: "Note",
  TodosRelatedToEntity: "Todo",
};

/**
 * Find the references to an entity field in config parts that are about that entity type,
 * e.g. the columns of an `entityType: "Note"` component config.
 *
 * Works on any config document (e.g. a PublicFormConfig) or part of it.
 * For a whole `Config:CONFIG_ENTITY`, use {@link findConfigFieldReferences}.
 *
 * @param node config (part) to search
 * @param entityType the type the field belongs to
 * @param field the field name
 * @param contextType the entity type the given node is about, if known from its parents
 */
export function findFieldReferences(
  node: unknown,
  entityType: string,
  field: string,
  contextType?: string,
): FieldReference[] {
  const references: FieldReference[] = [];
  collectReferences(node, entityType, field, contextType, [], references);
  return references;
}

function collectReferences(
  node: unknown,
  entityType: string,
  field: string,
  contextType: string | undefined,
  path: string[],
  references: FieldReference[],
): void {
  const inContext = contextType === entityType;
  if (typeof node === "string") {
    if (inContext && node === field) {
      references.push({ path, removable: false });
    }
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((item, index) => {
      if (inContext && isListReference(item, field)) {
        references.push({ path: [...path, String(index)], removable: true });
      } else {
        collectReferences(
          item,
          entityType,
          field,
          contextType,
          [...path, String(index)],
          references,
        );
      }
    });
    return;
  }
  if (!node || typeof node !== "object") {
    return;
  }

  const obj = node as Record<string, unknown>;
  const type = entityTypeOf(obj, contextType);
  for (const [key, value] of Object.entries(obj)) {
    if (type === entityType && key === field) {
      // e.g. `prefilled` values of a PublicFormConfig are keyed by field
      references.push({ path: [...path, key], removable: false });
    } else {
      collectReferences(
        value,
        entityType,
        field,
        type,
        [...path, key],
        references,
      );
    }
  }
}

/**
 * Find the references to an entity field in a `Config:CONFIG_ENTITY` (see {@link findFieldReferences}).
 * Also recognizes top-level entries about the entity type by their key (`entity:Note`, `view:note`, `view:note/:id`)
 * and does not count the field's definition (`entity:Note.attributes.<field>`) as a reference.
 *
 * Search the latest config format (see `applyConfigMigrations`) to find references as the app interprets them.
 *
 * @param configData the `data` of the Config doc
 */
export function findConfigFieldReferences(
  configData: Record<string, any>,
  entityType: string,
  field: string,
): FieldReference[] {
  const entityKeys = configKeysOf(configData, entityType);
  const definitionPath = [`entity:${entityType}`, "attributes", field];
  return Object.entries(configData)
    .flatMap(([key, value]) =>
      findFieldReferences(
        value,
        entityType,
        field,
        entityKeys.includes(key) ? entityType : undefined,
      ).map((ref) => ({ ...ref, path: [key, ...ref.path] })),
    )
    .filter(
      (ref) => !definitionPath.every((segment, i) => ref.path[i] === segment),
    );
}

/** The top-level config keys of the entries about the given entity type */
function configKeysOf(configData: Record<string, any>, entityType: string) {
  const route = (
    configData[`entity:${entityType}`]?.route ?? entityType.toLowerCase()
  ).replace(/^\//, "");
  return [`entity:${entityType}`, `view:${route}`, `view:${route}/:id`];
}

/**
 * The docs referencing the field (see {@link findFieldReferences}), e.g. PublicFormConfigs for that entity type.
 * @returns ids of the referencing docs
 */
export function findDocsReferencingField(
  docs: any[],
  entityType: string,
  field: string,
): string[] {
  return docs
    .filter((doc) => findFieldReferences(doc, entityType, field).length > 0)
    .map((doc) => doc._id);
}

/**
 * The SQL ReportConfigs whose definition mentions the field name (as a whole word).
 * Their queries rely on the field's column in the SQL schema, which is derived from the stored entity config.
 * (A mention of the name in a different meaning is also matched, which errs on the safe side for migrations.)
 * @returns ids of the mentioning reports
 */
export function findSqlReportsMentioning(
  reports: any[],
  field: string,
): string[] {
  const word = new RegExp(`\\b${field}\\b`);
  return reports
    .filter(
      (report) =>
        report?.mode === "sql" &&
        word.test(JSON.stringify(report.reportDefinition ?? report)),
    )
    .map((report) => report._id);
}

/**
 * Copy of the config (part) without the list entries referencing the field
 * (the `removable` references of {@link findFieldReferences}).
 */
export function withoutFieldListReferences(
  node: unknown,
  entityType: string,
  field: string,
  contextType?: string,
): unknown {
  if (Array.isArray(node)) {
    return node
      .filter(
        (item) => contextType !== entityType || !isListReference(item, field),
      )
      .map((item) =>
        withoutFieldListReferences(item, entityType, field, contextType),
      );
  }
  if (!node || typeof node !== "object") {
    return node;
  }

  const obj = node as Record<string, unknown>;
  const type = entityTypeOf(obj, contextType);
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      withoutFieldListReferences(value, entityType, field, type),
    ]),
  );
}

/**
 * Remove a field from a `Config:CONFIG_ENTITY`: its definition in `entity:<type>`
 * and all list entries referencing it (columns, filters, form fields, ...).
 *
 * @returns the cleaned config `data`, or (if references remain that cannot be removed automatically,
 *          checked in the latest config format) only the remaining references
 */
export function removeFieldFromConfig(
  config: { data: Record<string, any> },
  entityType: string,
  field: string,
): { data?: Record<string, any>; remaining: FieldReference[] } {
  const entityKeys = configKeysOf(config.data, entityType);
  const cleaned: Record<string, any> = structuredClone(config.data);
  delete cleaned[`entity:${entityType}`]?.attributes?.[field];
  for (const [key, value] of Object.entries(cleaned)) {
    cleaned[key] = withoutFieldListReferences(
      value,
      entityType,
      field,
      entityKeys.includes(key) ? entityType : undefined,
    );
  }

  const remaining = findConfigFieldReferences(
    applyConfigMigrations(structuredClone({ ...config, data: cleaned })).data,
    entityType,
    field,
  );
  return remaining.length === 0 ? { data: cleaned, remaining } : { remaining };
}

/** The top-level config keys of the given references, e.g. to name them in a log */
export function referencedConfigKeys(references: FieldReference[]): string[] {
  return [...new Set(references.map((ref) => ref.path[0]))];
}

function entityTypeOf(
  obj: Record<string, unknown>,
  contextType: string | undefined,
): string | undefined {
  const type = obj["entityType"] ?? obj["entity"] ?? obj["eventType"];
  if (typeof type === "string") {
    return type;
  }
  return COMPONENT_ENTITY_TYPES[obj["component"] as string] ?? contextType;
}

function isListReference(item: unknown, field: string): boolean {
  return item === field || (item as any)?.id === field;
}

/** Counting stops at this number of docs by default, which is enough to judge whether a field is in use */
export const DATA_COUNT_LIMIT = 1000;

export interface FieldDataCounts {
  /** number of docs holding data in each field */
  counts: Map<string, number>;
  /** false if counting stopped at the limit, so the counts are lower bounds */
  complete: boolean;
}

/**
 * Count the docs of an entity type holding data in each of the given fields, with a single query for all fields:
 * CouchDB reads the docs once on the server (stopping early once enough are found)
 * and only sends back the matching docs, reduced to these fields.
 * Any value other than null or an empty array counts as data
 * (also unexpected ones like a single id instead of an array, to never treat a field in use as unused).
 *
 * (An index would not speed up a one-off check: building it takes the same full read
 * and writes a design doc into the production database.)
 */
export async function countDocsWithFieldData(
  ctx: MigrationContext,
  entityType: string,
  fields: string[],
  limit = DATA_COUNT_LIMIT,
): Promise<FieldDataCounts> {
  const counts = new Map(fields.map((field) => [field, 0]));
  if (fields.length === 0) {
    return { counts, complete: true };
  }

  const startedAt = Date.now();
  const docs = await findDocsWithFieldData(ctx, entityType, fields, limit);
  for (const field of fields) {
    counts.set(
      field,
      docs.filter((doc) => hasFieldData(doc, entityType, field)).length,
    );
  }

  const complete = docs.length < limit;
  if (!complete) {
    // a batch full of matches for one field could hide that another one has data, too
    for (const field of fields.filter((field) => counts.get(field) === 0)) {
      const sample = await findDocsWithFieldData(ctx, entityType, [field], 1);
      counts.set(
        field,
        sample.filter((doc) => hasFieldData(doc, entityType, field)).length,
      );
    }
  }

  ctx.log.verbose(
    `Checked ${entityType} docs for data in ${fields.join(", ")} in ${Date.now() - startedAt}ms`,
  );
  return { counts, complete };
}

/**
 * Docs of the entity type holding data in any of the given fields, reduced to these fields.
 * The selector is evaluated by CouchDB on the id range of the entity type.
 */
async function findDocsWithFieldData(
  ctx: MigrationContext,
  entityType: string,
  fields: string[],
  limit: number,
): Promise<any[]> {
  return (await ctx.couchdb.find({
    selector: {
      _id: { $gt: `${entityType}:`, $lt: `${entityType}:￰` },
      $or: fields.map((field) => ({
        [field]: { $exists: true, $ne: null },
        $not: { [field]: { $size: 0 } },
      })),
    },
    fields: ["_id", ...fields],
    limit,
  })) as any[];
}

/** Re-checks a query result instead of relying on the selector alone */
function hasFieldData(doc: any, entityType: string, field: string): boolean {
  const value = doc?.[field];
  return (
    !!doc?._id?.startsWith(`${entityType}:`) &&
    value !== undefined &&
    value !== null &&
    !(Array.isArray(value) && value.length === 0)
  );
}
