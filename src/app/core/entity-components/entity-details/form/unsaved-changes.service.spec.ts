import { TestBed } from "@angular/core/testing";

import { UnsavedChangesService } from "./unsaved-changes.service";
import { ConfirmationDialogService } from "../../../confirmation-dialog/confirmation-dialog.service";

describe("UnsavedChangesService", () => {
  let service: UnsavedChangesService;
  let mockConfirmation: jasmine.SpyObj<ConfirmationDialogService>;

  beforeEach(() => {
    mockConfirmation = jasmine.createSpyObj(["getSaveConfirmation"]);
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
    mockConfirmation.getSaveConfirmation.and.resolveTo(false);

    await expectAsync(service.checkUnsavedChanges()).toBeResolvedTo(true);
    expect(mockConfirmation.getSaveConfirmation).not.toHaveBeenCalled();

    service.pending = true;

    await expectAsync(service.checkUnsavedChanges()).toBeResolvedTo(false);
    expect(mockConfirmation.getSaveConfirmation).toHaveBeenCalled();

    mockConfirmation.getSaveConfirmation.and.resolveTo(true);

    await expectAsync(service.checkUnsavedChanges()).toBeResolvedTo(true);
  });
});
