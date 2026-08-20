# How to log errors

This Guide considers logging of errors and information that is necessary for developers in debugging and monitoring.
Refer to the _Display Dialogs and Notifications_ guide
regarding ways to inform the user about errors or other events.

## Logging things

Production code (whatever is merged into the `master` branch) should not contain any calls to `console.log()`.
Instead, to log information for analysis and debugging (without explicit notification to the user)
use the `Logging` object.
This way, all logging is done in a consistent manner and can be transferred to the remote monitoring or saved in some other way:

```ts
someFun() {
  Logging.error('some error information');
}
```

The `LoggingService` has multiple log levels (`debug`, `info`, `warn`, `error`)
that control whether log messages are sent to the remote monitoring and how they are treated there.

## Remote Logging

Higher log levels (`warn` and `error`) are forwarded to our remote monitoring service, [Sentry](https://sentry.io/).

### Keep message strings static

How messages are grouped there depends on the (static) message text, so keep `Logging.warn()` / `Logging.error()`
message strings constant and pass variable data as additional context arguments:

```ts
// don't - one separate issue per entity type, and the details are lost from the title
Logging.warn(`Config references unknown entity type "${config.entity}"`);

// do - one issue for the problem, details available in the event's "context"
Logging.warn("Config references an unknown entity type", {
  entityType: config.entity,
});
```

For thrown `Error`s, which reach the monitoring through Angular's `ErrorHandler`, whether the message
affects grouping depends on whether the error type is fingerprinted — see below. Either way it is the
issue title, so the readability rule always applies. Never interpolate `this.constructor.name` into
one: it is minified in production, and because the message is built when the error is created, source
maps cannot repair it the way they repair a stack trace. Such a report permanently reads
`not registered in u`.

### Grouping by error chain

Sentry groups errors **by their stack trace** whenever one is available — the exception message is not
part of the grouping key then. (You can confirm this on any issue that holds events with several
different `error.value`s.) So for a thrown error, rewording the message changes the issue title but
never splits or merges issues; only a fingerprint does.

Stack-based grouping is counterproductive for our own wrapper error classes (`DatabaseException`,
`ConfigLoadError`, ...): they are thrown from one central place but reached from many components and
routes, so a single problem scatters across a dozen issues - and archiving one of them does not
silence the others.

`processSentryEvent` (the `beforeSend` hook) therefore sets an explicit `fingerprint` for the error types
listed in `CAUSE_GROUPED_ERROR_TYPES`, built from the thrown error plus its root cause instead of the stack.
Ids, URLs and numbers are masked so that occurrences of the same problem match. The route stays available
as the `transaction` tag, so failures can still be filtered by where they happened.

When adding a new error type, add its name to `CAUSE_GROUPED_ERROR_TYPES`. What Sentry reports as the
exception type is `error.name || error.constructor.name`, so the name has to be set explicitly and to
a literal — an `Error` subclass otherwise inherits `"Error"` from `Error.prototype` and would silently
fall out of this list, and the constructor name is minified. Both the dedicated classes
(`RegistryLookupError`) and the plain errors that just set `error.name` (`ConfigLoadError`) do this.

Fingerprinting inverts the message rule stated above: once an error is fingerprinted its message _is_
part of the grouping key, so whatever stays in it becomes a deliberate grouping dimension. Interpolate
a value there only when both hold:

- its cardinality is **bounded** — a component name or entity type, not a user id, URL or document revision;
- each distinct value is a **separately actionable bug**, so a separate issue is what you want.

`RegistryLookupError` and `RegistryDuplicateError` keep the registry name and the requested key in
their message on exactly that basis: a missing `Event` component and a missing `Child` entity are
separate problems to fix, while everything they had in common — which component, pipe or route
happened to trigger the lookup — is what the fingerprint now collapses. Note that values are still
normalized, so keys differing only in digits would collide.

Generic errors (`Error`, `TypeError`, ...) must keep the default grouping - for those the stack trace
is the only thing telling two unrelated bugs apart.

Note that changing a fingerprint does not re-group events already in Sentry: existing issues stay as they
are and the new grouping applies to events reported from then on.

## Key files

- `logging.service.ts` — `LoggingService` and the `Logging` singleton (`export const Logging = new LoggingService()`); implements the log levels, Sentry forwarding and the `beforeSend` filtering/grouping
- `log-level.ts` — the `LogLevel` definitions
