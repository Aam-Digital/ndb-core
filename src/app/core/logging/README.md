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
How messages are grouped there depends on the (static) message text, so keep `Logging.warn()` / `Logging.error()`
message strings constant and pass variable data as additional context arguments.

## Key files

- `logging.service.ts` — `LoggingService` and the `Logging` singleton (`export const Logging = new LoggingService()`); implements the log levels and Sentry forwarding
- `log-level.ts` — the `LogLevel` definitions
