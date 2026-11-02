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

`Logging.error(message, err)` reports the message as the error (wrapped in a `LoggedError`) and keeps
the original as its `cause`. Sentry links a `cause` into the reported exception chain, so the original
error and its stack trace are still in the event. The event is grouped by that root cause, so every
component logging the same failure adds to one issue, and the message is reported as the `reported_by`
tag: it says which component ran into the failure (see "How events are grouped"). Logged without an
error, the message itself is the title and the grouping key, so keep it stable across releases.

`Logging.warn(message, err)` is reported the same way, only at level `warning`. As a plain message
event, the error would only be extra data that none of the processing below looks at: a failed request
would not count as a connectivity failure, an expired session would not be filtered, and the status
would not be reported. Only a warning without any error is reported as a plain message, grouped by its
message. Angular's `HttpErrorResponse` is not an `Error` and counts as "no error" here: whether a
failed response is exceptional is for the code that made the request to decide.

So do not drop the error before logging (a `catchError(() => of(null))` followed by a log call
without it leaves the report impossible to diagnose), and do not pass the same error object twice.

### Log a failure once

Either handle a failure where it is caught (log it, recover, tell the user) or rethrow it — not both.
When the rethrown error reaches a caller that does not catch it either, it is reported a second time as
an unhandled error, under its own and usually less telling title. Likewise, when a service has logged
a failure and only returns a result flag, the component receiving it must not log it again.

### Our own errors: `NamedError`

Extend `NamedError` (or create one) for an error whose name and message identify the problem on their
own, no matter which component ran into it — e.g. `ConfigLoadError`, `SyncStalledError`,
`DatabaseException`, `RegistryLookupError`. Remote monitoring groups these by name and message
(or, if they wrap another error, by its root cause) instead of by stack trace, which otherwise opens
one issue per call site (and per build, as releases without source maps report minified frames).

- Pass the name as a literal: the class name is minified in production builds.
- Keep the message free of ids and other variable data, and pass them as `details` instead: they are
  reported as extra data, without splitting the issue.
- Do not use it for generic errors (`TypeError`, ...): for those, the stack trace is the only thing
  telling two unrelated bugs apart.
- A failure that is only logged, not thrown, needs no name: `Logging.error(message, err)` is grouped
  the same way. Name it only where a network failure must keep an issue of its own instead of going
  into the shared network issue, because the app cannot continue (`AppBootstrapError`;
  `ConfigLoadError`, which is not reported at all when the device is simply offline).

### Classifying failures where they enter the app

What remote monitoring does with a failure depends on what kind of failure it is. That is decided
once, where the error enters the app, by type and HTTP status (`error-classification.ts`):

- The remote database's fetch wrapper throws a `ConnectivityError` for a request without response or
  with a gateway status (0, 502, 503, 504), and a `ServerError` carrying the status for any other 5xx.
- `DatabaseException` records the `classification` of the PouchDB error it wraps (local or remote).
- `classifyError()` reads that classification first; only an error that did not pass such a boundary
  (a raw browser or PouchDB error, an `HttpErrorResponse`) is classified by its status and name, and
  as a last resort by its wording. These message patterns are all in `error-classification.ts`.

The helpers `isConnectivityError()`, `isExpiredSessionError()` and `isNotPermittedError()` in
`src/app/utils/` are thin wrappers around `classifyError()`.

| Classification    | What it is                                                                                                                                | Reported                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `connectivity`    | no response, status 0, 502-504, timeout/abort, failed chunk load                                                                          | shared `network-error` issue, warning, 1 per page load; not while offline |
| `session-expired` | 401 with an expired token the app could not renew                                                                                         | no                                                                        |
| `not-permitted`   | 403, or 401 "User is not permitted"                                                                                                       | only if a component logged it with a message, as a warning                |
| `write-conflict`  | 409 / "Document update conflict"                                                                                                          | no                                                                        |
| `local-storage`   | the device's IndexedDB is broken (`indexed_db_went_bad`, connection closing, object store not found, wrong adapter, multi-tab corruption) | first event of the page load, tagged `incident: local-db`                 |
| `server-error`    | our backend answered with another 5xx                                                                                                     | as an error, with the status in the title and the `http_status` tag       |

The table is `REPORTING_POLICY` in `sentry-event-processing.ts`. Every classified event carries the
`error_class` tag.

### How events are grouped

Sentry groups errors by their stack trace whenever one is available, so rewording an error's message
changes the issue title, but never splits or merges issues; only a fingerprint does. The `beforeSend`
hook (`processSentryEvent`) therefore sets one where the stack is the wrong key:

1. **Our errors, by root cause** — a `NamedError` or a logged message (`LoggedError`) that wraps
   another error is grouped by the root cause of its `cause` chain only, so one failure is one issue,
   whichever components ran into it. The issue is titled by the root cause (e.g. "DatabaseException:
   Unknown kid"); the wrapper's message is kept as the `reported_by` tag (and extra), so the issue's
   tag breakdown shows which components were affected. Two exceptions keep the wrapper in the key:
   - a programming error (`TypeError`, `RangeError`, ...) as root cause is also grouped by the function
     that threw it (the innermost stack frame with a name that survives minification), or by the
     wrapper if there is none: its message alone does not tell two bugs apart;
   - a network failure as root cause of a named error (`ConfigLoadError`, `AppBootstrapError`): the
     wrapper says what failed, so it keeps an issue of its own, titled e.g. "AppBootstrapError:
     Application Bootstrap failed (caused by TypeError: network failure)".

   An error without a cause is grouped by its name and message. A framework wrapper that only repeats
   the message of one of our errors (Angular does that for an error raised in a `resource()` loader)
   is grouped like the error it wraps.

2. **Network failures** — a request that never reached the server (`connectivity`) goes into a single
   `network-error` issue, at level `warning`: a failed `DatabaseException`, a logged message whose
   direct cause is a failed request (whichever component logged it — the message is kept as the
   `logged_message` tag), and any other error with a connectivity failure in its chain. Every browser
   words these differently, so the title is replaced by a stable one and the original kept as the
   `network_error` tag.
3. **Exceptions without a stack** (e.g. an `HttpErrorResponse`) and **message events** are grouped by
   their normalized message — Sentry would otherwise group them by the raw message, one issue per id.
   An exception is also reported under the normalized message, so that the issue list does not show
   one row per id (or a whole HTML error page quoted into a message).

Everything else keeps Sentry's grouping by stack trace.

Messages are normalized for grouping (`fingerprintKey`): ids, URLs and numbers are masked, punctuation
and casing dropped, as libraries are inconsistent about them (PouchDB reports both `Unauthorized` and
`unauthorized`). Changing the grouping does not re-group events already in Sentry: archive the issues
it replaces once the release carrying it is rolled out.

### What is not reported

`processSentryEvent` drops events nobody can act on:

- connectivity failures while the device is offline;
- a rejected write with an outdated revision (409, "Document update conflict"): normal for an
  offline-first app, the user is told and it is counted in usage analytics;
- an expired session that could not be renewed (also when wrapped): the user is told, and the code
  waiting for the data is not at fault. Other `401` reasons are still reported;
- a record the permission rules exclude (403, or 401 "User is not permitted") that reaches the error
  handler unhandled;
- an unhandled error raised only by a script inlined into the page (e.g. injected by an in-app browser).

The `status`, `reason`, `entityId` etc. of the error, or of the failed request in its `cause` chain, are
reported as extra data, as are the `details` of a `NamedError`.

### Each failure is reported once per page load

`reportOnce` (`report-once.ts`) turns an event that repeats a failure already reported in this page
load into a breadcrumb (category `sentry.suppressed`), so it still shows in the history of later events:

- **The same error object** — an error that was already part of an event (e.g. logged by a component,
  then re-thrown and reaching Angular's `ErrorHandler`), or an unhandled error whose root cause was.
  Two components logging the same root cause are both reported, into one issue (see above).
- **A broken local database** (`local-db-incident.ts`) — once the IndexedDB is broken, every later
  database access fails too (config, permission rules, sync, each view). Only the first
  `local-storage` event of the page load is reported, tagged `incident: local-db`.
- **The network issue** — once per page load: when the connection drops, all pending requests fail at
  the same moment.
- **Any other issue** — at most `MAX_REPEATED_SENTRY_EVENTS` per page load, against error loops (e.g.
  an error thrown on every change detection cycle).

An issue's **event count is therefore not a measure of how often a problem occurs**: weigh how many
sessions, deployments (the `url` tag) and releases it affects instead. Not the number of affected
_users_, which Sentry shows as 0: events deliberately carry no user identity, as data minimization
under the GDPR.

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
- `error-classification.ts` — the typed errors of the boundaries (`ConnectivityError`, `ServerError`), `classifyError()` and all message patterns
- `sentry-event-processing.ts` — the `beforeSend` hook: details, the reporting policy per classification
- `sentry-grouping.ts` — the grouping rules and message normalization
- `report-once.ts`, `local-db-incident.ts` — turning repeated reports of one failure into breadcrumbs
- `log-level.ts` — the `LogLevel` definitions
