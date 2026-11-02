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

  /**
   * The `name` of the underlying error that was wrapped (e.g. "AbortError",
   * "TimeoutError", "not_found"). Preserved separately because {@link name} is
   * deliberately kept as "DatabaseException" for stable Sentry grouping — which
   * would otherwise erase the original name and hide that a failure is actually
   * a transient network abort.
   */
  originalName?: string;

  constructor(
    error: PouchDB.Core.Error | { message: string; [key: string]: any },
    entityId?: string,
  ) {
    super("DatabaseException", error?.message || "Database error", {
      classification: classifyError(error),
    });

    this.entityId = entityId;
    // Capture the wrapped error's name before Object.assign / `this.name` erase it.
    const originalName = (error as { name?: string })?.name;
    Object.assign(this, error);
    // Restore class name after Object.assign overwrites it with PouchDB's name (e.g. "not_found")
    this.name = "DatabaseException";
    if (originalName && originalName !== "DatabaseException") {
      this.originalName = originalName;
    }
  }
}
