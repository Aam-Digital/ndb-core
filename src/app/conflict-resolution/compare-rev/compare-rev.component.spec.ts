import {
  async,
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { CompareRevComponent } from "./compare-rev.component";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatExpansionModule } from "@angular/material/expansion";
import { FormsModule } from "@angular/forms";
import { ConflictResolutionStrategyService } from "../conflict-resolution-strategy/conflict-resolution-strategy.service";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ConfirmationDialogService } from "../../core/confirmation-dialog/confirmation-dialog.service";
import { Database } from "../../core/database/database";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { BehaviorSubject } from "rxjs";

describe("CompareRevComponent", () => {
  let component: CompareRevComponent;
  let fixture: ComponentFixture<CompareRevComponent>;

  let mockDatabase: jasmine.SpyObj<Database>;

  const testDoc = { _id: "abc", _rev: "rev-1a", value: 1 };
  const testConflictDoc = { _id: "abc", _rev: "rev-1b", value: 2 };

  beforeEach(async(() => {
    mockDatabase = jasmine.createSpyObj("mockDatabase", [
      "get",
      "remove",
      "put",
    ]);
    mockDatabase.get.and.returnValue(Promise.resolve(testConflictDoc));

    const confDialogMock = {
      // by default immediately simulate a confirmed dialog result
      openDialog: () => ({ afterClosed: () => new BehaviorSubject(true) }),
    };
    spyOn(confDialogMock, "openDialog").and.callThrough();

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
        ConflictResolutionStrategyService,
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
    const conflictResolutionService = TestBed.get(
      ConflictResolutionStrategyService
    );
    mockDatabase.get.and.returnValue(Promise.resolve(testConflictDoc));
    spyOn(
      conflictResolutionService,
      "isIrrelevantConflictVersion"
    ).and.returnValue(true);

    await component.loadRev();

    expect(
      conflictResolutionService.isIrrelevantConflictVersion
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
