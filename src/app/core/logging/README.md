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

### Log an error together with a message

Pass the caught error as a context argument rather than logging it on its own:

```ts
// don't - the issue is titled by whatever the library called it ("Error: Failed to fetch"),
// which says nothing about what the app was doing, and groups by the call site's stack
Logging.error(err);

// do
Logging.error("Could not download file", err);
```

`Logging.error(message, err)` reports the message as the error (wrapped in a `LoggedError`) and keeps
the original as its `cause`. Sentry links a `cause` into the reported exception chain, so the original
error and its stack trace are still in the event — but the title and the grouping now come from the
message, which is stable across releases and identical for every call site logging that same problem.

### How events are grouped

Sentry groups errors **by their stack trace** whenever one is available — the exception message is not
part of the grouping key then. (You can confirm this on any issue that holds events with several
different `error.value`s.) So for a thrown error, rewording the message changes the issue title but
never splits or merges issues; only a fingerprint does.

`processSentryEvent` (the `beforeSend` hook) therefore sets an explicit `fingerprint` where the stack
is the wrong key. It checks the cases most-specific first, in `groupSentryEvent`:

1. **By error chain** — for the error types listed in `CAUSE_GROUPED_ERROR_TYPES` and for
   `LoggedError` (see above), the fingerprint is built from the thrown error plus its root cause
   instead of the stack. These are thrown from one central place but reached from many components and
   routes, so stack-based grouping scatters one problem across a dozen issues — and archiving one of
   them does not silence the others. The route stays available as the `transaction` tag, so failures
   can still be filtered by where they happened.

   Because the root cause is part of the key, it is also appended to the reported message
   (`Failed to load configuration. (caused by DatabaseException: Unknown kid)`): several issues would
   otherwise share one title and could only be told apart by opening each of them.

2. **Network failures** — anything whose chain contains a connectivity error (see
   `isConnectivityErrorMessage`) is collected into the single `network-error` issue. The browser
   raises these at whatever point a request happened to be made, so by stack trace they are an
   open-ended stream of near-identical issues with the same (non-)answer. They are still reported
   rather than dropped, because a server outage surfaces exactly this way — as one issue, whose
   number of affected users and sessions is the signal (not its event count, see the cap below).
   The browsers' differing wordings would make the merged issue's title flip-flop, so it is
   replaced by a stable one and kept as the searchable `network_error` tag.

   This runs _after_ case 1 on purpose: a `ConfigLoadError` caused by a failed request is about the
   config load, not about the network, and keeps its own issue.

3. **Exceptions reported without a stack** (e.g. an `HttpErrorResponse`) — Sentry falls back to
   grouping those by message, so an id or url interpolated into it opens a new issue every time.
   They are fingerprinted by type and normalized message instead.

4. **Message-only events** (`Logging.warn(...)`) group by their normalized message, which enforces the
   "keep message strings static" rule above: a message that does interpolate variable data still
   produces one issue instead of one per value.

Otherwise the event keeps Sentry's default grouping: for a generic error (`Error`, `TypeError`, ...)
with a stack, that stack is the only thing telling two unrelated bugs apart.

### One report per issue per session

An error thrown on every change detection cycle would otherwise send thousands of identical events,
so `isExcessiveRepeat` caps each issue at `MAX_REPEATED_SENTRY_EVENTS` per page load — keyed on the
fingerprint, which is why grouping runs before the cap. Budgeting more coarsely than per issue
starves issues that merely share a cause: while a device is on a flaky connection, one connectivity
failure is the root cause of the config load, the permission rules, the sync and every file download
alike, and whichever of them failed first would silence all the others.

An issue's **event count is therefore not a measure of how often a problem occurs** — how many users
and sessions it affects is.

Values that go into a fingerprint are normalized (`fingerprintKey`): ids, URLs and numbers are masked,
and punctuation and casing are dropped, so that occurrences of the same problem match even where a
library is inconsistent about them (PouchDB reports both `Unauthorized` and `unauthorized`).

A link of the chain that is itself a connectivity failure is replaced by `network failure`
altogether, in the fingerprint and in the title: every browser words it differently
(`Failed to fetch` / `Load failed` / ...), so a `DatabaseException` would otherwise be one issue per
browser. For the same reason a network failure wrapping a network failure is treated as one link —
which of the two the chain happens to include says nothing about the problem.

When adding a new error type, add its name to `CAUSE_GROUPED_ERROR_TYPES`. What Sentry reports as the
exception type is `error.name || error.constructor.name`, so the name has to be set explicitly and to
a literal — an `Error` subclass otherwise inherits `"Error"` from `Error.prototype` and would silently
fall out of this list, and the constructor name is minified. Both the dedicated classes
(`RegistryLookupError`) and the plain errors that just set `error.name` (`ConfigLoadError`) do this.
An `Error` subclass with neither a name nor a message is reported as `Error: No error message`.

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

Note that changing a fingerprint does not re-group events already in Sentry: existing issues stay as they
are and the new grouping applies to events reported from then on. To see the effect of a change, the
issues it replaces have to be archived once the release carrying it is rolled out.

## Key files

- `logging.service.ts` — `LoggingService` and the `Logging` singleton (`export const Logging = new LoggingService()`); implements the log levels, Sentry forwarding and the `beforeSend` filtering/grouping
- `log-level.ts` — the `LogLevel` definitions
