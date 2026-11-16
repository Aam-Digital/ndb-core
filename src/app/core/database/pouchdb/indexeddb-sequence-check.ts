import { errorText } from "#src/app/utils/backend-response";
import { causeChain } from "../../logging/error-classification";
import { Logging } from "../../logging/logging.service";

/**
 * Detecting the corruption of a local database of PouchDB's `indexeddb` adapter
 * that leaves every later write failing (seen after using the app in several tabs).
 *
 * The adapter gives each written document the next number of a sequence counter
 * kept in its metadata record (`seq = ++metadata.seq`), and its document store has
 * a unique index on that number. If the stored counter falls behind the numbers
 * the documents already have (e.g. a tab with an outdated counter wrote its
 * metadata), a write takes a number that exists already: IndexedDB aborts the
 * transaction with a `ConstraintError` ("Unable to add key to index 'seq'" in
 * Chrome, "Index key is not unique" in Safari). The adapter then reads the same
 * counter again, so every following write fails the same way.
 *
 * PouchDB only logs the `ConstraintError` to the console ("Database has a global
 * failure") and rejects the write with a generic `unknown_error` "transaction was
 * aborted", which other failures cause as well (e.g. a document too deeply nested
 * to store). So the stored state is checked instead of the wording.
 */

/** The `indexeddb` adapter's object stores, metadata record and index (see `pouchdb-adapter-indexeddb`). */
const DOC_STORE = "docs";
const META_STORE = "meta";
const META_RECORD_ID = "meta";
const SEQ_INDEX = "seq";

/** PouchDB's reason for a write whose IndexedDB transaction was aborted, whatever the cause. */
const ABORTED_TRANSACTION_REASON = "transaction was aborted";

/** Whether PouchDB rejected the call because its IndexedDB transaction was aborted. */
export function isAbortedTransaction(error: unknown): boolean {
  return causeChain(error).some((e) =>
    errorText(e).includes(ABORTED_TRANSACTION_REASON),
  );
}

/**
 * Whether the local database's stored sequence counter is behind the sequence
 * numbers of its documents, so that every write fails (see above).
 * Only reads the database; `false` for other adapters or if it cannot be read.
 */
export async function hasOutdatedSequenceCounter(
  db: PouchDB.Database,
): Promise<boolean> {
  // properties of a PouchDB instance missing from its type definitions
  const { adapter, prefix } = db as { adapter?: string; prefix?: string };
  if (adapter !== "indexeddb" || !globalThis.indexedDB) {
    return false;
  }
  // PouchDB stores a database under its name with a prefix ("_pouch_")
  const idbName = (prefix ?? "") + db.name;

  let idb: IDBDatabase | undefined;
  try {
    idb = await openExistingDatabase(idbName);
    if (
      !idb.objectStoreNames.contains(DOC_STORE) ||
      !idb.objectStoreNames.contains(META_STORE)
    ) {
      return false;
    }
    const txn = idb.transaction([DOC_STORE, META_STORE], "readonly");
    const [metadata, lastSeqCursor] = await Promise.all([
      request<{ seq?: unknown }>(
        txn.objectStore(META_STORE).get(META_RECORD_ID),
      ),
      request(
        txn.objectStore(DOC_STORE).index(SEQ_INDEX).openKeyCursor(null, "prev"),
      ),
    ]);
    const storedSeq = metadata?.seq;
    const highestSeq = lastSeqCursor?.key;
    return (
      typeof storedSeq === "number" &&
      typeof highestSeq === "number" &&
      highestSeq > storedSeq
    );
  } catch (err) {
    // only a diagnosis: the failure that triggered it is reported by the caller
    Logging.debug("could not check the local database's sequence counter", err);
    return false;
  } finally {
    idb?.close();
  }
}

/**
 * Open the IndexedDB at its current version, without creating it if it does not
 * exist (as the version change of a new database is aborted).
 * The connection closes itself if PouchDB opens the database at a new version
 * (as it does on every reopen), so that it never blocks the adapter.
 */
function openExistingDatabase(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(name);
    openRequest.onupgradeneeded = () => openRequest.transaction?.abort();
    openRequest.onsuccess = () => {
      const idb = openRequest.result;
      idb.onversionchange = () => idb.close();
      resolve(idb);
    };
    openRequest.onerror = () => reject(openRequest.error);
  });
}

function request<T>(idbRequest: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    idbRequest.onsuccess = () => resolve(idbRequest.result);
    idbRequest.onerror = () => reject(idbRequest.error);
  });
}
