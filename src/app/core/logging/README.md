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
- **Instance configuration or data** (e.g. an unknown `dataType`, icon or validator in the config;
  a permission rule variable for an account without a linked profile; a file field pointing to a
  missing file; an optional feature not set up for the instance): do not report it
  (`Logging.debug`); make it visible to admins in the UI, and validate the config when it is saved.

Rules that keep one root cause in one Sentry issue (see also "Log an error together with a message"
and "Log a failure once" below):

- **Never leave a promise floating.** An `async` call inside `subscribe()`, an effect or an event
  handler needs `await` or `.catch()`. Otherwise an expected failure reaches Angular's
  `ErrorHandler` and is reported as a separate, unhandled issue.
- **Classify failures with the shared helpers**, not with ad-hoc status checks per component:
  `isConnectivityError()` (`src/app/utils/connectivity-error.ts`) and `isExpiredSessionError()`
  (`src/app/utils/expired-session-error.ts`). A component that only treats `404` as expected
  logs every dropped connection as a warning of its own, and cannot tell the user what happened.
- **Check whether an optional feature is configured before using it** (e.g. push notifications
  without a Firebase config) instead of logging its failure on every page load.
- **A known limitation is not an event.** If something fails on every sync or render for a known
  reason (e.g. `purge()` on the legacy `idb` adapter), check the capability up front.
- **Expect config values of the wrong type.** The config is plain JSON edited by admins; a template
  or `computed()` must not crash because a value is not of the type its interface declares.

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
error and its stack trace are still in the event — but the title and the grouping now come from the
message, which is stable across releases and identical for every call site logging that same problem.

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
`DatabaseException`, `RegistryLookupError`. Remote monitoring groups these by name, message and root
cause instead of by stack trace, which otherwise opens one issue per call site (and per build, as
releases without source maps report minified frames).

- Pass the name as a literal: the class name is minified in production builds.
- Keep the message free of ids and other variable data, and pass them as `details` instead: they are
  reported as extra data, without splitting the issue.
- Do not use it for generic errors (`TypeError`, ...): for those, the stack trace is the only thing
  telling two unrelated bugs apart.
- A failure that is only logged, not thrown, needs no name: `Logging.error(message, err)` is grouped
  the same way. Name it only where a network failure must keep an issue of its own instead of going
  into the shared network issue, because the app cannot continue (`ConfigLoadError`,
  `AppBootstrapError`).

### How events are grouped

Sentry groups errors by their stack trace whenever one is available, so rewording an error's message
changes the issue title, but never splits or merges issues; only a fingerprint does. The `beforeSend`
hook (`processSentryEvent`) therefore sets one where the stack is the wrong key:

1. **Our errors** — a `NamedError` or a logged message (`LoggedError`) is grouped by its name and
   message plus the root cause of its `cause` chain. The root cause is appended to the title, so that
   issues split by it can be told apart, e.g. "ConfigLoadError: Failed to load configuration. (caused
   by DatabaseException: Unknown kid)". A framework wrapper that only repeats the message of one of our
   errors (Angular does that for an error raised in a `resource()` loader) is grouped like the error it
   wraps.
2. **Network failures** — a request that never reached the server goes into a single `network-error`
   issue, at level `warning`: a failed `DatabaseException`, a logged message whose direct cause is a
   failed request (whichever component logged it — the message is kept as the `logged_message` tag),
   and any other error with a connectivity failure in its chain or a gateway status (0, 502, 503,
   504). A chunk that fails to load counts as well (offline, or a deployment replaced it). Every
   browser words these differently, so the title is replaced by a stable one and the original kept as
   the `network_error` tag. A named error caused by a network failure (`ConfigLoadError`,
   `AppBootstrapError`) keeps its own issue: it says what failed.
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
  waiting for the data is not at fault. Other `401` reasons are still reported.

The `status`, `reason`, `entityId` etc. of the error, or of the failed request in its `cause` chain, are
reported as extra data, as are the `details` of a `NamedError`.

### One report per issue per session

An error thrown on every change detection cycle would send thousands of identical events, so each issue
is capped at `MAX_REPEATED_SENTRY_EVENTS` per page load. An issue's **event count is therefore not a
measure of how often a problem occurs**: weigh how many sessions, deployments (the `url` tag) and
releases it affects instead. Not the number of affected _users_, which Sentry shows as 0: events
deliberately carry no user identity, as data minimization under the GDPR.

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
- `sentry-event-processing.ts` — the `beforeSend` hook: details, filters and the repeat cap
- `sentry-grouping.ts` — the grouping rules and message normalization
- `log-level.ts` — the `LogLevel` definitions
