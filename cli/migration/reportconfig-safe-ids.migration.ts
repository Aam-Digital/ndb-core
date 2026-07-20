import type {
  MigrationDefinition,
  MigrationResult,
} from "./migration-definition.js";

interface RenamableDoc {
  _id: string;
  _rev: string;
  _attachments?: unknown;
}

/**
 * Turn a doc `_id` into a URL-path-safe form:
 * 1. umlauts → their base vowel (ä→a, ö→o, ü→u, Ä→A, Ö→O, Ü→U — kept readable, not ae/oe/ue),
 * 2. every remaining run of characters that are unsafe in a path (space, `&`, …) → a single `-`.
 *
 * `:` is preserved (it separates the entity type and works fine in the path); hyphens that would
 * land next to a `:` or at the ends are trimmed. Only the id is transformed — the doc data (incl.
 * the human-readable `title`) is left untouched.
 */
function toUrlSafeId(id: string): string {
  return id
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/Ä/g, "A")
    .replace(/Ö/g, "O")
    .replace(/Ü/g, "U")
    .replace(/[^A-Za-z0-9:._-]+/g, "-")
    .replace(/-*:-*/g, ":")
    .replace(/^-+|-+$/g, "");
}

/**
 * Rename ReportConfig documents whose `_id` contains characters that are unsafe in a URL path,
 * replacing them with a safe, readable equivalent (see {@link toUrlSafeId}). Examples:
 *   `ReportConfig:Gesamt-Übersicht`      → `ReportConfig:Gesamt-Ubersicht`
 *   `ReportConfig:Report:Eventi & attivi` → `ReportConfig:Report:Eventi-attivi`
 *
 * Why: such characters in a doc `_id` break the reverse proxy in front of CouchDB — the
 * `/db/couchdb/...` path returns 400 (e.g. on percent-encoded UTF-8 umlauts) — so those docs can
 * neither be opened in Fauxton nor edited through the app. ReportConfig ids are derived from the
 * report title, so they are the ones that pick up umlauts, spaces, `&`, and the like.
 *
 * A doc `_id` is immutable, so this copies the doc to an ASCII id and deletes the original. The
 * copy is created via `ctx.put` (tracked, previewed); the delete goes through `_bulk_docs`
 * (`putAll`) so the old umlaut id never appears in a URL path — otherwise the delete would hit the
 * very proxy bug this migration works around.
 *
 * Scope: ReportConfig only. Reports are enumerated dynamically (`loadType(ReportEntity)`), so no
 * menu item, dashboard widget, or route references a report by id — the rename is self-contained.
 * (Broaden to other entity types only if you confirm nothing references those ids by value.)
 * Idempotent: after a run the renamed docs no longer contain umlauts, so re-running is a no-op.
 */
export const reportConfigSafeIds: MigrationDefinition = {
  id: "oneoff-20260713-reportconfig-safe-ids",
  description:
    "Rename ReportConfig docs whose _id has URL-unsafe characters to a safe form (umlauts → base vowel; spaces, & etc. → hyphen). Copies to the new id and deletes the original. Safe to re-run.",

  async run(ctx): Promise<MigrationResult> {
    const docs = (await ctx.couchdb.getAll("ReportConfig")) as RenamableDoc[];
    const existingIds = new Set(docs.map((d) => d._id));

    let intended = 0;
    const warnings: string[] = [];
    const renamed: string[] = [];

    for (const doc of docs) {
      const newId = toUrlSafeId(doc._id);
      if (newId === doc._id) continue;

      if (doc._attachments) {
        warnings.push(`Skipped ${doc._id}: has attachments (rename unsupported)`);
        continue;
      }
      if (existingIds.has(newId)) {
        warnings.push(`Skipped ${doc._id}: target id ${newId} already exists`);
        continue;
      }

      intended++;
      const oldId = doc._id;
      const oldRev = doc._rev;
      const { _rev, ...rest } = doc;
      const newDoc = { ...rest, _id: newId };

      ctx.log.info(`Renaming ${oldId} → ${newId}`);
      // 1. create the copy under the ASCII id (safe path, tracked/previewed)
      await ctx.put(`/app/${newId}`, newDoc);
      existingIds.add(newId);
      renamed.push(oldId);

      // 2. delete the original via _bulk_docs so the umlaut id stays out of the URL path
      if (!ctx.dryRun) {
        await ctx.couchdb.putAll([{ _id: oldId, _rev: oldRev, _deleted: true }]);
      } else {
        ctx.log.info(`[PREVIEW] Would delete ${oldId}`);
      }
    }

    if (intended === 0) {
      ctx.log.info("No ReportConfig ids renamed");
      return {
        changed: false,
        status: "no-change",
        warnings: warnings.length ? warnings : undefined,
      };
    }

    if (renamed.length > 0 && !ctx.dryRun) {
      warnings.push(
        `Renamed report ids: ${renamed.join(", ")}. Cached SQL report calculations keyed by the old id are orphaned and will be recalculated on next run.`,
      );
    }

    return {
      changed: true,
      status: ctx.dryRun ? "dry-run" : "ok",
      warnings: warnings.length ? warnings : undefined,
    };
  },
};
