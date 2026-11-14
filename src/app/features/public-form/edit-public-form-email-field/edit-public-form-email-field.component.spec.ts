import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl, UntypedFormGroup } from "@angular/forms";
import { By } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { setupCustomFormControlEditComponent } from "../../../core/entity/entity-field-edit/dynamic-edit/edit-component-test-utils";
import { EntityFieldSelectComponent } from "../../../core/entity/entity-field-select/entity-field-select.component";
import { Entity } from "../../../core/entity/model/entity";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { PublicFormConfig } from "../public-form-config";
import { EditPublicFormEmailFieldComponent } from "./edit-public-form-email-field.component";

describe("EditPublicFormEmailFieldComponent", () => {
  let component: EditPublicFormEmailFieldComponent;
  let fixture: ComponentFixture<EditPublicFormEmailFieldComponent>;
  let formGroup: UntypedFormGroup;

  /** a record type with two email fields among fields of other types */
  @DatabaseEntity("PublicFormEmailTestRecord")
  class PublicFormEmailTestRecord extends Entity {
    @DatabaseField({ label: "Name" }) name: string;
    @DatabaseField({ label: "Phone" }) phone: string;
    @DatabaseField({ label: "Contact Email", dataType: "email" })
    contactEmail: string;
    @DatabaseField({ label: "Other Email", dataType: "email" })
    otherEmail: string;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EditPublicFormEmailFieldComponent,
        MockedTestingModule.withState(),
        BrowserAnimationsModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditPublicFormEmailFieldComponent);
    component = fixture.componentInstance;
    formGroup = setupCustomFormControlEditComponent(
      component,
      "confirmationEmailField",
      {},
      fixture,
    );
    // the sibling setting this field depends on, as in the public form's admin form
    formGroup.addControl("sendConfirmationEmail", new FormControl(false));
    fixture.detectChanges();
  });

  /** the field ids the dropdown offers to the admin */
  function offeredFieldIds(): string[] {
    const select = fixture.debugElement.query(
      By.directive(EntityFieldSelectComponent),
    ).componentInstance as EntityFieldSelectComponent;
    select.autocompleteForm.setValue("");
    return select.autocompleteOptions().map((option) => option.asValue);
  }

  function setConfiguredForm(
    entityType?: string,
    collectedFields: string[] = ["name", "contactEmail"],
  ) {
    const formConfig = new PublicFormConfig();
    formConfig.entity = entityType;
    formConfig.columns = [{ fields: collectedFields }];
    fixture.componentRef.setInput("entity", formConfig);
    fixture.detectChanges();
  }

  it("offers only the email fields that the form asks the submitter for", () => {
    setConfiguredForm("PublicFormEmailTestRecord", ["name", "contactEmail"]);

    // not "otherEmail": the form never collects it, so it could not hold an address
    expect(offeredFieldIds()).toEqual(["contactEmail"]);
  });

  it("offers nothing while the form has no record type to take fields from", () => {
    setConfiguredForm();

    expect(offeredFieldIds()).toEqual([]);
  });

  it("requires a field only while the confirmation email is switched on", () => {
    const toggle = formGroup.get("sendConfirmationEmail");
    const field = formGroup.get("confirmationEmailField");

    toggle.setValue(true);
    expect(field.hasError("recipientFieldRequired")).toBe(true);

    field.setValue("contactEmail");
    expect(field.valid).toBe(true);

    field.setValue(null);
    toggle.setValue(false);
    expect(field.valid).toBe(true);
  });
});
