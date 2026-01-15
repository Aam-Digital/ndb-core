import { TestBed } from "@angular/core/testing";
import { AssistantService } from "./assistant.service";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { AssistantDialogComponent } from "./assistant-dialog/assistant-dialog.component";
import { of } from "rxjs";

describe("AssistantService", () => {
  let service: AssistantService;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AssistantDialogComponent>>;

  beforeEach(() => {
    mockDialogRef = jasmine.createSpyObj("MatDialogRef", ["afterClosed"]);
    mockDialog = jasmine.createSpyObj("MatDialog", ["open"]);

    TestBed.configureTestingModule({
      providers: [
        AssistantService,
        { provide: MatDialog, useValue: mockDialog },
      ],
    });
    service = TestBed.inject(AssistantService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should open the assistant dialog with correct configuration", async () => {
    mockDialogRef.afterClosed.and.returnValue(of(undefined));
    mockDialog.open.and.returnValue(mockDialogRef);

    await service.openAssistant();

    expect(mockDialog.open).toHaveBeenCalledWith(
      AssistantDialogComponent,
      jasmine.objectContaining({
        height: AssistantService.ASSISTANT_DIALOG_HEIGHT,
        backdropClass: "backdrop-below-toolbar",
      }),
    );
  });

  it("should not open dialog if already open", async () => {
    mockDialogRef.afterClosed.and.returnValue(of(undefined));
    mockDialog.open.and.returnValue(mockDialogRef);

    // Open the dialog first time
    const firstCall = service.openAssistant();
    expect(service.isOpen()).toBe(true);

    // Try to open again while first is still open
    const secondCall = await service.openAssistant();

    expect(secondCall).toBeUndefined();
    expect(mockDialog.open).toHaveBeenCalledTimes(1);

    // Wait for first dialog to close
    await firstCall;
    expect(service.isOpen()).toBe(false);
  });

  it("should track dialog open state correctly", async () => {
    mockDialogRef.afterClosed.and.returnValue(of(undefined));
    mockDialog.open.and.returnValue(mockDialogRef);

    expect(service.isOpen()).toBe(false);

    const openPromise = service.openAssistant();
    expect(service.isOpen()).toBe(true);

    await openPromise;
    expect(service.isOpen()).toBe(false);
  });

  it("should not open dialog when assistantEnabled is false", async () => {
    service.assistantEnabled = false;

    const result = await service.openAssistant();

    expect(result).toBeUndefined();
    expect(mockDialog.open).not.toHaveBeenCalled();
  });
});
