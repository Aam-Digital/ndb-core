import { TestBed } from "@angular/core/testing";

import { UnsavedChangesService } from "./unsaved-changes.service";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";

describe("UnsavedChangesService", () => {
  let service: UnsavedChangesService;
  let mockConfirmation: any;

  // arbitrary stable object identities used as change "sources"
  const sourceA = { id: "A" };
  const sourceB = { id: "B" };

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

  it("should report pending as long as at least one source has unsaved changes", () => {
    expect(service.pending()).toBe(false);

    service.setUnsavedChanges(sourceA, true);
    expect(service.pending()).toBe(true);

    service.setUnsavedChanges(sourceB, true);
    expect(service.pending()).toBe(true);

    // clearing one source leaves the other still pending (multi-layer)
    service.setUnsavedChanges(sourceA, false);
    expect(service.pending()).toBe(true);

    service.setUnsavedChanges(sourceB, false);
    expect(service.pending()).toBe(false);
  });

  it("should only ask for confirmation if changes are pending", async () => {
    mockConfirmation.getDiscardConfirmation.mockResolvedValue(false);

    await expect(service.checkUnsavedChanges()).resolves.toEqual(true);
    expect(mockConfirmation.getDiscardConfirmation).not.toHaveBeenCalled();

    service.setUnsavedChanges(sourceA, true);

    await expect(service.checkUnsavedChanges()).resolves.toEqual(false);
    expect(mockConfirmation.getDiscardConfirmation).toHaveBeenCalled();

    mockConfirmation.getDiscardConfirmation.mockResolvedValue(true);

    await expect(service.checkUnsavedChanges()).resolves.toEqual(true);
    // confirming discards all sources
    expect(service.pending()).toBe(false);
  });

  it("should only consider the given source when checking a single dialog (multi-layer)", async () => {
    mockConfirmation.getDiscardConfirmation.mockResolvedValue(true);

    // only the outer view (sourceB) is dirty; the dialog (sourceA) is clean
    service.setUnsavedChanges(sourceB, true);

    // closing the clean dialog must not prompt and must not discard the outer view
    await expect(service.checkUnsavedChanges(sourceA)).resolves.toBe(true);
    expect(mockConfirmation.getDiscardConfirmation).not.toHaveBeenCalled();
    expect(service.pending()).toBe(true);

    // now the dialog itself is dirty: confirming discards only the dialog's changes
    service.setUnsavedChanges(sourceA, true);
    await expect(service.checkUnsavedChanges(sourceA)).resolves.toBe(true);
    expect(mockConfirmation.getDiscardConfirmation).toHaveBeenCalledTimes(1);
    // the outer view remains dirty
    expect(service.pending()).toBe(true);
  });

  it("should prevent closing the window if changes are pending", () => {
    const e = { preventDefault: vi.fn(), returnValue: undefined };

    window.onbeforeunload(e as any);

    expect(e.preventDefault).not.toHaveBeenCalled();
    expect(e.returnValue).toBeUndefined();

    service.setUnsavedChanges(sourceA, true);
    window.onbeforeunload(e as any);

    expect(e.preventDefault).toHaveBeenCalled();
    expect(e.returnValue).toBe("onbeforeunload");
  });
});
