import { UpdateManagerService } from "./update-manager.service";
import {
  discardPeriodicTasks,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { ApplicationRef } from "@angular/core";
import { SwUpdate, UpdateActivatedEvent } from "@angular/service-worker";
import { MatSnackBar } from "@angular/material/snack-bar";
import { LoggingService } from "../logging/logging.service";
import { LatestChangesDialogService } from "./latest-changes-dialog.service";
import { LOCATION_TOKEN } from "./latest-changes.module";
import { Subject } from "rxjs";

describe("UpdateManagerService", () => {
  let service: UpdateManagerService;
  let location: jasmine.SpyObj<Location>;
  let swUpdate: jasmine.SpyObj<SwUpdate>;
  let updateSubject: Subject<UpdateActivatedEvent>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let snackBarAction: Subject<void>;
  let appRef: jasmine.SpyObj<ApplicationRef>;
  let stableSubject: Subject<boolean>;

  beforeEach(() => {
    location = jasmine.createSpyObj(["reload"]);
    updateSubject = new Subject<UpdateActivatedEvent>();
    swUpdate = jasmine.createSpyObj(["checkForUpdate"], {
      available: updateSubject,
      isEnabled: true,
    });
    snackBar = jasmine.createSpyObj(["open"]);
    snackBarAction = new Subject();
    snackBar.open.and.returnValue({
      onAction: () => snackBarAction.asObservable(),
    } as any);
    stableSubject = new Subject<boolean>();
    appRef = jasmine.createSpyObj([], { isStable: stableSubject });

    TestBed.configureTestingModule({
      providers: [
        UpdateManagerService,
        { provide: ApplicationRef, useValue: appRef },
        { provide: SwUpdate, useValue: swUpdate },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: LoggingService, useValue: {} },
        { provide: LOCATION_TOKEN, useValue: location },
      ],
    });

    service = TestBed.inject(UpdateManagerService);
  });

  it("should create", () => {
    expect(service).toBeTruthy();
  });

  it("should show a popup that allows to reload the page when an update is available", fakeAsync(() => {
    service.notifyUserWhenUpdateAvailable();
    // notify about new update
    updateSubject.next();
    tick();

    expect(snackBar.open).toHaveBeenCalled();

    // user activates update
    snackBarAction.next(undefined);
    tick();

    expect(location.reload).toHaveBeenCalled();
  }));

  it("should reload the page when constructed if noted in the local storage", () => {
    const version = "1.1.1";
    window.localStorage.setItem(
      LatestChangesDialogService.VERSION_KEY,
      "update-" + version
    );

    // tslint:disable-next-line:no-unused-expression
    new UpdateManagerService(null, null, null, null, location);

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
    updateSubject.next();

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
});
