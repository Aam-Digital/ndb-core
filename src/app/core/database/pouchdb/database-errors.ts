import {
  ErrorClassification,
  registerTypedError,
  TypedError,
  TypedErrorOptions,
} from "../../logging/error-classification";

/**
 * The typed errors of the database: converted from PouchDB's and IndexedDB's
 * raw errors by `toTypedDatabaseError` (see `pouchdb-errors.ts`), a write
 * conflict also by the HTTP interceptor.
 */

/** A write was rejected because the document has changed in the meantime (409). */
export class WriteConflictError extends TypedError {
  static readonly errorName = "WriteConflictError";
  static override readonly classification: ErrorClassification =
    "write-conflict";

  constructor(message: string, options?: TypedErrorOptions) {
    super(WriteConflictError.errorName, message, options);
  }
}
registerTypedError(WriteConflictError);

/** The device's local database (IndexedDB underneath PouchDB) is broken. */
export class LocalStorageError extends TypedError {
  static readonly errorName = "LocalStorageError";
  static override readonly classification: ErrorClassification =
    "local-storage";

  constructor(message: string, options?: TypedErrorOptions) {
    super(LocalStorageError.errorName, message, options);
  }
}
registerTypedError(LocalStorageError);
