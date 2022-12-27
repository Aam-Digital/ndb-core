import { UpdateManagerService } from "./update-manager.service";
import { discardPeriodicTasks, fakeAsync, tick } from "@angular/core/testing";
import { ApplicationRef } from "@angular/core";
import { SwUpdate, VersionEvent } from "@angular/service-worker";
import { MatSnackBar } from "@angular/material/snack-bar";
import { LatestChangesDialogService } from "./latest-changes-dialog.service";
import { Subject } from "rxjs";

describe("UpdateManagerService", () => {
  let service: UpdateManagerService;
  let location: jasmine.SpyObj<Location>;
  let swUpdate: jasmine.SpyObj<SwUpdate>;
  let updateSubject: Subject<Partial<VersionEvent>>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let snackBarAction: Subject<void>;
  let appRef: jasmine.SpyObj<ApplicationRef>;
  let stableSubject: Subject<boolean>;
  let latestChangesDialog: jasmine.SpyObj<LatestChangesDialogService>;

  beforeEach(() => {
    location = jasmine.createSpyObj(["reload"]);
    updateSubject = new Subject();
    swUpdate = jasmine.createSpyObj(["checkForUpdate"], {
      versionUpdates: updateSubject,
      isEnabled: true,
    });
    swUpdate.checkForUpdate.and.resolveTo();
    snackBar = jasmine.createSpyObj(["open"]);
    snackBarAction = new Subject();
    snackBar.open.and.returnValue({
      onAction: () => snackBarAction.asObservable(),
    } as any);
    stableSubject = new Subject<boolean>();
    appRef = jasmine.createSpyObj([], { isStable: stableSubject });
    latestChangesDialog = jasmine.createSpyObj(["showLatestChangesIfUpdated"]);

    service = createService();
  });

  it("should create", () => {
    expect(service).toBeTruthy();
  });

  it("should show a snackBar that allows to reload the page when an update is available", fakeAsync(() => {
    service.notifyUserWhenUpdateAvailable();
    // notify about new update
    updateSubject.next({ type: "VERSION_READY" });
    tick();

    expect(snackBar.open).toHaveBeenCalled();

    // user activates update
    snackBarAction.next(undefined);
    tick();

    expect(location.reload).toHaveBeenCalled();
  }));

  it("should reload the page during construction if noted in the local storage", () => {
    const version = "1.1.1";
    window.localStorage.setItem(
      LatestChangesDialogService.VERSION_KEY,
      "update-" + version
    );

    createService();

    expect(location.reload).toHaveBeenCalled();
    expect(
      window.localStorage.getItem(LatestChangesDialogService.VERSION_KEY)
    ).toBe(version);
  });

  it("should set the note for reloading the app on next startup and remove it if user triggers reload manually", fakeAsync(() => {
    const version = "1.1.1";
    window.localStorage.setItem(
      LatestChangesDialogService.VERSION_KEY,
      version
    );
    service.notifyUserWhenUpdateAvailable();
    updateSubject.next({ type: "VERSION_READY" });

    expect(
      window.localStorage.getItem(LatestChangesDialogService.VERSION_KEY)
    ).toBe("update-" + version);

    // reload is triggered by clicking button on the snackbar
    snackBarAction.next();

    expect(
      window.localStorage.getItem(LatestChangesDialogService.VERSION_KEY)
    ).toBe(version);
  }));

  it("should check for updates once on startup and then every hour", fakeAsync(() => {
    service.regularlyCheckForUpdates();
    tick();

    expect(swUpdate.checkForUpdate).not.toHaveBeenCalled();

    stableSubject.next(false);
    tick();

    expect(swUpdate.checkForUpdate).not.toHaveBeenCalled();

    stableSubject.next(true);
    tick();

    expect(swUpdate.checkForUpdate).toHaveBeenCalledTimes(1);

    stableSubject.next(true);
    tick();

    expect(swUpdate.checkForUpdate).toHaveBeenCalledTimes(1);

    // One hour later
    tick(1000 * 60 * 60);

    expect(swUpdate.checkForUpdate).toHaveBeenCalledTimes(2);

    tick(1000 * 60 * 60);

    expect(swUpdate.checkForUpdate).toHaveBeenCalledTimes(3);

    discardPeriodicTasks();
  }));

  it("should trigger the latest changes dialog on startup only if update note is set", () => {
    latestChangesDialog.showLatestChangesIfUpdated.calls.reset();

    window.localStorage.setItem(
      LatestChangesDialogService.VERSION_KEY,
      "update-1.0.0"
    );
    createService();

    expect(
      latestChangesDialog.showLatestChangesIfUpdated
    ).not.toHaveBeenCalled();

    window.localStorage.setItem(
      LatestChangesDialogService.VERSION_KEY,
      "1.0.0"
    );
    createService();

    expect(latestChangesDialog.showLatestChangesIfUpdated).toHaveBeenCalled();
  });

  function createService() {
    return new UpdateManagerService(
      appRef,
      swUpdate,
      snackBar,
      undefined,
      latestChangesDialog,
      location
    );
  }
});
