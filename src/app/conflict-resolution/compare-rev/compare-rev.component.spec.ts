import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CompareRevComponent } from "./compare-rev.component";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatExpansionModule } from "@angular/material/expansion";
import { FormsModule } from "@angular/forms";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ConfirmationDialogService } from "../../core/confirmation-dialog/confirmation-dialog.service";
import { Database } from "../../core/database/database";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { of } from "rxjs";
import { AutoResolutionService } from "../auto-resolution/auto-resolution.service";

describe("CompareRevComponent", () => {
  let component: CompareRevComponent;
  let fixture: ComponentFixture<CompareRevComponent>;

  let mockDatabase: jasmine.SpyObj<Database>;
  let mockResolutionService: jasmine.SpyObj<AutoResolutionService>;

  const testDoc = { _id: "abc", _rev: "rev-1a", value: 1 };
  const testConflictDoc = { _id: "abc", _rev: "rev-1b", value: 2 };
  let confDialogMock;
  let dialogClosedObserver;

  beforeEach(async(() => {
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
      false
    );

    confDialogMock = jasmine.createSpyObj("confDialogMock", ["openDialog"]);
    dialogClosedObserver = of(true);
    confDialogMock.openDialog.and.returnValue({
      afterClosed: () => dialogClosedObserver,
    });

    TestBed.configureTestingModule({
      imports: [
        MatTooltipModule,
        MatExpansionModule,
        MatSnackBarModule,
        FormsModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: ConfirmationDialogService, useValue: confDialogMock },
        { provide: Database, useValue: mockDatabase },
        { provide: AutoResolutionService, useValue: mockResolutionService },
      ],
      declarations: [CompareRevComponent],
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
      mockResolutionService.shouldDeleteConflictingRevision
    ).toHaveBeenCalled();
    expect(mockDatabase.remove).toHaveBeenCalledWith(testConflictDoc);
    expect(component.resolution).toBeTruthy();
  });

  it("should resolveByDelete, deleting giving doc", async () => {
    await component.loadRev();

    await component.resolveByDelete(testConflictDoc);
    await confDialogMock.openDialog().afterClosed().toPromise();

    expect(mockDatabase.remove).toHaveBeenCalledWith(testConflictDoc);
    expect(mockDatabase.put).not.toHaveBeenCalled();
    expect(component.resolution).toBeTruthy();
  });

  it("should resolveByManualEdit, saving new version and removing conflict", async () => {
    await component.loadRev();

    await component.resolveByManualEdit(component.diffsCustom);

    await confDialogMock.openDialog().afterClosed().toPromise();

    expect(mockDatabase.remove).toHaveBeenCalledWith(testConflictDoc);
    expect(mockDatabase.put).toHaveBeenCalled();
    expect(component.resolution).toBeTruthy();
  });
});
