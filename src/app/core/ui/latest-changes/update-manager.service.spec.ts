import { UpdateManagerService } from "./update-manager.service";
import { ApplicationRef } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
  SwUpdate,
  UnrecoverableStateEvent,
  VersionEvent,
  VersionReadyEvent,
} from "@angular/service-worker";
import { MatSnackBar } from "@angular/material/snack-bar";
import { LatestChangesDialogService } from "./latest-changes-dialog.service";
import { Subject, of } from "rxjs";
import { Logging } from "../../logging/logging.service";
import { UnsavedChangesService } from "../../entity-details/form/unsaved-changes.service";
import { LOCATION_TOKEN } from "../../../utils/di-tokens";
import type { Mock } from "vitest";

type LocationMock = {
  reload: Mock;
};

type SwUpdateMock = Pick<
  SwUpdate,
  "versionUpdates" | "unrecoverable" | "isEnabled"
> & {
  checkForUpdate: Mock;
};

type SnackBarRefMock = {
  onAction: () => Subject<void>;
};

type SnackBarMock = {
  open: Mock<(...args: unknown[]) => SnackBarRefMock>;
};

type LatestChangesDialogMock = Pick<
  LatestChangesDialogService,
  "showLatestChangesIfUpdated"
> & {
  showLatestChangesIfUpdated: Mock;
};

function createVersionReadyEvent(): VersionReadyEvent {
  return {
    type: "VERSION_READY",
    currentVersion: {
      hash: "old-version",
      appData: undefined,
    },
    latestVersion: {
      hash: "new-version",
      appData: undefined,
    },
  };
}

describe("UpdateManagerService", () => {
  let service: UpdateManagerService;
  let mockLocation: LocationMock;
  let swUpdate: SwUpdateMock;
  let updateSubject: Subject<VersionEvent>;
  let unrecoverableSubject: Subject<UnrecoverableStateEvent>;
  let snackBar: SnackBarMock;
  let snackBarAction: Subject<void>;
  let latestChangesDialog: LatestChangesDialogMock;
  let unsavedChanges: Partial<UnsavedChangesService>;

  beforeEach(() => {
    mockLocation = {
      reload: vi.fn(),
    };
    updateSubject = new Subject();
    unrecoverableSubject = new Subject();
    swUpdate = {
      checkForUpdate: vi.fn(),
      versionUpdates: updateSubject,
      unrecoverable: unrecoverableSubject,
      isEnabled: true,
    };
    swUpdate.checkForUpdate.mockResolvedValue(undefined);
    snackBar = {
      open: vi.fn(),
    };
    snackBarAction = new Subject();
    snackBar.open.mockReturnValue({
      onAction: () => snackBarAction,
    });
    latestChangesDialog = {
      showLatestChangesIfUpdated: vi.fn(),
    };
    vi.spyOn(Logging, "error");
    unsavedChanges = { pending: true };

    service = createService();
  });

  function createService() {
    TestBed.resetTestingModule();

    TestBed.configureTestingModule({
      providers: [
        { provide: SwUpdate, useValue: swUpdate },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: LatestChangesDialogService, useValue: latestChangesDialog },
        { provide: UnsavedChangesService, useValue: unsavedChanges },
        { provide: LOCATION_TOKEN, useValue: mockLocation },
        { provide: ApplicationRef, useValue: { isStable: of(true) } },
      ],
    });

    return TestBed.inject(UpdateManagerService);
  }

  afterEach(() => localStorage.clear());

  it("should create", () => {
    expect(service).toBeTruthy();
  });

  it("should show a snackBar that allows to reload the page when an update is available", () => {
    service.listenToAppUpdates();
    // notify about new update
    updateSubject.next(createVersionReadyEvent());

    expect(snackBar.open).toHaveBeenCalled();

    // user activates update
    snackBarAction.next(undefined);

    expect(mockLocation.reload).toHaveBeenCalled();
  });

  it("should reload app if no unsaved changes are detected", () => {
    service.listenToAppUpdates();
    unsavedChanges.pending = true;

    updateSubject.next(createVersionReadyEvent());

    expect(mockLocation.reload).not.toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalled();

    createService();
    unsavedChanges.pending = false;

    updateSubject.next(createVersionReadyEvent());

    expect(mockLocation.reload).toHaveBeenCalled();
  });

  it("should reload the page during construction if noted in the local storage", () => {
    const version = "1.1.1";
    localStorage.setItem(
      LatestChangesDialogService.VERSION_KEY,
      "update-" + version,
    );

    createService();

    expect(mockLocation.reload).toHaveBeenCalled();
    expect(localStorage.getItem(LatestChangesDialogService.VERSION_KEY)).toBe(
      version,
    );
  });

  it("should set the note for reloading the app on next startup and remove it if user triggers reload manually", () => {
    const version = "1.1.1";
    localStorage.setItem(LatestChangesDialogService.VERSION_KEY, version);
    service.listenToAppUpdates();
    updateSubject.next(createVersionReadyEvent());

    expect(localStorage.getItem(LatestChangesDialogService.VERSION_KEY)).toBe(
      "update-" + version,
    );

    // reload is triggered by clicking button on the snackbar
    snackBarAction.next();

    expect(localStorage.getItem(LatestChangesDialogService.VERSION_KEY)).toBe(
      version,
    );
  });

  it("should check for updates once on startup and then every hour", async () => {
    vi.useFakeTimers();
    try {
      service.regularlyCheckForUpdates();
      await vi.advanceTimersByTimeAsync(0);

      expect(swUpdate.checkForUpdate).toHaveBeenCalledTimes(1);

      // One hour later
      await vi.advanceTimersByTimeAsync(1000 * 60 * 60);

      expect(swUpdate.checkForUpdate).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(1000 * 60 * 60);

      expect(swUpdate.checkForUpdate).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should trigger the latest changes dialog on startup only if update note is set", () => {
    latestChangesDialog.showLatestChangesIfUpdated.mockClear();

    localStorage.setItem(
      LatestChangesDialogService.VERSION_KEY,
      "update-1.0.0",
    );
    createService();

    expect(
      latestChangesDialog.showLatestChangesIfUpdated,
    ).not.toHaveBeenCalled();

    localStorage.setItem(LatestChangesDialogService.VERSION_KEY, "1.0.0");
    createService();

    expect(latestChangesDialog.showLatestChangesIfUpdated).toHaveBeenCalled();
  });

  it("should reload app if an unrecoverable state is detected", () => {
    unrecoverableSubject.next({
      reason: "ERROR REASON",
      type: "UNRECOVERABLE_STATE",
    });

    expect(Logging.error).toHaveBeenCalledWith(
      expect.stringContaining("ERROR REASON"),
    );
    expect(mockLocation.reload).toHaveBeenCalled();
  });
});
