import { ComponentFixture, TestBed } from "@angular/core/testing";
import { UntypedFormControl } from "@angular/forms";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import {
  DatabaseEntity,
  EntityRegistry,
  entityRegistry,
} from "#src/app/core/entity/database-entity.decorator";
import { DatabaseField } from "#src/app/core/entity/database-field.decorator";
import { setupCustomFormControlEditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component-test-utils";
import { Entity } from "#src/app/core/entity/model/entity";
import { DataFilter } from "#src/app/core/filter/filters/filters";
import { EditConditionComponent } from "./edit-condition.component";

@DatabaseEntity("EditConditionTestRecord")
class TestRecord extends Entity {
  @DatabaseField({ label: "Name" }) name: string;
  @DatabaseField({ label: "Status" }) status: string;
  // the admin field editor writes the label of a multi-language setup as a map
  @DatabaseField({
    label: { en: "Title", de: "Titel" } as unknown as string,
  })
  title: string;
}

describe("EditConditionComponent", () => {
  let fixture: ComponentFixture<EditConditionComponent>;
  let component: EditConditionComponent;
  let recordType: UntypedFormControl;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditConditionComponent, FontAwesomeTestingModule],
      providers: [{ provide: EntityRegistry, useValue: entityRegistry }],
    }).compileComponents();

    fixture = TestBed.createComponent(EditConditionComponent);
    component = fixture.componentInstance;
    const form = setupCustomFormControlEditComponent(
      component,
      "condition",
      { additional: { entityTypeField: "entity" } },
      fixture,
    );
    recordType = new UntypedFormControl(TestRecord.ENTITY_TYPE);
    form.addControl("entity", recordType);
  });

  it.each([
    [undefined, "All records of the type."],
    [{}, "All records of the type."],
    [{ name: "Asha" }, "Only records matching a condition on: Name"],
    [{ title: "Dr" }, "Only records matching a condition on: Title"],
    [
      { $or: [{ status: "new" }, { $and: [{ name: "Asha" }] }] },
      "Only records matching a condition on: Status, Name",
    ],
  ] as [DataFilter<Entity> | undefined, string][])(
    "for the condition %j describes it as %j",
    (condition, expected) => {
      component.formControl.setValue(condition);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain(expected);
    },
  );

  it("clears the condition when the entity type changes, as it refers to fields of the previous type", () => {
    component.formControl.setValue({ name: "Asha" });
    fixture.detectChanges();

    recordType.setValue("OtherType");

    expect(component.formControl.value).toBeUndefined();
    expect(component.formControl.dirty).toBe(true);
  });

  it("keeps the condition when the entity type is set to the same value", () => {
    component.formControl.setValue({ name: "Asha" });
    fixture.detectChanges();

    recordType.setValue(TestRecord.ENTITY_TYPE);

    expect(component.formControl.value).toEqual({ name: "Asha" });
  });
});
