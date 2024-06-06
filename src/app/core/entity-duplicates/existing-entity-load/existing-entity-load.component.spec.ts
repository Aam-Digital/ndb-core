import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { ExistingEntityLoadComponent } from "./existing-entity-load.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { EntityFormService } from "../../common-components/entity-form/entity-form.service";
import { RecurringActivity } from "../../../child-dev-project/attendance/model/recurring-activity";
import { defaultInteractionTypes } from "../../config/default-config/default-interaction-types";
import { SimpleChange } from "@angular/core";

describe("ExistingEntityLoadComponent", () => {
  let component: ExistingEntityLoadComponent;
  let fixture: ComponentFixture<ExistingEntityLoadComponent>;

  let loadTypeSpy: jasmine.Spy;
  let mockConfirmationDialog: jasmine.SpyObj<ConfirmationDialogService>;

  beforeEach(waitForAsync(() => {
    mockConfirmationDialog = jasmine.createSpyObj(["getConfirmation"]);
    TestBed.configureTestingModule({
      imports: [ExistingEntityLoadComponent, MockedTestingModule.withState()],
      providers: [
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialog,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExistingEntityLoadComponent);
    component = fixture.componentInstance;
    loadTypeSpy = spyOn(TestBed.inject(EntityMapperService), "loadType");
    loadTypeSpy.and.resolveTo([]);
    const entityFormService = TestBed.inject(EntityFormService);

    component.form = entityFormService.createFormGroup(
      [
        { id: "title" },
        { id: "type" },
        { id: "assignedTo" },
        { id: "linkedGroups" },
      ],
      new RecurringActivity(),
    );
    component.defaultEntity = new RecurringActivity();
    fixture.detectChanges();
  }));

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should show all entities of the given type", fakeAsync(() => {
    const rA1 = RecurringActivity.create("First Recurring Activity");
    const rA2 = RecurringActivity.create("Second Recurring Activity");
    loadTypeSpy.and.resolveTo([rA1, rA2]);

    component.ngOnChanges({ form: new SimpleChange(null, null, null) });
    tick();

    expect(loadTypeSpy).toHaveBeenCalled();
    expect(component.suggestedEntities.value).toEqual([rA1, rA2]);
  }));

  it("should correctly set the form controls to the selected entity's values, when user selects existing suggestion", fakeAsync(() => {
    const rA1 = RecurringActivity.create("First Recurring Activity");
    rA1.type = defaultInteractionTypes[0];
    rA1.assignedTo = ["user1", "user2"];
    rA1.linkedGroups = ["group1", "group2"];
    loadTypeSpy.and.resolveTo([rA1]);
    component.ngOnChanges({ form: new SimpleChange(null, null, null) });
    tick();

    component.selectEntity(rA1);

    expect(component.form.get("title")).toHaveValue(rA1.title);
    expect(component.form.get("type")).toHaveValue(rA1.type);
    expect(component.form.get("assignedTo")).toHaveValue(rA1.assignedTo);
    expect(component.form.get("linkedGroups")).toHaveValue(rA1.linkedGroups);
  }));

  it("should correctly reset the form to its original values", fakeAsync(() => {
    const rA1 = RecurringActivity.create("First Recurring Activity");
    rA1.type = defaultInteractionTypes[0];
    rA1.assignedTo = ["user1", "user2"];
    rA1.linkedGroups = ["group1", "group2"];
    rA1.participants = ["student1", "student2"];
    loadTypeSpy.and.resolveTo([rA1]);
    component.form.get("linkedGroups").setValue(["testgroup1"]);
    component.ngOnChanges({ form: new SimpleChange(null, null, null) });
    tick();
    component.selectEntity(rA1);
    tick();

    component.resetToCreateNew();
    tick();

    expect(component.selectedEntity).toBeUndefined();
    expect(component.form.get("title")).toHaveValue("");
    expect(component.form.get("type")).toHaveValue(null);
    expect(component.form.get("assignedTo")).toHaveValue([]);
    expect(component.form.get("linkedGroups")).toHaveValue(["testgroup1"]);
    expect(component.form.get("participants")).toBeFalsy();
  }));

  it("should add the given values from the default entity (e.g. the ref to link) to the form control of the relevant property", fakeAsync(() => {
    const rA1 = RecurringActivity.create("First Recurring Activity");
    rA1.linkedGroups = ["group1", "group2"];
    loadTypeSpy.and.resolveTo([rA1]);
    component.defaultEntity = Object.assign(new RecurringActivity(), {
      linkedGroups: "group3",
    });
    component.ngOnChanges({ form: new SimpleChange(null, null, null) });
    tick();

    component.selectEntity(rA1);

    expect(component.form.get("linkedGroups").value).toContain("group3");
  }));

  // check if values in the form control have been manually changed after loading the entity
  it("should only load new entity if user confirms to override changes", fakeAsync(() => {
    const rA1 = RecurringActivity.create("First Recurring Activity");
    const rA2 = RecurringActivity.create("Second Recurring Activity");
    rA1.type = defaultInteractionTypes[0];
    rA1.assignedTo = ["user1", "user2"];
    rA1.linkedGroups = ["group1", "group2"];
    loadTypeSpy.and.resolveTo([rA1, rA2]);
    mockConfirmationDialog.getConfirmation.and.resolveTo(true);

    component.ngOnChanges({ form: new SimpleChange(null, null, null) });
    tick();

    component.form.get("title").setValue("test1");
    component.form.get("assignedTo").setValue(["user3"]);

    component.selectEntity(rA2);
    tick();

    expect(mockConfirmationDialog.getConfirmation).toHaveBeenCalled();
    expect(component.selectedEntity).toEqual(rA2);
  }));
});
