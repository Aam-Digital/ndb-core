/**
 * Custom error indicating that Remote Auth Server cannot be reached.
 */
export class RemoteLoginNotAvailableError extends Error {
  constructor() {
    super("Remote login currently unavailable.");
    Object.setPrototypeOf(this, RemoteLoginNotAvailableError.prototype);
  }
}
