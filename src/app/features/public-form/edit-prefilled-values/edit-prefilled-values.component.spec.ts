import { setupCustomFormControlEditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component-test-utils";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatTooltipModule } from "@angular/material/tooltip";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { Entity } from "app/core/entity/model/entity";
import { TestEntity } from "app/utils/test-utils/TestEntity";
import { EditPrefilledValuesComponent } from "./edit-prefilled-values.component";

describe("EditPrefilledValuesComponent", () => {
  let component: EditPrefilledValuesComponent;
  let fixture: ComponentFixture<EditPrefilledValuesComponent>;
  let mockEntityRegistry: Partial<EntityRegistry>;

  beforeEach(async () => {
    mockEntityRegistry = {
      get: vi.fn().mockReturnValue(Entity),
    };

    await TestBed.configureTestingModule({
      imports: [
        EditPrefilledValuesComponent,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatTooltipModule,
        FontAwesomeTestingModule,
        MatButtonModule,
        NoopAnimationsModule,
      ],
      providers: [{ provide: EntityRegistry, useValue: mockEntityRegistry }],
    }).compileComponents();

    fixture = TestBed.createComponent(EditPrefilledValuesComponent);
    component = fixture.componentInstance;

    setupCustomFormControlEditComponent(component, "testProperty", {}, fixture);
    fixture.componentRef.setInput("entity", new TestEntity());

    fixture.detectChanges();
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
  });

  it("should remove a field from prefilled values", () => {
    component.prefilledValues.push(
      new FormBuilder().group({
        field: "name",
        defaultValue: {
          mode: "static",
          config: {
            value: "Default name",
          },
        },
        hideFromForm: true,
      }),
    );

    component.removePrefilledFields(0);

    expect(component.prefilledValues.length).toBe(0);
  });

  it("should be invalid when a newly added prefilled field has mode set but no config value", () => {
    component.addPrefilledFields();
    component.prefilledValues.at(0).get("field").setValue("name");
    // defaultValue stays { mode: "static" } with no config — incomplete

    expect(component.prefilledValueSettings.invalid).toBe(true);
  });

  it("should update isDisabled signal when formControl status changes, enabling OnPush CD for view-mode blocking", () => {
    expect(component.isDisabled()).toBe(false);

    component.formControl.disable();
    expect(component.isDisabled()).toBe(true);
    expect(component.prefilledValueSettings.disabled).toBe(true);

    component.formControl.enable();
    expect(component.isDisabled()).toBe(false);
    expect(component.prefilledValueSettings.disabled).toBe(false);
  });

  it("should be invalid when default value is cleared (null) after being set", () => {
    component.addPrefilledFields();
    component.prefilledValues.at(0).get("field").setValue("name");
    component.prefilledValues
      .at(0)
      .get("defaultValue")
      .setValue({ mode: "static", config: { value: "test" } });
    component.prefilledValues.at(0).get("defaultValue").setValue(null);

    expect(component.prefilledValueSettings.invalid).toBe(true);
    expect(component.formControl.errors).toBeTruthy();
  });

  it("should not mark formControl dirty when prefilledValueSettings emits the same effective value", () => {
    component.addPrefilledFields();
    component.prefilledValues.at(0).get("field").setValue("name");
    component.prefilledValues
      .at(0)
      .get("defaultValue")
      .setValue({ mode: "static", config: { value: "test" } });

    component.formControl.markAsPristine();

    component.prefilledValues
      .at(0)
      .get("defaultValue")
      .setValue({ mode: "static", config: { value: "test" } });

    expect(component.formControl.pristine).toBe(true);
  });
});
