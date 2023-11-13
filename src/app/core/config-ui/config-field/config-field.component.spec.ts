import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import {
  ConfigFieldComponent,
  generateSimplifiedId,
} from "./config-field.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { EntitySchemaField_withId } from "../config-entity-form/config-entity-form.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { SimpleChange } from "@angular/core";

describe("ConfigFieldComponent", () => {
  let component: ConfigFieldComponent;
  let fixture: ComponentFixture<ConfigFieldComponent>;

  let testSchemaField: EntitySchemaField_withId;

  beforeEach(() => {
    testSchemaField = {
      id: "test",
    };

    TestBed.configureTestingModule({
      imports: [
        ConfigFieldComponent,
        CoreTestingModule,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: { entitySchemaField: testSchemaField },
        },
        { provide: MatDialogRef, useValue: null },
      ],
    });
    fixture = TestBed.createComponent(ConfigFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should generate id (if new field) from label", fakeAsync(() => {
    const formId = component.form.get("id");
    const formLabel = component.form.get("label");

    formLabel.setValue("new label");
    tick();
    expect(formId.getRawValue()).toBe(testSchemaField.id);

    // simulate configuring new field
    component.entitySchemaField = { id: null };
    component.ngOnChanges({
      entitySchemaField: new SimpleChange(
        null,
        component.entitySchemaField,
        true,
      ),
    });

    formLabel.setValue("new label", { emitEvents: true });
    tick();
    expect(formId.getRawValue()).toBe("new_label");

    // manual edit id field stops auto generation of id
    formId.setValue("myId");
    formLabel.setValue("other label");
    tick();
    expect(formId.getRawValue()).toBe("myId");
  }));

  it("should generate simplified ids", fakeAsync(() => {
    expect(generateSimplifiedId("xxx ")).toBe("xxx");
    expect(generateSimplifiedId("x ...")).toBe("x");
    expect(generateSimplifiedId("x.y")).toBe("x_y");
    expect(generateSimplifiedId("my  label")).toBe("my_label");
    expect(generateSimplifiedId("my_label")).toBe("my_label");
  }));
});
