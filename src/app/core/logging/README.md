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

Events are filed under the Sentry `environment` "production" for every production build. Deployments
that are not used in production (internal test instances, demos, PR previews) should set
`remoteLoggingEnvironment` in their `config.json`, so that their events can be filtered out of triage.

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

`Logging.warn(message, err)` is reported the same way, only at level `warning`. As a plain message
event, the error would only be extra data that none of the processing below looks at: a failed request
would not count as a connectivity failure, an expired session would not be filtered, and the status
would not be reported. Only a warning without any error is reported as a plain message (see case 4
below). Angular's `HttpErrorResponse` is not an `Error` and counts as "no error" here: whether a
failed response is exceptional is for the code that made the request to decide.

So do not drop the error before logging (a `catchError(() => of(null))` followed by a log call
without it leaves the report impossible to diagnose), and do not pass the same error object twice.

### Log a failure once

Either handle a failure where it is caught (log it, recover, tell the user) or rethrow it — not both.
When the rethrown error reaches a caller that does not catch it either, it is reported a second time as
an unhandled error, under its own and usually less telling title. Likewise, when a service has logged
a failure and only returns a result flag, the component receiving it must not log it again.

As a safety net, `processSentryEvent` drops such an unhandled report when the very same error object
was passed to `Logging` as context before (at any level, including `debug`): that call already decided
how to report it. A failed sync used to show up both as `sync failed` and as `Error: No error message`
this way. Only unhandled events are dropped — logging the same error again on purpose still reports it.

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

   This also applies when a framework re-throws such an error as a generic one — Angular does that
   for anything raised inside a `resource()` loader, wrapping it in an error that copies the message
   and reports the `"Error"` name a subclass inherits. A wrapper that only repeats its cause's
   message contributes nothing but its own stack trace, so the event is grouped by the recognized
   error underneath it (`rewrappedCauseGroupedError`) and lands in the same issue as the unwrapped
   one. A wrapper with a message of its own (`Failed to load configuration from the database.`) says
   more about the failure than its cause does, and stays what the event is grouped by.

   Where the event is grouped by an error further down the chain like this, the thrown error takes
   on that error's type and reported message, as Sentry titles an event by its thrown error: the
   issue would otherwise hold the same problem under two titles.

2. **Network failures** — anything whose chain contains a connectivity error (see
   `isConnectivityErrorMessage`) is collected into the single `network-error` issue. The browser
   raises these at whatever point a request happened to be made, so by stack trace they are an
   open-ended stream of near-identical issues with the same (non-)answer. They are still reported
   rather than dropped, because a server outage surfaces exactly this way — as one issue, whose
   number of affected sessions and deployments is the signal (not its event count, see the cap
   below). For the same reason they are reported at level `warning`, not `error`.
   The browsers' differing wordings would make the merged issue's title flip-flop, so it is
   replaced by a stable one and kept as the searchable `network_error` tag.

   A `DatabaseException` that is itself a connectivity failure goes into this issue as well, even
   though it is a recognized type (case 1): its name only says which layer made the request, and the
   same dropped connection would otherwise have one issue for requests made through PouchDB and
   another for those that failed outside of it. So does a `LoggedError` directly wrapping such a
   `DatabaseException`: every component loading data at that moment logs it under a message of its
   own, which is kept as the `logged_message` tag instead of opening one issue per component.

   The status counts as well as the message: an event whose error carries a gateway status
   (`0`/`502`/`503`/`504`) is a request that never reached the backend, whatever the message says.
   That status is read from `err.status` or, where a library hands on the whole `fetch` Response
   instead of lifting the status out of it, from `err.response.status` — which is how `keycloak-js`
   reports every rejected response, all of them worded `Server responded with an invalid status.`
   The `cause` chain is searched for it, outermost first, as a wrapper that says which operation
   failed usually has no status of its own (the same holds for the `reason`, `entityId` etc. that
   `enrichSentryEvent` reports as extra data).

   A chunk that fails to load counts as one of these: a lazily loaded part of the app not arriving
   means either that the device is offline or that a deployment replaced the chunk the running app
   asks for, and the error says neither which of the two it was nor anything actionable about the
   chunk. Without this they arrive as one issue per browser wording (Chrome's "Failed to fetch
   dynamically imported module", Firefox's "error loading …", Safari's "Importing a module script
   failed") and per chunk URL.

   This runs _after_ case 1 on purpose: a `ConfigLoadError` caused by a failed request is about the
   config load, not about the network, and keeps its own issue. So does a `LoggedError` wrapping a
   chunk that failed to load: during bootstrap that means the app never started, which must not
   disappear among requests of no consequence.

3. **Exceptions reported without a stack** (e.g. an `HttpErrorResponse`) — Sentry falls back to
   grouping those by message, so an id or url interpolated into it opens a new issue every time.
   They are fingerprinted by type and normalized message instead, and _reported_ under that same
   normalized message (`reportNormalized`). Otherwise the issue list still shows the raw one: a row
   per document id, or — where a library quotes a response body into the message, as PouchDB does
   for a proxy error — a whole HTML error page pushing every other row off the screen. The raw
   message stays available as the event's `originalError`.

4. **Message-only events** (`Logging.warn(...)` without an error) group by their normalized message,
   which enforces the
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

An issue's **event count is therefore not a measure of how often a problem occurs.** What to weigh
instead is how many sessions it affects, how many deployments and releases it spans (the `url` and
`release` tags), and whether it is still recurring.

Not the number of affected _users_, which Sentry shows as 0 for every issue: reported events
deliberately carry no user identity, as data minimization under the GDPR. Sentry's own session
counting is anonymous and stays on, so "how many sessions" remains available; "how many users" is a
question this project has chosen not to be able to answer.

Values that go into a fingerprint are normalized (`fingerprintKey`): ids, URLs and numbers are masked,
and punctuation and casing are dropped, so that occurrences of the same problem match even where a
library is inconsistent about them (PouchDB reports both `Unauthorized` and `unauthorized`).

A link of the chain that is itself a connectivity failure is replaced by `network failure`
altogether, in the fingerprint and in the title of a wrapper that keeps its own issue
(`ConfigLoadError: … (caused by DatabaseException: network failure)`): every browser words it
differently (`Failed to fetch` / `Load failed` / ...), so the wrapper would otherwise be one issue per
browser.

When adding a new error type, add its name to `CAUSE_GROUPED_ERROR_TYPES`. What Sentry reports as the
exception type is `error.name || error.constructor.name`, so the name has to be set explicitly and to
a literal — an `Error` subclass otherwise inherits `"Error"` from `Error.prototype` and would silently
fall out of this list, and the constructor name is minified. Both the dedicated classes
(`RegistryLookupError`) and the plain errors that just set `error.name` (`ConfigLoadError`) do this.
An `Error` subclass with neither a name nor a message is reported as `Error: No error message`.
An exception that reaches Sentry with no type at all is listed as `<unknown>`, which says nothing in
a list of issues and hides the message that would — so `enrichSentryEvent` falls back to the generic
`"Error"` for those.

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

### Investigating issues in Sentry

- Issues from one browser session (same `trace` id in the event's context) usually share one root
  cause even when their titles differ: compare trace ids before treating them separately.
- The `environment` tag reads `production` for every production build, including internal test
  instances and PR preview builds, unless their `config.json` sets `remoteLoggingEnvironment` (see
  above). Check the `url` and `release` tags (`pr-…`, `…-master.N`) before treating an issue as
  customer-facing.
- Weigh sessions, deployments and releases rather than the event count (see "One report per issue per
  session").
- Grouping and filtering run in the client, so a change to them only applies to events from clients
  that loaded the new release: cached older app versions keep reporting under the old titles. Check
  the `release` tag before investigating an issue that a change should already have handled.

## Key files

- `logging.service.ts` — `LoggingService` and the `Logging` singleton (`export const Logging = new LoggingService()`); implements the log levels, Sentry forwarding and the `beforeSend` filtering/grouping
- `log-level.ts` — the `LogLevel` definitions
