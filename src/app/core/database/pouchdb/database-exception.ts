import { NamedError } from "../../logging/reported-errors";
import {
  classifyError,
  classifyResponseStatus,
  createTypedError,
} from "../../logging/error-classification";

/**
 * This overwrites PouchDB's error class which only logs limited information.
 *
 * It is where errors of the (local or remote) PouchDB enter the app: a raw
 * error that is one of the classified failures is converted into its typed
 * error (see {@link toTypedDatabaseError}), which is kept as the `cause`, as is
 * a typed error thrown by our own code underneath (e.g. a `ServerError` of the
 * remote database's fetch). It takes over the wrapped error's properties
 * (`status`, `reason`, ...), so that callers can keep checking them, but keeps
 * its own name for stable grouping.
 */
export class DatabaseException extends NamedError {
  entityId?: string;

  /**
   * The `name` of the wrapped error (e.g. "AbortError", "indexed_db_went_bad"),
   * which tells what kind of failure it is, while {@link name} stays "DatabaseException".
   */
  originalName?: string;

  constructor(
    error: PouchDB.Core.Error | { message: string; [key: string]: any },
    entityId?: string,
  ) {
    const typed = toTypedDatabaseError(error);
    const cause = typed instanceof NamedError ? typed : undefined;
    super(
      "DatabaseException",
      cause?.message || error?.message || "Database error",
      {
        cause,
      },
    );

    this.entityId = entityId;
    // capture the wrapped error's name before Object.assign / `this.name` erase it
    const originalName = (error as { name?: string })?.name;
    Object.assign(this, error);
    // restore the class name after Object.assign overwrote it with PouchDB's (e.g. "not_found")
    this.name = "DatabaseException";
    if (cause) {
      // passes on the typed error (see `classifyError`)
      this.message = cause.message;
    }
    if (originalName && originalName !== "DatabaseException") {
      this.originalName = originalName;
    }
  }
}

type RawDatabaseError = {
  status?: unknown;
  name?: unknown;
  message?: unknown;
  reason?: unknown;
  error?: unknown;
};

/**
 * The typed error (see `error-classification.ts`) for an error of PouchDB or of the
 * IndexedDB underneath it, keeping the raw error as its `cause` and its `status`:
 * - by its status and the reason the server gave (401 expired / not permitted, 403, 409);
 * - by its name and wording (a broken IndexedDB, an aborted request, a conflict);
 * - an error of ours that PouchDB's replication copied, losing its class, by its name.
 *
 * Any other error is returned unchanged (e.g. a `404 missing`), as is one of our
 * errors (e.g. a `ConnectivityError` of the remote database's fetch).
 */
export function toTypedDatabaseError(error: unknown): unknown {
  if (!error || typeof error !== "object" || error instanceof NamedError) {
    return error;
  }
  const raw = error as RawDatabaseError;
  const classification =
    classifyResponseStatus(raw.status, [raw.reason, raw.error, raw.message]) ??
    classifyError(error);
  if (!classification) {
    return error;
  }
  return createTypedError(
    classification,
    textOf(raw.message) || textOf(raw.reason) || "Database error",
    {
      status: typeof raw.status === "number" ? raw.status : undefined,
      cause: error,
    },
  );
}

function textOf(value: unknown): string {
  return typeof value === "string" ? value : "";
}
