import { LoggedError, NamedError } from "./reported-errors";

/**
 * What kind of failure an error is, declared by its {@link TypedError} class (see
 * {@link classifyError}); what remote monitoring does with each is `REPORTING_POLICY`.
 * Foreign errors are converted into typed errors where they enter the app, by the
 * module they belong to, which also defines the typed classes it creates (each
 * documents what its kind of failure is).
 */
const ERROR_CLASSIFICATIONS = [
  "connectivity",
  "session-expired",
  "not-permitted",
  "local-storage",
  "server-error",
  "write-conflict",
] as const;
export type ErrorClassification = (typeof ERROR_CLASSIFICATIONS)[number];

/** What a typed error keeps of the foreign failure it was converted from. */
export interface TypedErrorOptions {
  /** the HTTP status of the failed request */
  status?: number;
  /** the original (foreign) error */
  cause?: unknown;
  details?: Record<string, unknown>;
}

/**
 * A failure of a known kind, converted from a foreign error where it entered the
 * app. Each subclass passes its name (a literal: class names are minified) and
 * its kind of failure to this constructor.
 */
export abstract class TypedError extends NamedError {
  /**
   * The kind of failure: an own property, so that a copy of the error that lost
   * its class (as PouchDB's `createError()` makes) still has it.
   */
  readonly classification: ErrorClassification;

  /** The HTTP status of the failed request, if any. */
  readonly status?: number;

  protected constructor(
    name: string,
    classification: ErrorClassification,
    message: string,
    options?: TypedErrorOptions,
  ) {
    super(name, message, options);
    this.classification = classification;
    this.status = options?.status;
  }
}

/**
 * What kind of failure the given error is, judged by this one error (not its
 * `cause`s): a typed error, also a copy of one that lost its class. Any other
 * error is not classified: foreign errors are converted where they enter the app.
 */
export function classifyError(error: unknown): ErrorClassification | undefined {
  const classification = (error as { classification?: unknown } | undefined)
    ?.classification;
  return ERROR_CLASSIFICATIONS.find((c) => c === classification);
}

/**
 * A request that never reached our backend or Keycloak: a `ConnectivityError`,
 * also when wrapped (as `cause`). A failed request to another service stays an
 * `HttpErrorResponse`: check its status (e.g. `0`) with `failedHttpResponse()`.
 * A server error (500) is not a connectivity failure: the server was reached and failed.
 */
export function isConnectivityError(err: unknown): boolean {
  return classifyErrorChain(err) === "connectivity";
}

/**
 * The permission rules exclude the record or type for the current user:
 * a `NotPermittedError`, also when wrapped (as `cause`). Not an expired session
 * or another `401` (e.g. an invalid token signature), which must keep being reported.
 */
export function isNotPermittedError(err: unknown): boolean {
  return classifyErrorChain(err) === "not-permitted";
}

/**
 * The classification of the first error in the `cause` chain that has one,
 * outermost first: a boundary's typed error wins over the raw error it wraps.
 * @param classify of each error (remote monitoring adds unconverted foreign errors)
 */
export function classifyErrorChain(
  error: unknown,
  classify: (error: unknown) => ErrorClassification | undefined = classifyError,
): ErrorClassification | undefined {
  for (const link of causeChain(error)) {
    const classification = classify(link);
    if (classification) {
      return classification;
    }
  }
  return undefined;
}

/** The error and the `cause`s it wraps, outermost first (cycle-safe, max 6 levels). */
export function causeChain(error: unknown): unknown[] {
  const chain: unknown[] = [];
  let current = error;
  while (
    current &&
    (typeof current === "object" || typeof current === "string") &&
    !chain.includes(current) &&
    chain.length <= 5
  ) {
    chain.push(current);
    current = (current as { cause?: unknown }).cause;
  }
  return chain;
}
