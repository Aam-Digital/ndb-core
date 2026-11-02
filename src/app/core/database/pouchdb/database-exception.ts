import { NamedError } from "../../logging/reported-errors";

/**
 * This overwrites PouchDB's error class which only logs limited information.
 *
 * It is where errors of the (local or remote) PouchDB enter the app. It takes
 * over the wrapped error's properties (`status`, `reason`, ...), by which it is
 * classified (see `classifyError`), but keeps its own name for stable grouping.
 * A wrapped error of ours is kept as its `cause` instead.
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
    // one of our typed errors (e.g. a ServerError of the remote database's fetch)
    // stays the cause, so that it is still classified by its type
    super("DatabaseException", error?.message || "Database error", {
      cause: error instanceof NamedError ? error : undefined,
    });

    this.entityId = entityId;
    // capture the wrapped error's name before Object.assign / `this.name` erase it
    const originalName = (error as { name?: string })?.name;
    Object.assign(this, error);
    // restore the class name after Object.assign overwrote it with PouchDB's (e.g. "not_found")
    this.name = "DatabaseException";
    if (originalName && originalName !== "DatabaseException") {
      this.originalName = originalName;
    }
  }
}
