# How to log errors

This guide covers logging for debugging and monitoring. Refer to the _Display Dialogs and Notifications_
guide for ways to inform the user about errors or other events.

## Logging things

Production code does not call `console.log()`, but uses the `Logging` object. It has the levels `debug`,
`info`, `warn` and `error`. Only `warn` and `error` (and every unhandled error) go to remote monitoring;
`debug` and `info` only to the browser console.

The browser console links every message to the line in `logging.service.ts` that writes it. To see the
code that called `Logging` instead, add `logging\.service\.ts$` to the ignore list of the browser's
developer tools (Chrome: DevTools Settings > Ignore list; Firefox: "Ignore source" in the Debugger).

## Deciding what to report

A Sentry issue should mean "a developer has something to fix". Before adding a log call, decide who has
to act on the failure:

| Situation                                                                                                                                                                                                    | Level                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Bug in our code (a `TypeError` in a template, an id built with the wrong entity type)                                                                                                                        | `error`, or let it throw                                                                            |
| Server or infrastructure fault (an unexpected `400`/`5xx` from our backend)                                                                                                                                  | `warn` with the response; tell the user the action failed                                           |
| Instance configuration or data problem (an unknown `dataType` or validator in the config, a permission rule variable for an account without linked profile)                                                  | `warn` with a static message and the offending value as context; once per session if it would recur |
| Risk of data loss, a permission inconsistency pointing to a bug, a deliberate audit event (e.g. a confirmed reset of application data)                                                                       | `warn`                                                                                              |
| The user's environment: offline, expired session, a record the user may not read, an edit conflict, a browser permission the user denied                                                                     | `debug`; tell the user what happened and what they can do                                           |
| An external service unavailable (address lookup, GitHub releases API), a normal fallback, a known limitation (`purge()` on the `idb` adapter), an optional feature not set up (push without Firebase config) | `debug`                                                                                             |
| A reference the UI falls back from on its own (a file field pointing to a missing attachment, an unknown icon)                                                                                               | `debug`                                                                                             |

In a catch block, use `Logging.warnUnlessExpected(message, err, ...context)` (or `errorUnlessExpected`): it
logs at `debug` if the error is a failure of the user's environment (`isExpectedFailure()`: offline,
expired session, missing permission, edit conflict, judged along the `cause` chain) and at `warn`
(`error`) otherwise. Do not downgrade a whole catch block, and do not write ad-hoc status checks per
component: a component that only treats `404` as expected logs every dropped connection as a warning of
its own. Where a site has an expected case of its own (e.g. a `404`), handle it in a branch before.

- **Never leave a promise floating.** An `async` call inside `subscribe()`, an effect or an event handler
  needs `await` or `.catch()`. Otherwise an expected failure reaches Angular's `ErrorHandler` and is
  reported as a separate, unhandled issue.
- **Log a failure once.** Either handle it where it is caught (log, recover, tell the user) or rethrow it,
  not both: a rethrown error that nothing catches is reported again. A component receiving only a result
  flag from a service that has logged the failure does not log it again.
- **Check whether an optional feature is configured, or a known limitation applies, before using it**,
  instead of logging the same failure on every page load or sync.
- **Expect config values of the wrong type** (the config is plain JSON edited by admins), make config
  problems visible to admins in the UI where possible, and validate the config when it is saved.

## Remote Logging

Remote logging to [Sentry](https://sentry.io/) is off unless the deployment sets the DSN of its Sentry
project as `remoteLoggingDsn` in its `assets/config.json` (the file that overrides the `environment` at
startup, see `src/bootstrap-environment.ts`). No build ships a default DSN:

```json
{
  "remoteLoggingDsn": "https://<key>@<org>.ingest.sentry.io/<project>"
}
```

The default `CSP` of the Docker image allows `https://*.sentry.io`; a Sentry on another host (e.g.
self-hosted) must be added to `CSP` (see the build README). The DSN is read after `config.json` has
loaded, so errors before that (including a failure to load `config.json` itself) are never reported.

Events are filed under the Sentry `environment` "production" for every production build. Deployments not
used in production (internal test instances, demos, PR previews) should set `remoteLoggingEnvironment` in
their `config.json`, so that their events can be filtered out of triage.

### Keep message strings static

Messages are grouped by their text, so keep `Logging.warn()` / `Logging.error()` messages constant and
pass variable data as context arguments:

```ts
// don't - one separate issue per entity type, and the details are lost from the title
Logging.warn(`Config references unknown entity type "${config.entity}"`);

// do - one issue for the problem, details available in the event's "context"
Logging.warn("Config references an unknown entity type", {
  entityType: config.entity,
});
```

The message of a thrown `Error` is the issue title, so the same applies to it. Never interpolate
`this.constructor.name` into one: it is minified in production, and source maps cannot repair a message.

### Log an error together with a message

Pass the caught error as the argument after the message, not on its own and not inside a context object:

```ts
// don't - titled by whatever the library called it ("Error: Failed to fetch")
Logging.error(err);
// don't - the error is not classified, grouped or shown with its stack trace
Logging.error("Could not download file", { error: err });

// do
Logging.error("Could not download file", err, { fileId });
```

`Logging.error(message, err)` and `Logging.warn(message, err)` report the message as an error (a
`LoggedError`) with the original as its `cause`, which Sentry keeps in the exception chain. A warning
without an `Error` is reported as a plain message event. Angular's `HttpErrorResponse` is not an `Error`
and counts as "no error" here. Do not drop the error before logging (e.g. `catchError(() => of(null))`
followed by a log call without it).

### Our own errors: `NamedError`

Extend `NamedError` for an error whose name and message identify the problem on their own, whichever
component ran into it, e.g. `ConfigLoadError`, `SyncStalledError`, `DatabaseException`,
`EntityPermissionError`, `RegistryLookupError`. Remote monitoring groups these by name, message and root
cause instead of by stack trace (which opens one issue per call site and per build).

- Pass the name as a literal: the class name is minified in production builds.
- Keep the message free of ids and other variable data; pass them as `details`, reported as extra data.
- For a classified failure, extend one of the typed errors below instead.
- Do not use it for generic errors (`TypeError`, ...): there, the stack trace tells two bugs apart.
- A failure that is only logged, not thrown, needs no name: `Logging.error(message, err)` is grouped the
  same way.

### Typed errors: classifying failures where they enter the app

Foreign errors are converted into typed errors (`TypedError` in `error-classification.ts`, one class per
kind of failure: connectivity, server error, not permitted, expired session, write conflict, broken
local database) where they enter the app, by the knowledge of the module they belong to: the database
layer (`DatabaseException`, `pouchdb-errors.ts`), `typedHttpErrorInterceptor` for requests to our backend
(`/db`, `/api`) and `KeycloakAuthService`, sharing what our backend's responses mean
(`src/app/utils/backend-response.ts`). Everything else judges an error by its type (`classifyError()`).
Only remote monitoring also recognizes the few foreign errors that reach it uncaught, e.g. a failed chunk
load (`uncaught-error-classification.ts`). For a new kind of failure, extend one of the typed classes
(e.g. `SyncStalledError extends ConnectivityError`, `EntityPermissionError extends NotPermittedError`).

- **Check for a kind of failure** with `isExpectedFailure()` (or `Logging.warnUnlessExpected()`),
  `isConnectivityError()`, `isNotPermittedError()` or `classifyErrorChain()` (`error-classification.ts`),
  which apply this classification to the whole `cause` chain, never with ad-hoc status checks.
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
- `error-classification.ts` — the typed errors, `classifyError()` and its helpers (`isExpectedFailure()`, ...)
- `uncaught-error-classification.ts` — the foreign errors recognized only when they reach remote monitoring uncaught
- `sentry-event-processing.ts` — the `beforeSend` hook: details, the reporting policy per classification
- `sentry-grouping.ts` — the grouping rules and message normalization
- `report-once.ts` — turning repeated reports of one failure into breadcrumbs
- `log-level.ts` — the `LogLevel` definitions
- `http-response-logging.ts` — messages and details for an unexpected HTTP response
- `src/app/utils/failed-http-response.ts` — reading a failed HTTP response, also one converted into a typed error
- `src/app/utils/typed-http-error.interceptor.ts`, `src/app/utils/backend-response.ts` — the HTTP boundary and what our backend's responses mean
