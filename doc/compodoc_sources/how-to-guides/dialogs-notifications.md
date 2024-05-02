# How to display dialogs, notifications and log errors

To give users a consistent look & feel and make things easier to implement
we have generic services to help with these tasks.
You should always inject and use these rather than implement your own variant of such functionalities.

## Display a confirmation dialog

Before executing an action with far-reaching consequences (e.g. deleting an entity)
you should request explicit confirmation from the user through a confirmation dialog box.
To reduce boiler-plate code for this, you can use the [ConfirmationDialogService](../../injectables/ConfirmationDialogService.html):

```javascript
constructor(private confirmationDialog: ConfirmationDialogService) {}
```

The service is a wrapper for [MatDialog](https://material.angular.io/components/dialog/overview).
Use it to open a dialog box with your text:

```javascript
const confirmed = await this.confirmationDialog.getConfirmation("Delete?", "Are you sure you want to delete this Child?");
```

You can then react to the user action (whether "Yes" or "No" was clicked):

```javascript
if (confirmed) {
  // do something
}
```

You can also display dialogs with only one "OK" button rather than the yes/no option
by setting the optional 'buttons' parameter:

```javascript
this.confirmationDialog.getConfirmation("Info", "No options here, just some text.", OkButton);
```

In this case also consider whether you really want to use a "blocking" dialog box
or if a simple "alert" notification may be the better choice.

Check the definitions of those button presets in `confirmation-dialog.component.ts` to see
how you can also create fully custom choices of buttons.

## Display a notification

You can display a short notification text to the user in an non-disrupting way using the [AlertService](../../injectables/AlertService.html).
This will show a small hovering notification box towards the bottom of the screen
(through [MatSnackBar](https://material.angular.io/components/snack-bar/api)):

```javascript
constructor(private alertService: AlertService) {
  this.alertService.addInfo('info message');
  this.alertService.addWarning('warning message');
  this.alertService.addDanger('important message');
}
```

The different alert levels result in different styling of the notification.
More serious alert levels (warning and above) also require the user to actively dismiss the notification
while other notifications disappear automatically after some time.

> If you want to log errors or other events for developers analysis and monitoring, also read the [Log Errors](log-errors.html) Guide.
