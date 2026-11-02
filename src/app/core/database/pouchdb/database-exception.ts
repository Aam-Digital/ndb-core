import { NamedError } from "../../logging/reported-errors";
import { classifyError } from "../../logging/error-classification";

/**
 * This overwrites PouchDB's error class which only logs limited information.
 *
 * It is where errors of the (local or remote) PouchDB enter the app, so it also
 * records what kind of failure the wrapped error is (`classification`, e.g. a
 * broken local database or a request the permission rules refused).
 */
export class DatabaseException extends NamedError {
  entityId?: string;

  constructor(
    error: PouchDB.Core.Error | { message: string; [key: string]: any },
    entityId?: string,
  ) {
    super("DatabaseException", error?.message || "Database error", {
      classification: classifyError(error),
    });

    this.entityId = entityId;
    Object.assign(this, error);
    // Restore class name after Object.assign overwrites it with PouchDB's name (e.g. "not_found"),
    // keeping it stable for grouping; the wrapped error's kind is kept in `classification`
    this.name = "DatabaseException";
  }
}
