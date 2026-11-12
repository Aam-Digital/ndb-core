import { ComponentFixture, TestBed } from "@angular/core/testing";
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

  /** a record type with one email field among fields of other types */
  @DatabaseEntity("PublicFormEmailTestRecord")
  class PublicFormEmailTestRecord extends Entity {
    @DatabaseField({ label: "Name" }) name: string;
    @DatabaseField({ label: "Phone" }) phone: string;
    @DatabaseField({ label: "Contact Email", dataType: "email" })
    contactEmail: string;
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
    setupCustomFormControlEditComponent(
      component,
      "confirmationEmailField",
      {},
      fixture,
    );
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

  function setConfiguredRecordType(entityType?: string) {
    const formConfig = new PublicFormConfig();
    formConfig.entity = entityType;
    fixture.componentRef.setInput("entity", formConfig);
    fixture.detectChanges();
  }

  it("offers only fields that hold an email address", () => {
    setConfiguredRecordType("PublicFormEmailTestRecord");

    expect(offeredFieldIds()).toEqual(["contactEmail"]);
  });

  it("offers nothing while the form has no record type to take fields from", () => {
    setConfiguredRecordType();

    expect(offeredFieldIds()).toEqual([]);
  });
});
