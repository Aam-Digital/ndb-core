import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import { RecurringActivity } from "app/child-dev-project/attendance/model/recurring-activity";
import { defaultInteractionTypes } from "app/core/config/default-config/default-interaction-types";
import { ConfirmationDialogService } from "app/core/confirmation-dialog/confirmation-dialog.service";
import { EntityFormService } from "app/core/entity-components/entity-form/entity-form.service";
import { FormFieldConfig } from "app/core/entity-components/entity-form/entity-form/FormConfig";
import { MockedTestingModule } from "app/utils/mocked-testing.module";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { EditTextWithAutocompleteComponent } from "./edit-text-with-autocomplete.component";
import { By } from "@angular/platform-browser";

describe("EditTextWithAutocompleteComponent", () => {
  let component: EditTextWithAutocompleteComponent;
  let fixture: ComponentFixture<EditTextWithAutocompleteComponent>;
  let loadTypeSpy: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EditTextWithAutocompleteComponent,
        MockedTestingModule.withState(),
      ],
      providers: [
        {
          provide: ConfirmationDialogService,
          useValue: new ConfirmationDialogService(null),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditTextWithAutocompleteComponent);
    component = fixture.componentInstance;
    loadTypeSpy = spyOn(TestBed.inject(EntityMapperService), "loadType");
    const entityFormService = TestBed.inject(EntityFormService);
    component.parent = entityFormService.createFormGroup(
      [
        { id: "title" },
        { id: "type" },
        { id: "assignedTo" },
        { id: "linkedGroups" },
      ],
      new RecurringActivity()
    );
    component.formControl = component.parent.get(
      "title"
    ) as FormControl<string>;
    component.formControlName = "title";
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should show all entities of the given type", fakeAsync(() => {
    const rA1 = RecurringActivity.create("First Recurring Activity");
    const rA2 = RecurringActivity.create("Second Recurring Activity");
    loadTypeSpy.and.resolveTo([rA1, rA2]);

    initComponent();
    tick();

    expect(loadTypeSpy).toHaveBeenCalled();
    expect(component.entities).toEqual([rA1, rA2]);
    component.formControl.setValue("Activity");
    component.updateAutocomplete();
    expect(component.autocompleteEntities.value).toEqual([rA1, rA2]);
  }));

  it("should correctly set the form controls to the selected entity's values", fakeAsync(() => {
    const rA1 = RecurringActivity.create("First Recurring Activity");
    rA1.type = defaultInteractionTypes[0];
    rA1.assignedTo = ["user1", "user2"];
    rA1.linkedGroups = ["group1", "group2"];
    loadTypeSpy.and.resolveTo([rA1]);

    initComponent();
    tick();
    component.selectEntity(rA1);
    tick();
    expect(component.formControl).toHaveValue(rA1.title);
    expect(component.parent.get("type")).toHaveValue(rA1.type);
    expect(component.parent.get("assignedTo")).toHaveValue(rA1.assignedTo);
    expect(component.parent.get("linkedGroups")).toHaveValue(rA1.linkedGroups);
  }));

  it("should correctly reset the form to its original values", fakeAsync(() => {
    const rA1 = RecurringActivity.create("First Recurring Activity");
    rA1.type = defaultInteractionTypes[0];
    rA1.assignedTo = ["user1", "user2"];
    rA1.linkedGroups = ["group1", "group2"];
    rA1.participants = ["student1", "student2"];
    loadTypeSpy.and.resolveTo([rA1]);
    component.parent.get("linkedGroups").setValue(["testgroup1"]);

    initComponent();
    tick();

    component.selectEntity(rA1);
    tick();

    component.resetForm();
    tick();

    expect(component.formControl).toHaveValue("");
    expect(component.parent.get("type")).toHaveValue(null);
    expect(component.parent.get("assignedTo")).toHaveValue([]);
    expect(component.parent.get("linkedGroups")).toHaveValue(["testgroup1"]);
    expect(component.parent.get("participants")).toBeFalsy();
  }));

  it("should add the given relevantValue to the form control of the relevant property", fakeAsync(() => {
    const rA1 = RecurringActivity.create("First Recurring Activity");
    rA1.linkedGroups = ["group1", "group2"];
    loadTypeSpy.and.resolveTo([rA1]);

    initComponent("linkedGroups", "group3");
    tick();
    component.selectEntity(rA1);
    tick();
    expect(component.parent.get("linkedGroups").value).toContain("group3");
  }));

  it("should show name of the selected entity", fakeAsync(() => {
    const rA1 = RecurringActivity.create("First Recurring Activity");
    const rA2 = RecurringActivity.create("Second Recurring Activity");
    component.formControl.setValue(rA1.title);
    loadTypeSpy.and.resolveTo([rA1, rA2]);

    initComponent();

    tick();
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.debugElement.query(
      By.css("input")
    ).nativeElement;
    expect(input.value).toEqual("First Recurring Activity");
  }));

  // check if values in the form control have been manually changed after loading the entity
  it("should only load new entity if user confirms to override changes", fakeAsync(() => {
    const rA1 = RecurringActivity.create("First Recurring Activity");
    const rA2 = RecurringActivity.create("Second Recurring Activity");
    rA1.type = defaultInteractionTypes[0];
    rA1.assignedTo = ["user1", "user2"];
    rA1.linkedGroups = ["group1", "group2"];
    loadTypeSpy.and.resolveTo([rA1, rA2]);

    const confirmationDialogueSpy: jasmine.Spy = spyOn(
      TestBed.inject(ConfirmationDialogService),
      "getConfirmation"
    );
    confirmationDialogueSpy.and.resolveTo(true);

    initComponent();
    tick();
    component.formControl.setValue("test1");
    component.parent.get("assignedTo").setValue(["user3"]);
    component.selectEntity(rA2);
    tick();

    expect(component.selectedEntity).toEqual(rA2);
  }));

  function initComponent(relevantProperty?, relevantValue?): Promise<any> {
    const res: FormFieldConfig = {
      id: "title",
      additional: {
        entityType: "RecurringActivity",
      },
    };

    if (relevantProperty && relevantValue) {
      res.additional.relevantProperty = relevantProperty;
      res.additional.relevantValue = relevantValue;
    }
    component.formFieldConfig = res;
    component.propertySchema = RecurringActivity.schema.get("title");
    component.entity = new RecurringActivity();
    return component.ngOnInit();
  }
});
