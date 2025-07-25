import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import { RecurringActivity } from "../../../child-dev-project/attendance/model/recurring-activity";
import { defaultInteractionTypes } from "../../config/default-config/default-interaction-types";
import { ConfirmationDialogService } from "../confirmation-dialog/confirmation-dialog.service";
import { EntityFormService } from "../entity-form/entity-form.service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { EditTextWithAutocompleteComponent } from "./edit-text-with-autocomplete.component";
import { By } from "@angular/platform-browser";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";

describe("EditTextWithAutocompleteComponent", () => {
  let component: EditTextWithAutocompleteComponent;
  let fixture: ComponentFixture<EditTextWithAutocompleteComponent>;
  let loadTypeSpy: jasmine.Spy;
  let mockConfirmationDialog: jasmine.SpyObj<ConfirmationDialogService>;

  beforeEach(waitForAsync(() => {
    mockConfirmationDialog = jasmine.createSpyObj(["getConfirmation"]);
    TestBed.configureTestingModule({
      imports: [
        EditTextWithAutocompleteComponent,
        MockedTestingModule.withState(),
      ],
      providers: [
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialog,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(waitForAsync(async () => {
    fixture = TestBed.createComponent(EditTextWithAutocompleteComponent);
    component = fixture.componentInstance;
    loadTypeSpy = spyOn(TestBed.inject(EntityMapperService), "loadType");
    loadTypeSpy.and.resolveTo([]);
    const entityFormService = TestBed.inject(EntityFormService);
    component.parent = (
      await entityFormService.createEntityForm(
        [
          { id: "title" },
          { id: "type" },
          { id: "assignedTo" },
          { id: "linkedGroups" },
        ],
        new RecurringActivity(),
      )
    ).formGroup;
    component.formControl = component.parent.get(
      "title",
    ) as FormControl<string>;
    component.formControlName = "title";
    component.formFieldConfig = {
      id: "title",
      additional: {
        entityType: "RecurringActivity",
      },
    };
    component.entity = new RecurringActivity();
    fixture.detectChanges();
  }));

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should show all entities of the given type", async () => {
    const rA1 = RecurringActivity.create("First Recurring Activity");
    const rA2 = RecurringActivity.create("Second Recurring Activity");
    loadTypeSpy.and.resolveTo([rA1, rA2]);

    await component.ngOnInit();

    expect(loadTypeSpy).toHaveBeenCalled();
    expect(component.entities).toEqual([rA1, rA2]);
    component.formControl.setValue("Activity");
    component.updateAutocomplete();
    expect(component.autocompleteEntities.value).toEqual([rA1, rA2]);
  });

  it("should correctly set the form controls to the selected entity's values", async () => {
    const rA1 = RecurringActivity.create("First Recurring Activity");
    rA1.type = defaultInteractionTypes[0];
    rA1.assignedTo = ["user1", "user2"];
    rA1.linkedGroups = ["group1", "group2"];
    loadTypeSpy.and.resolveTo([rA1]);
    await component.ngOnInit();

    await component.selectEntity(rA1);

    expect(component.formControl).toHaveValue(rA1.title);
    expect(component.parent.get("type")).toHaveValue(rA1.type);
    expect(component.parent.get("assignedTo")).toHaveValue(rA1.assignedTo);
    expect(component.parent.get("linkedGroups")).toHaveValue(rA1.linkedGroups);
  });

  it("should correctly reset the form to its original values", async () => {
    const rA1 = RecurringActivity.create("First Recurring Activity");
    rA1.type = defaultInteractionTypes[0];
    rA1.assignedTo = ["user1", "user2"];
    rA1.linkedGroups = ["group1", "group2"];
    rA1.participants = ["student1", "student2"];
    loadTypeSpy.and.resolveTo([rA1]);
    component.parent.get("linkedGroups").setValue(["testgroup1"]);
    await component.ngOnInit();
    await component.selectEntity(rA1);

    await component.resetForm();

    expect(component.formControl).toHaveValue("");
    expect(component.parent.get("type")).toHaveValue(null);
    expect(component.parent.get("assignedTo")).toHaveValue([]);
    expect(component.parent.get("linkedGroups")).toHaveValue(["testgroup1"]);
    expect(component.parent.get("participants")).toBeFalsy();
  });

  it("should link the given parent entity's ID in the form control of the relevant property", async () => {
    const parentEntity = new TestEntity();

    const rA1 = RecurringActivity.create("First Recurring Activity");
    rA1.linkedGroups = ["group1", "group2"];
    loadTypeSpy.and.resolveTo([rA1]);
    component.additional.relevantProperty = "linkedGroups";
    component.additional.relatedEntitiesParent = parentEntity;
    await component.ngOnInit();

    await component.selectEntity(rA1);

    expect(component.parent.get("linkedGroups").value).toContain(
      parentEntity.getId(),
    );
  });

  it("should show name of the selected entity", async () => {
    const rA1 = RecurringActivity.create("First Recurring Activity");
    const rA2 = RecurringActivity.create("Second Recurring Activity");
    component.formControl.setValue(rA1.title);
    loadTypeSpy.and.resolveTo([rA1, rA2]);

    await component.ngOnInit();

    fixture.detectChanges();
    const input: HTMLInputElement = fixture.debugElement.query(
      By.css("input"),
    ).nativeElement;
    expect(input.value).toEqual("First Recurring Activity");
  });

  // check if values in the form control have been manually changed after loading the entity
  it("should only load new entity if user confirms to override changes", async () => {
    const rA1 = RecurringActivity.create("First Recurring Activity");
    const rA2 = RecurringActivity.create("Second Recurring Activity");
    rA1.type = defaultInteractionTypes[0];
    rA1.assignedTo = ["user1", "user2"];
    rA1.linkedGroups = ["group1", "group2"];
    loadTypeSpy.and.resolveTo([rA1, rA2]);
    mockConfirmationDialog.getConfirmation.and.resolveTo(true);

    await component.ngOnInit();
    component.formControl.setValue("test1");
    component.parent.get("assignedTo").setValue(["user3"]);

    await component.selectEntity(rA2);

    expect(component.selectedEntity).toEqual(rA2);
  });
});
