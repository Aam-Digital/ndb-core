/**
 * Custom error indicating that Remote Auth Server cannot be reached.
 *
 * The original underlying error (e.g. a fetch failure, a 504 response, or
 * an RxJS `TimeoutError` from a bounded operation) is preserved on `cause`
 * so that callers can distinguish transient infra failures (which are worth
 * retrying) from genuinely unavailable setups (e.g. browser is offline).
 */
export class RemoteLoginNotAvailableError extends Error {
  constructor(public override readonly cause?: unknown) {
    super("Remote login currently unavailable.");
    Object.setPrototypeOf(this, RemoteLoginNotAvailableError.prototype);
  }
}
