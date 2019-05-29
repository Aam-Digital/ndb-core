Production code (whatever is merged into the `master` branch) should not contain any calls to `console.log()`. If you need to output information for possible debugging that is not handled otherwise, use the `AlertService` from our `AlertsModule`. This way, all logging is done in a consistent manner and can possibly transferred to the development team or saved in some other way.

To log information in production code without explicit notification to the user:
```
constructor(private alertService: AlertService) {
  this.alertService.addDebug('debug info');
}
```

To log information and display a message to the user (through `MatSnackBar`):
```
constructor(private alertService: AlertService) {
  this.alertService.addInfo('info message');
  this.alertService.addWarning('warning message');
  this.alertService.addDanger('important message');
}
```