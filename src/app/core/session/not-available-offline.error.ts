/**
 * Custom error indicating that some functionality (like file access) is not at the moment because the app is offline
 * and that feature is not supported in offline mode.
 */
export class NotAvailableOfflineError extends Error {
  /**
   * @param feature The functionality that was attempted but is not available offline.
   */
  constructor(feature: string) {
    super("Functionality not available offline: " + feature);
  }
}
