/**
 * Rewrite a stored query that selects on the removed, calculated "isActive" property,
 * so it uses the equivalent query helpers instead:
 * `[*isActive=true]` becomes `:filterActive` and `[*isActive=false]` becomes `:filterInactive`.
 *
 * Only used by the two migrations that need this rewrite, one for queries stored inside the config
 * document and one for queries stored on ReportConfig entities, so both apply it the same way.
 * Values that are not a string are passed through, which lets both walk a document with it.
 *
 * Node-safe: no @angular/* imports, so the admin CLI can use it through the config migrations.
 */
export function migrateIsActiveQuerySelection<T>(query: T): T {
  if (typeof query !== "string") {
    return query;
  }

  return query
    .replace(/\[\*isActive\s*=\s*true\]/g, ":filterActive")
    .replace(/\[\*isActive\s*(=\s*false|!=\s*true)\]/g, ":filterInactive") as T;
}
