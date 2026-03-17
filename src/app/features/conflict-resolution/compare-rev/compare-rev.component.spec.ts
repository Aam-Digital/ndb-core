import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { CompareRevComponent } from "./compare-rev.component";
import { ConfirmationDialogService } from "../../../core/common-components/confirmation-dialog/confirmation-dialog.service";
import { Database } from "../../../core/database/database";
import { AutoResolutionService } from "../auto-resolution/auto-resolution.service";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { DatabaseResolverService } from "../../../core/database/database-resolver.service";

describe("CompareRevComponent", () => {
  let component: CompareRevComponent;
  let fixture: ComponentFixture<CompareRevComponent>;

  let mockDatabase: any;
  let mockResolutionService: any;

  const testDoc = { _id: "abc", _rev: "rev-1a", value: 1 };
  const testConflictDoc = { _id: "abc", _rev: "rev-1b", value: 2 };

  beforeEach(waitForAsync(() => {
    mockDatabase = {
      get: vi.fn().mockName("mockDatabase.get"),
      remove: vi.fn().mockName("mockDatabase.remove"),
      put: vi.fn().mockName("mockDatabase.put"),
    };
    mockDatabase.get.mockReturnValue(Promise.resolve(testConflictDoc));

    mockResolutionService = {
      shouldDeleteConflictingRevision: vi
        .fn()
        .mockName("mockResolutionService.shouldDeleteConflictingRevision"),
    };
    mockResolutionService.shouldDeleteConflictingRevision.mockReturnValue(
      false,
    );

    const confDialogMock = {
      getConfirmation: vi.fn(),
    };
    confDialogMock.getConfirmation.mockResolvedValue(true);

    TestBed.configureTestingModule({
      imports: [CompareRevComponent, MatSnackBarModule, NoopAnimationsModule],
      providers: [
        { provide: ConfirmationDialogService, useValue: confDialogMock },
        {
          provide: DatabaseResolverService,
          useValue: { getDatabase: () => mockDatabase },
        },
        { provide: AutoResolutionService, useValue: mockResolutionService },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompareRevComponent);
    component = fixture.componentInstance;
    component.doc = testDoc; // @Input
    component.rev = testConflictDoc._rev; // @Input
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load and analyse the given doc revision", async () => {
    await component.loadRev();

    expect(mockDatabase.get).toHaveBeenCalledWith(testDoc._id, {
      rev: testConflictDoc._rev,
    });
    expect(component.revDoc).toBe(testConflictDoc);
    expect(component.diffs).toBeDefined();
    expect(component.diffsReverse).toBeDefined();
    expect(component.diffsCustom).toBeDefined();
  });

  it("should automatically resolve (delete) trivial conflict", async () => {
    mockDatabase.get.mockReturnValue(Promise.resolve(testConflictDoc));
    mockResolutionService.shouldDeleteConflictingRevision.mockReturnValue(true);

    await component.loadRev();

    expect(
      mockResolutionService.shouldDeleteConflictingRevision,
    ).toHaveBeenCalled();
    expect(mockDatabase.remove).toHaveBeenCalledWith(testConflictDoc);
    expect(component.resolution).toBeTruthy();
  });

  it("should resolveByDelete, deleting giving doc", async () => {
    vi.useFakeTimers();
    try {
      component.loadRev();
      await vi.advanceTimersByTimeAsync(0);

      component.resolveByDelete(testConflictDoc);
      await vi.advanceTimersByTimeAsync(0);

      expect(mockDatabase.remove).toHaveBeenCalledWith(testConflictDoc);
      expect(mockDatabase.put).not.toHaveBeenCalled();
      expect(component.resolution).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it("should resolveByManualEdit, saving new version and removing conflict", async () => {
    vi.useFakeTimers();
    try {
      component.loadRev();
      await vi.advanceTimersByTimeAsync(0);

      component.resolveByManualEdit(component.diffsCustom);
      await vi.advanceTimersByTimeAsync(0);

      expect(mockDatabase.remove).toHaveBeenCalledWith(testConflictDoc);
      expect(mockDatabase.put).toHaveBeenCalled();
      expect(component.resolution).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });
});
