import { TestBed } from "@angular/core/testing";
import { ConfirmationDialogService } from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { LOCATION_TOKEN } from "#src/app/utils/di-tokens";
import { PouchdbCorruptionRecoveryService } from "./pouchdb-corruption-recovery.service";
import { BackupService } from "../../admin/backup/backup.service";

describe("PouchdbCorruptionRecoveryService", () => {
  let service: PouchdbCorruptionRecoveryService;
  let confirmationDialog: { getConfirmation: ReturnType<typeof vi.fn> };
  let location: { pathname: string };

  beforeEach(() => {
    confirmationDialog = {
      getConfirmation: vi.fn(),
    };
    location = { pathname: "/entities/Entity:1" };

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

    expect(localStorage.getItem("foo")).toBeNull();
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

  it("should keep application state when user cancels", async () => {
    localStorage.setItem("foo", "bar");
    confirmationDialog.getConfirmation.mockResolvedValue(false);

    await service.promptResetApplicationDialog();

    expect(localStorage.getItem("foo")).toBe("bar");
    expect(sessionStorage.getItem(BackupService.RESET_PENDING_KEY)).toBeNull();
    expect(location.pathname).toBe("/entities/Entity:1");
  });
});
