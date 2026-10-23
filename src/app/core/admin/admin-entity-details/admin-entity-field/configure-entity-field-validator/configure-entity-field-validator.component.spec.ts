import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from "@angular/forms";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ConfigureEntityFieldValidatorComponent } from "./configure-entity-field-validator.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { MatSelectHarness } from "@angular/material/select/testing";
import {
  DatabaseEntity,
  EntityRegistry,
  entityRegistry,
} from "../../../../entity/database-entity.decorator";
import { DatabaseField } from "../../../../entity/database-field.decorator";
import { Entity } from "../../../../entity/model/entity";
import {
  EntitySchemaField,
  WithinParentConfig,
} from "../../../../entity/schema/entity-schema-field";

@DatabaseEntity("ValidatorTestProject")
class ValidatorTestProject extends Entity {
  @DatabaseField({ dataType: "date-range", label: "Planned period" })
  plannedPeriod: unknown;
  @DatabaseField({ dataType: "date", label: "Start" }) start: Date;
}

@DatabaseEntity("ValidatorTestAction")
class ValidatorTestAction extends Entity {
  @DatabaseField({
    dataType: "entity",
    additional: "ValidatorTestAction",
    label: "Parent",
  })
  parent: string;
  @DatabaseField({
    dataType: "entity",
    additional: "ValidatorTestProject",
    label: "Project",
  })
  project: string;
  @DatabaseField({ dataType: "date-range", label: "Period" }) period: unknown;
}

describe("ConfigureEntityFieldValidatorComponent", () => {
  let component: ConfigureEntityFieldValidatorComponent;
  let fixture: ComponentFixture<ConfigureEntityFieldValidatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule,
        MatButtonModule,
        FontAwesomeModule,
        FormsModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        FontAwesomeTestingModule,
      ],
      providers: [
        FormBuilder,
        { provide: EntityRegistry, useValue: entityRegistry },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigureEntityFieldValidatorComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("entitySchemaField", {
      validators: { required: false },
    });

    fixture.detectChanges();
  });

  it("should remove unchanged default values before emitting output", () => {
    // set up
    const testFormValues = {
      required: true,
      min: null,
      max: 100,
      minAge: null,
      maxAge: 12,
      minDate: null,
      maxDate: new Date(2010, 0, 1),
      pattern: "abc",
      uniqueId: "",
    };

    // execute
    const actualResult =
      component.removeDefaultValuesFromValidatorConfig(testFormValues);

    // check result
    const expectedResult = {
      required: true,
      max: 100,
      maxAge: 12,
      maxDate: new Date(2010, 0, 1),
      pattern: "abc",
    };
    expect(actualResult).toEqual(expectedResult);
  });

  it("should load existing pattern config and emit edited pattern and custom message under the 'pattern' key", () => {
    fixture.componentRef.setInput("entitySchemaField", {
      dataType: "string",
      validators: { pattern: { pattern: "[0-9]{10}", message: "custom msg" } },
    });
    fixture.detectChanges();

    const patternControl = component
      .validatorForm()
      .get("pattern") as AbstractControl;
    const messageControl = component
      .validatorForm()
      .get("patternMessage") as AbstractControl;
    expect(patternControl?.value).toBe("[0-9]{10}");
    expect(messageControl?.value).toBe("custom msg");

    let emitted;
    component.entityValidatorChanges.subscribe((v) => (emitted = v));

    patternControl.setValue("[a-z]+");
    expect(emitted).toEqual({
      pattern: { pattern: "[a-z]+", message: "custom msg" },
    });

    messageControl.setValue("");
    expect(emitted).toEqual({ pattern: "[a-z]+" });

    messageControl.setValue("only lowercase letters");
    expect(emitted).toEqual({
      pattern: { pattern: "[a-z]+", message: "only lowercase letters" },
    });

    patternControl.setValue("");
    expect(emitted).toEqual({});
    expect(messageControl.disabled).toBe(true); // message only editable while a pattern is set
  });

  it("should flag invalid regex input as control error and not emit it", () => {
    fixture.componentRef.setInput("entitySchemaField", {
      dataType: "string",
      validators: {},
    });
    fixture.detectChanges();

    let emitted;
    component.entityValidatorChanges.subscribe((v) => (emitted = v));

    const patternControl = component
      .validatorForm()
      .get("pattern") as AbstractControl;
    const messageControl = component
      .validatorForm()
      .get("patternMessage") as AbstractControl;
    expect(messageControl.disabled).toBe(true); // disabled while no pattern is set

    patternControl.setValue("[a-z");

    expect(patternControl.hasError("invalidPattern")).toBe(true);
    expect(emitted).toEqual({});
    expect(messageControl.enabled).toBe(true); // editable as soon as user types a pattern
  });

  describe("period of a linked record", () => {
    async function renderDateRangeField(withinParent?: WithinParentConfig) {
      const field: EntitySchemaField = {
        ...ValidatorTestAction.schema.get("period"),
        withinParent,
      };
      fixture.componentRef.setInput("entityType", ValidatorTestAction);
      fixture.componentRef.setInput("entitySchemaField", field);
      fixture.detectChanges();

      const emitted: Partial<EntitySchemaField>[] = [];
      component.entitySchemaFieldChanges.subscribe((c) => emitted.push(c));
      const select =
        await TestbedHarnessEnvironment.loader(fixture).getHarness(
          MatSelectHarness,
        );
      return { select, emitted };
    }

    it("offers the date range fields of the linked record types, and this field for a link to the same type", async () => {
      const { select } = await renderDateRangeField();
      await select.open();

      const options = await select.getOptions();
      expect(await Promise.all(options.map((o) => o.getText()))).toEqual([
        "none",
        "Parent › Period",
        "Project › Planned period",
      ]);
    });

    it.each<[string, WithinParentConfig | undefined]>([
      ["Parent › Period", { parentReferenceField: "parent" }],
      [
        "Project › Planned period",
        { parentReferenceField: "project", parentValueField: "plannedPeriod" },
      ],
      ["none", undefined],
    ])(
      "sets the field's withinParent when selecting %s",
      async (text, expected) => {
        const { select, emitted } = await renderDateRangeField({
          parentReferenceField: "somethingElse",
        });

        await select.clickOptions({ text });

        expect(emitted.at(-1)).toEqual({ withinParent: expected });
      },
    );

    it("offers this field for a link to the same type while the new field has no label yet", async () => {
      fixture.componentRef.setInput("entityType", ValidatorTestAction);
      fixture.componentRef.setInput("entitySchemaField", {
        dataType: "date-range",
      });
      fixture.detectChanges();
      const select =
        await TestbedHarnessEnvironment.loader(fixture).getHarness(
          MatSelectHarness,
        );
      await select.open();

      const options = await select.getOptions({ text: /^Parent/ });
      expect(await options[0].getText()).toBe("Parent › this field");
    });

    it("shows the saved setting", async () => {
      const { select } = await renderDateRangeField({
        parentReferenceField: "project",
        parentValueField: "plannedPeriod",
      });

      expect(await select.getValueText()).toBe("Project › Planned period");
    });
  });
});
