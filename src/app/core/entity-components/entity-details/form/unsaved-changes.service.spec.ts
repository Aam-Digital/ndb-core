import { TestBed } from "@angular/core/testing";

import { UnsavedChangesService } from "./unsaved-changes.service";
import { ConfirmationDialogService } from "../../../confirmation-dialog/confirmation-dialog.service";

describe("UnsavedChangesService", () => {
  let service: UnsavedChangesService;
  let mockConfirmation: jasmine.SpyObj<ConfirmationDialogService>;

  beforeEach(() => {
    mockConfirmation = jasmine.createSpyObj(["getDiscardConfirmation"]);
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
    mockConfirmation.getDiscardConfirmation.and.resolveTo(false);

    await expectAsync(service.checkUnsavedChanges()).toBeResolvedTo(true);
    expect(mockConfirmation.getDiscardConfirmation).not.toHaveBeenCalled();

    service.pending = true;

    await expectAsync(service.checkUnsavedChanges()).toBeResolvedTo(false);
    expect(mockConfirmation.getDiscardConfirmation).toHaveBeenCalled();

    mockConfirmation.getDiscardConfirmation.and.resolveTo(true);

    await expectAsync(service.checkUnsavedChanges()).toBeResolvedTo(true);
  });

  it("should prevent closing the window if changes are pending", () => {
    const e = { preventDefault: jasmine.createSpy(), returnValue: undefined };

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
