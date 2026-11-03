/**
 * Custom error indicating that Remote Auth Server cannot be reached.
 *
 * The underlying error (a `ConnectivityError` for a fetch failure, a gateway
 * status or a timed-out operation, see `toTypedKeycloakError`) is preserved on
 * `cause` so that callers can distinguish transient infra failures (which are
 * worth retrying) from genuinely unavailable setups (e.g. browser is offline).
 */
export class RemoteLoginNotAvailableError extends Error {
  constructor(public override readonly cause?: unknown) {
    super("Remote login currently unavailable.");
  }
}
