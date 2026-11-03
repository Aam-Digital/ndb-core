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

The browser console links every message to the line in `logging.service.ts`
that writes it. To see the code that called `Logging` instead, add
`logging\.service\.ts$` as a custom pattern to the ignore list of the
browser's developer tools (Chrome: DevTools Settings > Ignore list >
Add pattern; Firefox: "Ignore source" in the Debugger).
The expandable stack trace of the message also shows the caller.

## Deciding what to report

A Sentry issue should mean "a developer has something to fix". Before adding a log call, decide
who has to act on the failure:

- **Bug in our code** (e.g. a `TypeError` in a template, an id built with the wrong entity type):
  report it with `Logging.error`, or let it throw.
- **Server or infrastructure fault** (e.g. an unexpected `400`/`5xx` from our own backend):
  report it with `Logging.warn`, including the response, and tell the user the action failed.
- **User or device environment** (e.g. offline or flaky connection, expired session, a record the
  user may not read, a browser permission the user denied such as clipboard or notifications):
  do not report it (`Logging.debug`); tell the user what happened and what they can do.
- **Instance configuration or data problem** (e.g. an unknown `dataType`, icon or validator in the
  config; a permission rule variable for an account without a linked profile; a file field pointing
  to a missing file): report it with `Logging.warn`, with a static message and the offending value
  in the context. If it would recur on every page load, report it once per session. Also make it
  visible to admins in the UI where possible, and validate the config when it is saved.
- **Optional feature not set up for the instance** (e.g. push notifications without a Firebase
  config): this is not a problem, do not report it (`Logging.debug`).

Rules that keep one root cause in one Sentry issue (see also "Log an error together with a message"
and "Log a failure once" below):

- **Never leave a promise floating.** An `async` call inside `subscribe()`, an effect or an event
  handler needs `await` or `.catch()`. Otherwise an expected failure reaches Angular's
  `ErrorHandler` and is reported as a separate, unhandled issue.
- **Classify failures with the shared helpers**, not with ad-hoc status checks per component:
  `isConnectivityError()` (`src/app/utils/connectivity-error.ts`), `isExpiredSessionError()`
  (`src/app/utils/expired-session-error.ts`) and `isNotPermittedError()`
  (`src/app/utils/not-permitted-error.ts`). A component that only treats `404` as expected
  logs every dropped connection as a warning of its own, and cannot tell the user what happened.
- **Check whether an optional feature is configured before using it** (e.g. push notifications
  without a Firebase config) instead of logging its failure on every page load.
- **A known limitation is not an event.** If something fails on every sync or render for a known
  reason (e.g. `purge()` on the legacy `idb` adapter), check the capability up front.
- **Expect config values of the wrong type.** The config is plain JSON edited by admins; a template
  or `computed()` must not crash because a value is not of the type its interface declares.

### Which level to use

`warn` and `error` go to Sentry, `debug` and `info` only to the browser console. Decide per call site:

- **Keep `warn`** for an unexpected but handled situation that a developer or support has to act on:
  - a code defect, or a data or config inconsistency (if it would recur on every page load, report
    it once per session, e.g. an invalid locale);
  - a risk of data loss: the local database lost or evicted, user data that could not be saved for a
    reason other than permissions or connectivity;
  - a permission inconsistency that indicates a bug (e.g. the server refusing docs the client let the
    user change);
  - a deliberate audit event the team relies on (e.g. a user-confirmed reset of application data),
    with a static message.
- **Use `debug`** for expected operational conditions: offline or connectivity failures, an expired
  session, a record the user may not read, an external service being unavailable (e.g. the address
  lookup, the GitHub releases API for "latest changes"), a normal fallback path (e.g. loading all
  records when an index cannot be used), a known limitation (e.g. `purge()` on the `idb` adapter),
  purely informational traces, and anything the UI already tells the user with nothing for
  developers to fix.
- **Do not downgrade a whole catch block** that mixes both: classify the error with the helpers above
  and log only the expected cases at `debug`, keeping `warn` for the rest.
- **Do not rethrow** an error after telling the user about it, unless the caller handles it: it is
  reported again as an unhandled error.

## Remote Logging

Higher log levels (`warn` and `error`) are forwarded to our remote monitoring service, [Sentry](https://sentry.io/).

Remote logging is off unless the deployment sets the DSN of its Sentry project as `remoteLoggingDsn` in
its `assets/config.json` (the file that overrides the `environment` at startup, see
`src/bootstrap-environment.ts`). No build ships a default DSN, so a deployment without it reports
nothing and only logs to the browser console:

```json
{
  "remoteLoggingDsn": "https://<key>@<org>.ingest.sentry.io/<project>"
}
```

The default `CSP` of the Docker image allows `https://*.sentry.io`; a Sentry on another host (e.g. self-hosted)
must be added to `CSP` (see the build README), otherwise its requests violate the Content Security Policy.

The DSN is read after `config.json` has loaded, so errors before that (including a failure to load
`config.json` itself) are never reported.

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
affects grouping depends on whether it is one of our named errors — see below. Either way it is the
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

`Logging.error(message, err)` and `Logging.warn(message, err)` report the message as the error (a
`LoggedError`) with the original as its `cause`, so the original error and its stack trace stay in the
event, and the grouping and filtering below apply to it. Logged without an error, the message is
reported as a plain message event, grouped by its text. An `HttpErrorResponse` is not an `Error` and
counts as "no error" here. So do not drop the error before logging (a `catchError(() => of(null))`
followed by a log call without it leaves the report impossible to diagnose), and do not pass the same
error object twice.

### Log a failure once

Either handle a failure where it is caught (log it, recover, tell the user) or rethrow it — not both.
When the rethrown error reaches a caller that does not catch it either, it is reported a second time as
an unhandled error, under its own and usually less telling title. Likewise, when a service has logged
a failure and only returns a result flag, the component receiving it must not log it again.

### Our own errors: `NamedError`

Extend `NamedError` (`reported-errors.ts`) for an error whose name and message identify the problem on
their own, no matter which component ran into it — e.g. `ConfigLoadError`, `SyncStalledError`,
`DatabaseException`, `RegistryLookupError`. Remote monitoring groups these by name, message and root
cause instead of by stack trace, which would open one issue per call site (and per build).

- Pass the name as a literal: the class name is minified in production builds.
- Keep the message free of ids and other variable data, and pass them as `details` instead: they are
  reported as extra data, without splitting the issue.
- Do not use it for generic errors (`TypeError`, ...): for those, the stack trace is the only thing
  telling two unrelated bugs apart.
- A failure that is only logged, not thrown, needs no name: `Logging.error(message, err)` is grouped
  the same way. Name it only where a network failure must keep an issue of its own because the app
  cannot continue (`AppBootstrapError`, `ConfigLoadError`).

### Typed errors: classifying failures where they enter the app

Foreign errors are converted into typed errors where they enter the app, by the knowledge of the module
they belong to: the database layer (`DatabaseException`, `pouchdb-errors.ts`), `typedHttpErrorInterceptor`
for requests to our backend (`/db`, `/api`) and `KeycloakAuthService`, sharing what our backend's
responses mean (`src/app/utils/backend-response.ts`). Each typed class extends `TypedError`
(`error-classification.ts`), declares its kind of failure as `static classification` and lives in the
module that creates it: `ConnectivityError` and `ServerError` in `src/app/utils/backend-errors.ts`,
`NotPermittedError` in `core/permissions/`, `SessionExpiredError` in `core/session/`,
`WriteConflictError` and `LocalStorageError` in `core/database/pouchdb/database-errors.ts`.
Everything else judges an error by its type (`classifyError()`). Only remote monitoring also recognizes
the few foreign errors that reach it uncaught, e.g. a failed chunk load
(`uncaught-error-classification.ts`). For a new kind of failure, extend one of the typed classes.

- **Check for a kind of failure** with `isConnectivityError()`, `isNotPermittedError()` or
  `isExpiredSessionError()` (`src/app/utils/`), which apply this classification to the whole `cause`
  chain, never with ad-hoc status checks.
- **Read a failed HTTP response** with `failedHttpResponse(err)` (`src/app/utils/failed-http-response.ts`),
  never with `instanceof HttpErrorResponse` (a lint rule enforces this): a failed request to our backend
  with a classified status (no response, 401 expired or not permitted, 403, 409, 5xx) arrives as a typed
  error, with the `HttpErrorResponse` as its `cause`. Other statuses (e.g. 400, 404) and other services
  stay an `HttpErrorResponse`.

What remote monitoring does with each kind (`REPORTING_POLICY` in `sentry-event-processing.ts`):

| Classification    | Reported                                                                              |
| ----------------- | ------------------------------------------------------------------------------------- |
| `connectivity`    | one shared `network-error` issue, as warning; not while offline                       |
| `server-error`    | at the logged level, one issue per status and endpoint                                |
| `not-permitted`   | as a warning if logged with a message or unhandled; dropped if logged without message |
| `local-storage`   | the first event of the page load, tagged `incident: local-db`                         |
| `session-expired` | no: the user is told                                                                  |
| `write-conflict`  | no: normal for an offline-first app, counted in usage analytics                       |

### How events are grouped and filtered

Sentry groups errors by their stack trace, so rewording a message changes an issue's title but never
splits or merges issues; only a fingerprint does. `processSentryEvent` (the `beforeSend` hook) sets one
where the stack is the wrong key, see `sentry-grouping.ts` for the rules:

- Our errors (a `NamedError` or a logged message) wrapping another error are grouped by the error and the
  root cause of the `cause` chain, so a generic root cause (a `missing` document, a `TypeError`) in
  another component gets an issue and alert of its own.
- A classified root cause that means the same wherever it occurs (a broken local database, not
  permitted, a server error, which also by its status and endpoint) is grouped by the root cause alone,
  with the reporting component as the `reported_by` tag.
- A request that never reached the server goes into the one network issue, unless a named error
  wrapping it says the app could not continue (e.g. `AppBootstrapError`).
- Errors without a stack and message events are grouped by their message, with ids, URLs and numbers
  masked (`fingerprintKey`).

It also adds the error's `status`, `reason`, `entityId` and `details` as extra data, and drops an
unhandled error raised only by a script inlined into the page (e.g. injected by an in-app browser).
Changing the grouping does not re-group events already in Sentry: archive the issues it replaces once
the release carrying it is rolled out.

### Each failure is reported once per page load

`reportOnce` (`report-once.ts`) turns a repeat of a failure already reported in this page load into a
breadcrumb: the same error object (e.g. logged, then rethrown), a broken local database or the network
issue after their first event, and any other issue after `MAX_REPEATED_SENTRY_EVENTS` events (against
error loops). An issue's **event count is therefore not a measure of how often a problem occurs**: weigh
how many sessions, deployments (the `url` tag) and releases it affects instead. Sentry shows 0 affected
users, as events deliberately carry no user identity (data minimization under the GDPR).

### Investigating issues in Sentry

- Issues from one browser session (same `trace` id in the event's context) usually share one root
  cause even when their titles differ: compare trace ids before treating them separately.
- The `environment` tag reads `production` for every production build, including internal test
  instances and PR preview builds, unless their `config.json` sets `remoteLoggingEnvironment` (see
  above). Check the `url` and `release` tags (`pr-…`, `…-master.N`) before treating an issue as
  customer-facing.
- Grouping and filtering run in the client, so a change to them only applies to events from clients
  that loaded the new release: cached older app versions keep reporting under the old titles. Check
  the `release` tag before investigating an issue that a change should already have handled.

## Key files

- `logging.service.ts` — `LoggingService` and the `Logging` singleton; the log levels and how a log call is reported
- `reported-errors.ts` — `NamedError` and `LoggedError`, the errors remote monitoring groups by message
- `error-classification.ts` — `TypedError`, the base of the typed errors, and `classifyError()`
- `uncaught-error-classification.ts` — the foreign errors recognized only when they reach remote monitoring uncaught
- `sentry-event-processing.ts` — the `beforeSend` hook: details, the reporting policy per classification
- `sentry-grouping.ts` — the grouping rules and message normalization
- `report-once.ts` — turning repeated reports of one failure into breadcrumbs
- `log-level.ts` — the `LogLevel` definitions
- `src/app/utils/failed-http-response.ts`, `src/app/utils/*-error.ts` — helpers to read and classify failed requests
- `src/app/utils/typed-http-error.interceptor.ts`, `src/app/utils/backend-response.ts` — the HTTP boundary and what our backend's responses mean
