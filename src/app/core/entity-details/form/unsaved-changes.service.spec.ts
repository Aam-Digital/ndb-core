import { TestBed } from "@angular/core/testing";

import { UnsavedChangesService } from "./unsaved-changes.service";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";

describe("UnsavedChangesService", () => {
  let service: UnsavedChangesService;
  let mockConfirmation: any;

  beforeEach(() => {
    mockConfirmation = {
      getDiscardConfirmation: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: ConfirmationDialogService, useValue: mockConfirmation },
      ],
    });
    service = TestBed.inject(UnsavedChangesService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should only ask for confirmation if changes are pending", async () => {
    mockConfirmation.getDiscardConfirmation.mockResolvedValue(false);

    await expect(service.checkUnsavedChanges()).resolves.toEqual(true);
    expect(mockConfirmation.getDiscardConfirmation).not.toHaveBeenCalled();

    service.pending = true;

    await expect(service.checkUnsavedChanges()).resolves.toEqual(false);
    expect(mockConfirmation.getDiscardConfirmation).toHaveBeenCalled();

    mockConfirmation.getDiscardConfirmation.mockResolvedValue(true);

    await expect(service.checkUnsavedChanges()).resolves.toEqual(true);
  });

  it("should prevent closing the window if changes are pending", () => {
    const e = { preventDefault: vi.fn(), returnValue: undefined };

    service.pending = false;
    window.onbeforeunload(e as any);

    expect(e.preventDefault).not.toHaveBeenCalled();
    expect(e.returnValue).toBeUndefined();

    service.pending = true;
    window.onbeforeunload(e as any);

    expect(e.preventDefault).toHaveBeenCalled();
    expect(e.returnValue).toBe("onbeforeunload");
  });
});
