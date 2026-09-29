import type { Couchdb } from "../lib/couchdb-client.js";

interface AllDocsRow {
  id: string;
  value: { rev: string };
}

export interface OrphanedAttachment {
  _id: string;
  _rev: string;
}

/**
 * `app-attachments` documents whose entity no longer exists in `app` — left
 * behind because attachment cleanup used to run client-side and could race
 * replication (see Aam-Digital/replication-backend#317).
 */
export async function findOrphanedAttachments(
  couchdb: Couchdb,
): Promise<OrphanedAttachment[]> {
  const attachmentRows = await couchdb.get<AllDocsRow[]>(
    "/app-attachments/_all_docs",
  );
  const entityRows = await couchdb.get<AllDocsRow[]>("/app/_all_docs");
  const entityIds = new Set(entityRows.map((row) => row.id));

  return attachmentRows
    .filter((row) => !entityIds.has(row.id))
    .map((row) => ({ _id: row.id, _rev: row.value.rev }));
}

export async function deleteOrphanedAttachments(
  couchdb: Couchdb,
  orphans: OrphanedAttachment[],
): Promise<unknown> {
  if (orphans.length === 0) {
    return [];
  }
  const docs = orphans.map((orphan) => ({ ...orphan, _deleted: true }));
  return couchdb.putAll(docs, "app-attachments");
}
