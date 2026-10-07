import { PartialBulkWriteError } from "../database";
import { Logging } from "../../logging/logging.service";

/** The budgets one `_bulk_docs` request of a bulk write has to stay within. */
export interface BulkWriteLimits {
  /**
   * Maximum size (in bytes) of the documents sent in one `_bulk_docs` request.
   *
   * A synced database writes locally and lets replication push in batches of its own,
   * but a remote database sends whatever a caller passes in a single HTTP request. A
   * bulk write of several thousand records therefore produces a body that the server
   * rejects as a whole with 413 - before a single document is written.
   */
  maxBytes: number;

  /**
   * Maximum number of documents sent in one `_bulk_docs` request, so that a write of
   * very many small documents is split as well: the server writes every document of a
   * request before it responds, and an unbounded batch of cheap writes runs into
   * timeouts rather than into the size limit.
   */
  maxDocuments: number;
}

export const DEFAULT_BULK_WRITE_LIMITS: BulkWriteLimits = {
  maxBytes: 4 * 1024 * 1024,
  maxDocuments: 500,
};

/** Shared encoder for {@link jsonByteLength} (creating one per document is wasteful). */
const UTF8_ENCODER = new TextEncoder();

/**
 * The size a document adds to a request body: UTF-8 bytes, not characters.
 *
 * The server limits a request by its bytes, and a single character of a name written
 * in a non-latin script takes several of them - so measuring the string length would
 * under-count exactly the data most likely to be imported in bulk.
 */
function jsonByteLength(object: any): number {
  try {
    return UTF8_ENCODER.encode(JSON.stringify(object)).length;
  } catch {
    // a document that cannot be serialized here cannot be sent either, so it will
    // fail in the request itself; counting it as empty keeps the split from throwing
    // in its place
    return 0;
  }
}

/**
 * Group the documents into batches that each stay within one request's budget.
 *
 * A single document larger than the budget gets a request of its own: it cannot be
 * split, and the limits it is measured against are not the only ones it may pass, so
 * it is left to the server to accept or reject it.
 */
function splitIntoRequests(objects: any[], limits: BulkWriteLimits): any[][] {
  const requests: any[][] = [];
  let current: any[] = [];
  let currentBytes = 0;

  for (const object of objects) {
    const bytes = jsonByteLength(object);
    const exceedsBudget =
      currentBytes + bytes > limits.maxBytes ||
      current.length >= limits.maxDocuments;
    if (current.length > 0 && exceedsBudget) {
      requests.push(current);
      current = [];
      currentBytes = 0;
    }
    current.push(object);
    currentBytes += bytes;
  }

  if (current.length > 0) {
    requests.push(current);
  }
  return requests;
}

/**
 * Write the given documents through `writeRequest`, split across several requests
 * where they do not fit into one (see {@link BulkWriteLimits}).
 *
 * The requests are sent one after the other: the chunks of one call belong to a
 * single user action, so sending them in parallel would only have them compete for
 * connections while the server holds all of their bodies in memory at once.
 *
 * The result reports what became of the documents the way `Database.putAll` does:
 * the results in the order the documents were passed in, a rejection *with* those
 * results when individual documents failed, and a {@link PartialBulkWriteError} when
 * a request failed as a whole after an earlier one had stored documents.
 *
 * @param objects the documents to write
 * @param writeRequest sends one request, following the `Database.putAll` contract
 * @param limits the budgets one request has to stay within
 * @param dbName the database being written to, for the log context
 */
export async function writeInBatchedRequests(
  objects: any[],
  writeRequest: (documents: any[]) => Promise<any[]>,
  limits: BulkWriteLimits,
  dbName: string,
): Promise<any[]> {
  const requests = splitIntoRequests(objects, limits);
  if (requests.length <= 1) {
    // nothing to split, so the write stays a single request in every respect -
    // including a rejection that reaches the caller unchanged
    return writeRequest(objects);
  }

  Logging.debug("putAll: splitting bulk write across several requests", {
    db: dbName,
    documents: objects.length,
    requests: requests.length,
  });

  const results: any[] = [];
  let anyDocumentFailed = false;

  for (const request of requests) {
    try {
      results.push(...(await writeRequest(request)));
    } catch (requestResults) {
      if (!Array.isArray(requestResults)) {
        // the request as a whole failed (offline, rejected, ...), so neither it nor
        // any later one wrote anything - those would run into the same failure.
        const stored = results.filter((result) => result?.ok);
        Logging.debug("putAll: bulk write failed partway", {
          db: dbName,
          documentsStored: stored.length,
          documentsNotStored: objects.length - stored.length,
        });
        // The documents an earlier request did store stay stored, so the failure is
        // reported together with its results: only then can the caller tell what is
        // in the database (see PartialBulkWriteError). Where the earlier requests
        // stored nothing either - every one of their documents failed on its own -
        // there is nothing to report beyond the failure itself.
        throw stored.length > 0
          ? new PartialBulkWriteError(results, requestResults)
          : requestResults;
      }
      // a rejection *with* a results array reports per-document failures (e.g. an
      // unresolved conflict), which concern only their own request - so the
      // remaining documents are still written
      results.push(...requestResults);
      anyDocumentFailed = true;
    }
  }

  return anyDocumentFailed ? Promise.reject(results) : results;
}
