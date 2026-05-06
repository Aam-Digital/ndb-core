import { TestBed } from "@angular/core/testing";
import { ConfirmationDialogService } from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { LOCATION_TOKEN } from "#src/app/utils/di-tokens";
import {
  isKnownMultiTabDatabaseCorruption,
  PouchdbCorruptionRecoveryService,
} from "./pouchdb-corruption-recovery.service";
import { BackupService } from "../../admin/backup/backup.service";
import { environment } from "../../../../environments/environment";
import { SessionType } from "../../session/session-type";

describe("PouchdbCorruptionRecoveryService", () => {
  let service: PouchdbCorruptionRecoveryService;
  let confirmationDialog: { getConfirmation: ReturnType<typeof vi.fn> };
  let location: { pathname: string };

  beforeEach(() => {
    confirmationDialog = {
      getConfirmation: vi.fn(),
    };
    location = { pathname: "/entities/Entity:1" };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        PouchdbCorruptionRecoveryService,
        { provide: ConfirmationDialogService, useValue: confirmationDialog },
        { provide: LOCATION_TOKEN, useValue: location },
      ],
    });

    service = TestBed.inject(PouchdbCorruptionRecoveryService);
    localStorage.clear();
    sessionStorage.removeItem(BackupService.RESET_PENDING_KEY);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.removeItem(BackupService.RESET_PENDING_KEY);
  });

  it("should reset application state when user confirms", async () => {
    localStorage.setItem("foo", "bar");
    confirmationDialog.getConfirmation.mockResolvedValue(true);

    await service.promptResetApplicationDialog();

    expect(localStorage.getItem("foo")).toBe("bar");
    expect(sessionStorage.getItem(BackupService.RESET_PENDING_KEY)).toBe("1");
    expect(location.pathname).toBe("");
  });

  it("should show multi-tab warning dialog without resetting state", async () => {
    localStorage.setItem("foo", "bar");
    confirmationDialog.getConfirmation.mockResolvedValue(true);

    await service.promptMultiTabWarningDialog();

    expect(confirmationDialog.getConfirmation).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("foo")).toBe("bar");
    expect(sessionStorage.getItem(BackupService.RESET_PENDING_KEY)).toBeNull();
    expect(location.pathname).toBe("/entities/Entity:1");
  });

  it("should skip multi-tab warning dialog in online-only mode", async () => {
    environment.session_type = SessionType.online;
    await service.promptMultiTabWarningDialog();
    expect(confirmationDialog.getConfirmation).not.toHaveBeenCalled();
  });

  it("should show multi-tab warning again when prompted again", async () => {
    confirmationDialog.getConfirmation.mockResolvedValue(true);

    await service.promptMultiTabWarningDialog();
    await service.promptMultiTabWarningDialog();
    expect(confirmationDialog.getConfirmation).toHaveBeenCalledTimes(2);
  });

  it("should keep application state when user cancels", async () => {
    localStorage.setItem("foo", "bar");
    confirmationDialog.getConfirmation.mockResolvedValue(false);

    await service.promptResetApplicationDialog();

    expect(localStorage.getItem("foo")).toBe("bar");
    expect(sessionStorage.getItem(BackupService.RESET_PENDING_KEY)).toBeNull();
    expect(location.pathname).toBe("/entities/Entity:1");
  });
});

describe("isKnownMultiTabDatabaseCorruption", () => {
  it("should detect seq index constraint errors", () => {
    const error = new Error(
      "Database has a global failure ConstraintError: Unable to add key to index 'seq': at least one key does not satisfy the uniqueness requirements.",
    );
    expect(isKnownMultiTabDatabaseCorruption(error)).toBe(true);
  });

  it("should detect unknown_error from IndexedDB adapter failures", () => {
    const error = {
      message: "unknown_error: Database encountered an unknown error",
    };
    expect(isKnownMultiTabDatabaseCorruption(error)).toBe(false);
  });

  it("should not detect unknown_error when error is a plain string", () => {
    expect(isKnownMultiTabDatabaseCorruption("unknown_error")).toBe(false);
  });

  it("should not classify unrelated validation errors", () => {
    const error = new Error("validation error: invalid field value");
    expect(isKnownMultiTabDatabaseCorruption(error)).toBe(false);
  });

  it("should detect bulk save array errors with seq constraint", () => {
    const bulkError = [
      {
        reason:
          "Database has a global failure ConstraintError: Unable to add key to index 'seq'",
      },
    ];
    expect(isKnownMultiTabDatabaseCorruption(bulkError)).toBe(true);
  });
});
