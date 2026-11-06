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
import { Entity, EntityConstructor } from "../../../../entity/model/entity";
import { EntitySchemaField } from "../../../../entity/schema/entity-schema-field";
import {
  FormValidatorConfig,
  WithinParentConfig,
} from "../../../../common-components/entity-form/dynamic-form-validators/form-validator-config";
import { TranslatableText } from "../../../../config/multi-lingual-config";
import { mockEntityMapperProvider } from "../../../../entity/entity-mapper/mock-entity-mapper-service";
import { By } from "@angular/platform-browser";
import { CoreTestingModule } from "../../../../../utils/core-testing.module";
import { DynamicValidatorsService } from "../../../../common-components/entity-form/dynamic-form-validators/dynamic-validators.service";
import { FieldValidator } from "../../../../common-components/entity-form/dynamic-form-validators/field-validator";
import { AdminDisplayConditionButtonComponent } from "../../../building-blocks/admin-display-condition-button/admin-display-condition-button.component";

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
        CoreTestingModule,
      ],
      providers: [
        FormBuilder,
        { provide: EntityRegistry, useValue: entityRegistry },
        ...mockEntityMapperProvider(),
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
      range: { min: null, max: 100 },
      ageRange: { min: null, max: null },
      dateRange: { min: null, max: new Date(2010, 0, 1) },
      pattern: "abc",
      uniqueId: "",
    };

    // execute
    const actualResult =
      component.removeDefaultValuesFromValidatorConfig(testFormValues);

    // check result
    const expectedResult = {
      required: true,
      range: { max: 100 },
      dateRange: { max: new Date(2010, 0, 1) },
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

  describe("validators fitting the selected type", () => {
    function renderField(validators: FormValidatorConfig) {
      fixture.componentRef.setInput("entitySchemaField", {
        dataType: "string",
        validators,
      });
      fixture.detectChanges();
      const emitted: FormValidatorConfig[] = [];
      component.entityValidatorChanges.subscribe((v) => emitted.push(v));
      return emitted;
    }

    it("drops the validators not fitting a newly selected type, and keeps the others", () => {
      const emitted = renderField({ required: true, pattern: "[a-z]+" });

      fixture.componentRef.setInput("dataType", "number");
      fixture.detectChanges();

      const labels = fixture.nativeElement.textContent;
      expect(labels).not.toContain("Pattern (Regex)");
      expect(labels).toContain("Maximum Value");
      expect(emitted.at(-1)).toEqual({ required: true });
    });

    it("keeps a setting not fitting the type when opening the field, and saves it if the type is changed to one it fits", () => {
      fixture.componentRef.setInput("entitySchemaField", {
        dataType: "number",
        validators: { pattern: "[0-9]+" },
      });
      fixture.detectChanges();
      const emitted: FormValidatorConfig[] = [];
      component.entityValidatorChanges.subscribe((v) => emitted.push(v));

      fixture.componentRef.setInput("dataType", "string");
      fixture.detectChanges();

      expect(emitted.at(-1)).toEqual({ pattern: "[0-9]+" });
    });

    it("keeps the pattern of an email field when another setting is changed", () => {
      fixture.componentRef.setInput("entitySchemaField", {
        dataType: "email",
        validators: { pattern: "@example\\.org$" },
      });
      fixture.detectChanges();
      const emitted: FormValidatorConfig[] = [];
      component.entityValidatorChanges.subscribe((v) => emitted.push(v));

      component.validatorForm().get("required").setValue(true);

      expect(emitted.at(-1)).toEqual({
        required: true,
        pattern: "@example\\.org$",
      });
    });

    it("removes a disabled trimming once the type is changed to one without trimming", () => {
      fixture.componentRef.setInput("entitySchemaField", {
        dataType: "string",
        trim: false,
      });
      fixture.detectChanges();
      const emitted: Partial<EntitySchemaField>[] = [];
      component.entitySchemaFieldChanges.subscribe((v) => emitted.push(v));

      fixture.componentRef.setInput("dataType", "long-text");
      fixture.detectChanges();
      expect(emitted.at(-1)).toEqual({ trim: undefined });

      fixture.componentRef.setInput("dataType", "string");
      fixture.detectChanges();
      expect(emitted.at(-1)).toEqual({ trim: false });
    });

    it("keeps validators the tab has no setting for, also as only a warning", () => {
      const validators = TestBed.inject(DynamicValidatorsService);
      const getRule = validators.rules.get.bind(validators.rules);
      vi.spyOn(validators.rules, "get").mockImplementation((key) =>
        key === "customRule"
          ? ({ warning: "optional" } as FieldValidator)
          : getRule(key),
      );
      const emitted = renderField({
        customRule: 5,
        _warningOnly: ["customRule"],
      } as FormValidatorConfig);

      component.validatorForm().get("required").setValue(true);

      expect(emitted.at(-1)).toEqual({
        customRule: 5,
        required: true,
        _warningOnly: ["customRule"],
      });
    });

    it("removes settings not fitting the type from the config once the type is changed, not when only opening the field", () => {
      const newFixture = TestBed.createComponent(
        ConfigureEntityFieldValidatorComponent,
      );
      newFixture.componentRef.setInput("entitySchemaField", {
        dataType: "number",
        validators: { range: { min: 5 }, pattern: "[0-9]+" },
      });
      const emitted: FormValidatorConfig[] = [];
      newFixture.componentInstance.entityValidatorChanges.subscribe((v) =>
        emitted.push(v),
      );

      newFixture.detectChanges();
      expect(emitted).toEqual([]);

      newFixture.componentRef.setInput("dataType", "string");
      newFixture.detectChanges();
      expect(emitted.at(-1)).toEqual({ pattern: "[0-9]+" });
    });

    it.each([null, /^\d+$/])(
      "shows a pattern given as %s in the config",
      (pattern) => {
        renderField({ pattern });

        expect(component.validatorForm().get("pattern").value).toBe(
          pattern?.source ?? "",
        );
      },
    );

    it("saves the ends of a range that are set, and the range as only a warning", () => {
      fixture.componentRef.setInput("entitySchemaField", {
        dataType: "number",
        validators: {},
      });
      fixture.detectChanges();
      const emitted: FormValidatorConfig[] = [];
      component.entityValidatorChanges.subscribe((v) => emitted.push(v));

      component.validatorForm().get("range.max").setValue(10);
      component.setWarningOnly("range", true);
      expect(emitted.at(-1)).toEqual({
        range: { max: 10 },
        _warningOnly: ["range"],
      });

      component.validatorForm().get("range.max").setValue(null);
      expect(emitted.at(-1)).toEqual({});
    });

    it("saves the validators that are only a warning, as long as they are set", () => {
      const emitted = renderField({ pattern: "[a-z]+" });

      component.setWarningOnly("pattern", true);
      expect(emitted.at(-1)).toEqual({
        pattern: "[a-z]+",
        _warningOnly: ["pattern"],
      });

      component.validatorForm().get("pattern").setValue("");
      expect(emitted.at(-1)).toEqual({});
    });
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
        validators: withinParent && { withinParent },
      };
      fixture.componentRef.setInput("entityType", ValidatorTestAction);
      fixture.componentRef.setInput("entitySchemaField", field);
      fixture.detectChanges();

      const emitted: FormValidatorConfig[] = [];
      component.entityValidatorChanges.subscribe((v) => emitted.push(v));
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

        expect(emitted.at(-1)?.withinParent).toEqual(expected);
      },
    );

    it.each<[string, TranslatableText | undefined, string]>([
      ["has no label yet (a new field)", undefined, "Parent › this field"],
      [
        "has a label in several languages",
        { en: "Planned period", de: "Geplanter Zeitraum" },
        "Parent › Planned period",
      ],
    ])(
      "names this field for a link to the same type when it %s",
      async (_, label, expected) => {
        fixture.componentRef.setInput("entityType", ValidatorTestAction);
        fixture.componentRef.setInput("entitySchemaField", {
          dataType: "date-range",
          label,
        } as EntitySchemaField);
        fixture.detectChanges();
        const select =
          await TestbedHarnessEnvironment.loader(fixture).getHarness(
            MatSelectHarness,
          );
        await select.open();

        const options = await select.getOptions({ text: /^Parent/ });
        expect(await options[0].getText()).toBe(expected);
      },
    );

    it("does not keep the setting for a field that is not a date range", async () => {
      fixture.componentRef.setInput("entitySchemaField", {
        dataType: "string",
        validators: { withinParent: { parentReferenceField: "parent" } },
      });
      fixture.detectChanges();
      const emitted: FormValidatorConfig[] = [];
      component.entityValidatorChanges.subscribe((v) => emitted.push(v));

      component.validatorForm().get("required").setValue(true);

      expect(emitted.at(-1)).toEqual({ required: true });
    });

    it("drops the setting when the type of the field is changed to another one", async () => {
      const { emitted } = await renderDateRangeField({
        parentReferenceField: "parent",
      });

      fixture.componentRef.setInput("dataType", "string");
      fixture.detectChanges();

      expect(emitted.at(-1)).toEqual({});
    });

    it("shows the saved setting", async () => {
      const { select } = await renderDateRangeField({
        parentReferenceField: "project",
        parentValueField: "plannedPeriod",
      });

      expect(await select.getValueText()).toBe("Project › Planned period");
    });
  });

  describe("selection filter of a link field", () => {
    const condition = { start: { $exists: true } };

    function renderLinkField(linkedEntityType?: EntityConstructor) {
      fixture.componentRef.setInput("entityType", ValidatorTestAction);
      fixture.componentRef.setInput("linkedEntityType", linkedEntityType);
      fixture.componentRef.setInput(
        "entitySchemaField",
        ValidatorTestAction.schema.get("project"),
      );
      fixture.detectChanges();

      const emitted: FormValidatorConfig[] = [];
      component.entityValidatorChanges.subscribe((v) => emitted.push(v));
      const button = () =>
        fixture.debugElement.query(
          By.directive(AdminDisplayConditionButtonComponent),
        )?.componentInstance as AdminDisplayConditionButtonComponent;
      return { emitted, button };
    }

    it("offers a condition on the linked record type only if the field links to exactly one type", () => {
      const { button } = renderLinkField();
      expect(button()).toBeUndefined();

      fixture.componentRef.setInput("linkedEntityType", ValidatorTestProject);
      fixture.detectChanges();

      expect(button().entityType()).toBe(ValidatorTestProject);
      expect(button().currentRecordType()).toBe(ValidatorTestAction);
    });

    it("saves the condition as the field's selectionCondition, and removes it again", () => {
      const { emitted, button } = renderLinkField(ValidatorTestProject);

      button().conditionChange.emit(condition);
      expect(emitted.at(-1)).toEqual({ selectionCondition: condition });

      button().conditionChange.emit(null);
      expect(emitted.at(-1)).toEqual({});
    });
  });
});
