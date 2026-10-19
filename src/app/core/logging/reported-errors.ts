/**
 * An error of ours whose name and message identify the problem on their own,
 * no matter which component or call site ran into it.
 *
 * Remote monitoring groups it by name, message and root cause instead of by
 * stack trace, and reports its `details` as extra data (see the logging README).
 * Pass the name as a literal: the class name is minified in production builds.
 */
export class NamedError extends Error {
  /** Context for the report, kept out of the message so that it does not split the issue. */
  readonly details?: Record<string, unknown>;

  constructor(
    name: string,
    message: string,
    options?: { cause?: unknown; details?: Record<string, unknown> },
  ) {
    super(
      message,
      options?.cause === undefined ? undefined : { cause: options.cause },
    );
    this.name = name;
    this.details = options?.details;
  }
}

/**
 * What `Logging.error(message, err)` / `Logging.warn(message, err)` report:
 * the logged message as the error, with the logged error as its `cause`.
 *
 * Named "Error", so that titles read "Error: <message>"; remote monitoring
 * recognizes it by class instead.
 */
export class LoggedError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "Error";
  }
}
