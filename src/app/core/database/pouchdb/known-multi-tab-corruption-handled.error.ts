/**
 * Error thrown after known multi-tab IndexedDB corruption was already handled
 * via dedicated recovery UX (dialog).
 *
 * Callers can use this marker to avoid showing duplicate toast warnings.
 */
export class KnownMultiTabCorruptionHandledError extends Error {
  constructor() {
    super("Known multi-tab database corruption handled");
    this.name = "KnownMultiTabCorruptionHandledError";
  }
}

/**
 * Error thrown after a multi-tab usage warning was already shown to the user
 * and the write operation was intentionally blocked.
 */
export class MultiTabOperationBlockedError extends Error {
  constructor() {
    super("Operation blocked because multiple tabs are open");
    this.name = "MultiTabOperationBlockedError";
  }
}
