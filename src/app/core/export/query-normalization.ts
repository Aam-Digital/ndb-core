/**
 * Rewrite selections on the removed, calculated "isActive" property to the equivalent query helpers.
 *
 * Shared by the config migration (for queries stored inside the config document) and the CLI
 * migration (for queries stored on ReportConfig entities), so both rewrite them the same way.
 *
 * Node-safe: no @angular/* imports, so the admin CLI can use it through the config migrations.
 */
export function normalizeQuery<T>(query: T): T {
  if (typeof query !== "string") {
    return query;
  }

  return query
    .replace(/\[\*isActive\s*=\s*true\]/g, ":filterActive")
    .replace(/\[\*isActive\s*(=\s*false|!=\s*true)\]/g, ":filterInactive") as T;
}
