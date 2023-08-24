import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { CompareRevComponent } from "./compare-rev.component";
import { ConfirmationDialogService } from "../../../core/common-components/confirmation-dialog/confirmation-dialog.service";
import { Database } from "../../../core/database/database";
import { AutoResolutionService } from "../auto-resolution/auto-resolution.service";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("CompareRevComponent", () => {
  let component: CompareRevComponent;
  let fixture: ComponentFixture<CompareRevComponent>;

  let mockDatabase: jasmine.SpyObj<Database>;
  let mockResolutionService: jasmine.SpyObj<AutoResolutionService>;

  const testDoc = { _id: "abc", _rev: "rev-1a", value: 1 };
  const testConflictDoc = { _id: "abc", _rev: "rev-1b", value: 2 };

  beforeEach(waitForAsync(() => {
    mockDatabase = jasmine.createSpyObj("mockDatabase", [
      "get",
      "remove",
      "put",
    ]);
    mockDatabase.get.and.returnValue(Promise.resolve(testConflictDoc));

    mockResolutionService = jasmine.createSpyObj("mockResolutionService", [
      "shouldDeleteConflictingRevision",
    ]);
    mockResolutionService.shouldDeleteConflictingRevision.and.returnValue(
      false,
    );

    const confDialogMock = jasmine.createSpyObj<ConfirmationDialogService>([
      "getConfirmation",
    ]);
    confDialogMock.getConfirmation.and.resolveTo(true);

    TestBed.configureTestingModule({
      imports: [CompareRevComponent, MatSnackBarModule, NoopAnimationsModule],
      providers: [
        { provide: ConfirmationDialogService, useValue: confDialogMock },
        { provide: Database, useValue: mockDatabase },
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
    mockDatabase.get.and.returnValue(Promise.resolve(testConflictDoc));
    mockResolutionService.shouldDeleteConflictingRevision.and.returnValue(true);

    await component.loadRev();

    expect(
      mockResolutionService.shouldDeleteConflictingRevision,
    ).toHaveBeenCalled();
    expect(mockDatabase.remove).toHaveBeenCalledWith(testConflictDoc);
    expect(component.resolution).toBeTruthy();
  });

  it("should resolveByDelete, deleting giving doc", fakeAsync(() => {
    component.loadRev();
    tick();

    component.resolveByDelete(testConflictDoc);
    tick();

    expect(mockDatabase.remove).toHaveBeenCalledWith(testConflictDoc);
    expect(mockDatabase.put).not.toHaveBeenCalled();
    expect(component.resolution).toBeTruthy();
  }));

  it("should resolveByManualEdit, saving new version and removing conflict", fakeAsync(() => {
    component.loadRev();
    tick();

    component.resolveByManualEdit(component.diffsCustom);
    tick();

    expect(mockDatabase.remove).toHaveBeenCalledWith(testConflictDoc);
    expect(mockDatabase.put).toHaveBeenCalled();
    expect(component.resolution).toBeTruthy();
  }));
});
