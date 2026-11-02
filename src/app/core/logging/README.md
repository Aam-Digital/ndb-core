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
- Pass a `classification` if the error is one of the classified failures below.
- Do not use it for generic errors (`TypeError`, ...): there, the stack trace tells two bugs apart.
- A failure that is only logged, not thrown, needs no name: `Logging.error(message, err)` is grouped the
  same way.

### Classifying failures where they enter the app

What remote monitoring does with a failure depends on its kind, decided once where the error enters the
app (`error-classification.ts`):

- The remote database's fetch wrapper throws a `ConnectivityError` for a request without response or with
  a gateway status (0, 502, 503, 504), and a `ServerError` carrying the status for any other 5xx.
- `DatabaseException` records the `classification` of the PouchDB error it wraps; other `NamedError`s
  can be given one (e.g. `EntityPermissionError`, `SyncStalledError`).
- `classifyError()` reads that classification first; any other error is classified by its status and
  name, and as a last resort by its wording (the patterns in `error-classification.ts`).

`isConnectivityError()`, `isNotPermittedError()` and `isExpectedFailure()` are built on it. A few checks
of one module match on wording as well, without classifying the error: `isDocumentWriteError()` and the
checkpoint check of `isTransientReplicationFailure()` (`synced-pouch-database.ts`), the multi-tab corruption
check (`pouchdb-corruption-recovery.service.ts`) and keycloak's 3rd-party-check iframe timeout
(`keycloak-auth.service.ts`).

| Classification    | What it is                                                                                                          | Reported                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `connectivity`    | no response, status 0, 502-504, timeout/abort, failed chunk load, a stalled sync                                    | shared `network-error` issue, warning, 1 per page load; not while offline |
| `session-expired` | 401 with an expired token the app could not renew                                                                   | no                                                                        |
| `not-permitted`   | 403, 401 "User is not permitted", `EntityPermissionError`                                                           | as a warning if logged with a message at `warn`/`error`, or if unhandled  |
| `write-conflict`  | 409 / "Document update conflict"                                                                                    | no                                                                        |
| `local-storage`   | the device's IndexedDB is broken (`indexed_db_went_bad`, connection closing, object store not found, wrong adapter) | first event of the page load, tagged `incident: local-db`                 |
| `server-error`    | our backend answered with another 5xx                                                                               | at the logged level, with the status in the title and `http_status` tag   |

The table is `REPORTING_POLICY` in `sentry-event-processing.ts`. Every classified event carries the
`error_class` tag. The `status`, `reason`, `entityId` etc. of the error or of an error in its `cause`
chain, and the `details` of a `NamedError`, are reported as extra data. An unhandled error raised only by
a script inlined into the page (e.g. injected by an in-app browser) is not reported.

### How events are grouped

Sentry groups by stack trace; `processSentryEvent` sets a fingerprint where that is the wrong key
(`sentry-grouping.ts`):

- **Our errors by wrapper and root cause**: a `NamedError` or logged message wrapping another error, e.g.
  "Error: Could not load school (caused by DatabaseException: missing)". A classified root cause that
  means the same in every component (`local-storage`, `server-error`, `not-permitted`) is grouped by the
  root cause only, and the wrapper's message is kept as the `reported_by` tag.
- **Network failures** (`connectivity`) go into the one `network-error` issue, with the browser's wording
  as the `network_error` tag (and a logged message as the `logged_message` tag).
- **Exceptions without a stack and message events** by their normalized message (`fingerprintKey`: ids,
  URLs and numbers masked, punctuation and casing dropped).

Everything else keeps Sentry's grouping by stack trace. A change of the grouping does not re-group events
already in Sentry: archive the issues it replaces once the release carrying it is rolled out.

### Each failure is reported once per page load

`reportOnce` (`report-once.ts`) turns an event that repeats a failure already reported in this page load
into a breadcrumb (category `sentry.suppressed`): the same error object (or, for an unhandled error, the
same root cause), any further `local-storage` or network event, and any event beyond
`MAX_REPEATED_SENTRY_EVENTS` of one issue.

An issue's **event count is therefore not a measure of how often a problem occurs**: weigh how many
sessions, deployments (the `url` tag) and releases it affects instead. Sentry shows 0 affected _users_:
events deliberately carry no user identity, as data minimization under the GDPR.

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
- `error-classification.ts` — the typed errors of the boundaries (`ConnectivityError`, `ServerError`), `classifyError()` and its helpers
- `sentry-event-processing.ts` — the `beforeSend` hook: details, the reporting policy per classification
- `sentry-grouping.ts` — the grouping rules and message normalization
- `report-once.ts` — turning repeated reports of one failure into breadcrumbs
- `http-response-logging.ts` — messages and details for an unexpected HTTP response
- `log-level.ts` — the `LogLevel` definitions
