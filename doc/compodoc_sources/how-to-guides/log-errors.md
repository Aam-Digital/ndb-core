# How to log errors

This Guide considers logging of errors and information that is necessary for developers in debugging and monitoring.
Refer to the [Display Dialogs or Notifications](display-dialogs-and-notifications.html) Guide
regarding ways to inform the user about errors or other events.

## Logging things

Production code (whatever is merged into the `master` branch) should not contain any calls to `console.log()`.
If you need to output information for possible debugging that is not handled otherwise, use the `AlertService` from our `AlertsModule`.
This way, all logging is done in a consistent manner and can possibly be transferred to the development team or saved in some other way.

To log information for analysis and debugging (without explicit notification to the user)
use the [Logging](../../injectables/LoggingService.html) object:

```
someFun() {
  Logging.error('some error information');
}
```

Similar to the AlertService the LoggingService has multiple log levels
that control whether log messages are sent to the remote monitoring and how they are treated there.

## Remote Logging

The service side logging is performed via the [sentry.io](https://sentry.io/ewb/aam-digital/) logging service.
The credentials for the EWB-Account can be found in the `podio` workspace.
