import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { MatCheckboxHarness } from "@angular/material/checkbox/testing";
import { MatInputHarness } from "@angular/material/input/testing";
import { MatSelectHarness } from "@angular/material/select/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { ConfigureEntityFieldValidatorComponent } from "./configure-entity-field-validator.component";
import { AdminModule } from "../../../admin.module";
import {
  DatabaseEntity,
  EntityRegistry,
  entityRegistry,
} from "../../../../entity/database-entity.decorator";
import { Entity } from "../../../../entity/model/entity";
import { EntitySchemaField } from "../../../../entity/schema/entity-schema-field";
import { FormValidatorConfig } from "../../../../common-components/entity-form/dynamic-form-validators/form-validator-config";
import { DynamicValidatorsService } from "../../../../common-components/entity-form/dynamic-form-validators/dynamic-validators.service";
import { FieldValidator } from "../../../../common-components/entity-form/dynamic-form-validators/field-validator";
import { mockEntityMapperProvider } from "../../../../entity/entity-mapper/mock-entity-mapper-service";
import { CoreTestingModule } from "../../../../../utils/core-testing.module";

@DatabaseEntity("ValidatorTabTestRecord")
class ValidatorTabTestRecord extends Entity {}

describe("ConfigureEntityFieldValidatorComponent", () => {
  let component: ConfigureEntityFieldValidatorComponent;
  let fixture: ComponentFixture<ConfigureEntityFieldValidatorComponent>;
  let emitted: FormValidatorConfig[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        FontAwesomeTestingModule,
        CoreTestingModule,
      ],
      providers: [
        { provide: EntityRegistry, useValue: entityRegistry },
        ...mockEntityMapperProvider(),
      ],
    }).compileComponents();
    // the components that edit the settings of the rules
    TestBed.runInInjectionContext(() => new AdminModule());

    fixture = TestBed.createComponent(ConfigureEntityFieldValidatorComponent);
    component = fixture.componentInstance;
    emitted = [];
    component.entityValidatorChanges.subscribe((v) => emitted.push(v));
  });

  /** show the tab for a field, and wait until the settings components are loaded */
  async function render(field: EntitySchemaField, dataType?: string) {
    fixture.componentRef.setInput("entitySchemaField", field);
    if (dataType) {
      fixture.componentRef.setInput("dataType", dataType);
    }
    await settle();
  }

  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const loader = () => TestbedHarnessEnvironment.loader(fixture);
  const text = () => fixture.nativeElement.textContent as string;
  const rows = () =>
    [
      ...fixture.nativeElement.querySelectorAll(".validator-row"),
    ] as HTMLElement[];

  async function addRuleSelect() {
    return loader().getHarness(
      MatSelectHarness.with({ ancestor: ".add-rule-field" }),
    );
  }

  async function addRule(label: string) {
    const select = await addRuleSelect();
    await select.clickOptions({ text: label });
    await settle();
  }

  async function addableRules() {
    const select = await addRuleSelect();
    await select.open();
    const options = await select.getOptions();
    return Promise.all(options.map((option) => option.getText()));
  }

  it("lists the rules that are set and offers the others in the dropdown", async () => {
    await render({
      dataType: "string",
      validators: { required: true, pattern: "[a-z]+" },
    });

    // the setting of a rule is loaded when it is needed
    await vi.waitFor(() => expect(text()).toContain("Pattern (Regex)"));
    expect(rows().map((row) => row.textContent)).toEqual([
      expect.stringContaining("Required Field"),
      expect.stringContaining("Pattern (Regex)"),
    ]);
    expect(await addableRules()).toEqual([
      "Unique ID [experimental]",
      "Read-only after it is saved",
    ]);
  });

  it("shows that there are no rules for a field without any", async () => {
    await render({ dataType: "string" });

    expect(rows()).toHaveLength(0);
    expect(text()).toContain("no validation rules");
  });

  it("switches a rule without setting on as soon as it is added", async () => {
    await render({ dataType: "string" });

    await addRule("Unique ID [experimental]");

    expect(emitted.at(-1)).toEqual({ uniqueId: true });
    expect(await addableRules()).not.toContain("Unique ID [experimental]");
  });

  it("saves a rule with a setting only once the setting has a value", async () => {
    await render({ dataType: "number" });

    await addRule("Maximum Value");
    expect(emitted).toEqual([]);
    expect(rows()).toHaveLength(1);

    const input = await loader().getHarness(
      MatInputHarness.with({ ancestor: ".validator-row" }),
    );
    await input.setValue("5");
    expect(emitted.at(-1)).toEqual({ max: 5 });
  });

  it("removes a rule with its setting and its mark as only a warning, and offers it again", async () => {
    await render({
      dataType: "number",
      validators: { min: 1, max: 5, _warningOnly: ["max"] },
    });

    rows()[1].querySelector("button").click();
    await settle();

    expect(emitted.at(-1)).toEqual({ min: 1 });
    expect(rows()).toHaveLength(1);
    expect(await addableRules()).toContain("Maximum Value");
  });

  it("offers 'Only a warning' only for rules that can be one", async () => {
    await render({
      dataType: "date-range",
      validators: {
        required: true,
        withinParent: { parentReferenceField: "x" },
      },
    });
    const [required, withinParent] = rows();

    expect(required.textContent).not.toContain("Only a warning");
    expect(withinParent.textContent).toContain(
      "Only a warning: users can still save.",
    );

    await render({ dataType: "number", validators: { max: 5 } }, "number");
    const checkbox = await loader().getHarness(
      MatCheckboxHarness.with({ label: "Only a warning" }),
    );
    await checkbox.check();
    expect(emitted.at(-1)).toEqual({ max: 5, _warningOnly: ["max"] });
  });

  describe("rules fitting the selected type", () => {
    it("shows only the rules that fit the type, and drops the others from the config when the type is changed", async () => {
      await render({
        dataType: "string",
        validators: { required: true, pattern: "[a-z]+" },
      });

      fixture.componentRef.setInput("dataType", "number");
      await settle();

      expect(rows().map((row) => row.textContent)).toEqual([
        expect.stringContaining("Required Field"),
      ]);
      expect(text()).toContain(
        "Not used for this type of field: Pattern (Regex)",
      );
      expect(await addableRules()).toContain("Maximum Value");
      expect(emitted.at(-1)).toEqual({ required: true });
    });

    it("shows a rule again when the type is changed back, and saves it if the type is changed to one it fits", async () => {
      await render({ dataType: "number", validators: { pattern: "[0-9]+" } });
      expect(rows()).toHaveLength(0);

      fixture.componentRef.setInput("dataType", "string");
      await settle();

      expect(rows()).toHaveLength(1);
      expect(emitted.at(-1)).toEqual({ pattern: "[0-9]+" });
    });

    it("keeps the pattern of an email field when another setting is changed", async () => {
      await render({
        dataType: "email",
        validators: { pattern: "@example\\.org$" },
      });

      await addRule("Required Field");

      expect(emitted.at(-1)).toEqual({
        required: true,
        pattern: "@example\\.org$",
      });
    });

    it("does not change the config when only opening the field", async () => {
      await render({
        dataType: "number",
        validators: { min: 5, pattern: "[0-9]+" },
      });

      expect(emitted).toEqual([]);
    });

    it("does not block saving with an invalid setting that is hidden for the selected type", async () => {
      await render({ dataType: "string" });
      await addRule("Pattern (Regex)");
      const input = await loader().getHarness(
        MatInputHarness.with({ ancestor: ".validator-row" }),
      );
      await input.setValue("[a-z");
      expect(component.validatorForm().invalid).toBe(true);

      fixture.componentRef.setInput("dataType", "number");
      await settle();

      expect(component.validatorForm().invalid).toBe(false);
    });

    it("removes a disabled trimming once the type is changed to one without trimming", async () => {
      const changes: Partial<EntitySchemaField>[] = [];
      component.entitySchemaFieldChanges.subscribe((v) => changes.push(v));
      await render({ dataType: "string", trim: false });

      fixture.componentRef.setInput("dataType", "long-text");
      await settle();
      expect(changes.at(-1)).toEqual({ trim: undefined });

      fixture.componentRef.setInput("dataType", "string");
      await settle();
      expect(changes.at(-1)).toEqual({ trim: false });
    });

    it("keeps rules the tab has no setting for, also as only a warning", async () => {
      const validators = TestBed.inject(DynamicValidatorsService);
      const getRule = validators.rules.get.bind(validators.rules);
      vi.spyOn(validators.rules, "get").mockImplementation((key) =>
        key === "customRule"
          ? ({ warning: "optional" } as FieldValidator)
          : getRule(key),
      );
      await render({
        dataType: "string",
        validators: {
          customRule: 5,
          _warningOnly: ["customRule"],
        } as FormValidatorConfig,
      });

      await addRule("Required Field");

      expect(emitted.at(-1)).toEqual({
        customRule: 5,
        required: true,
        _warningOnly: ["customRule"],
      });
    });
  });

  describe("selection filter of a link field", () => {
    const condition = { start: { $exists: true } };

    it("keeps a condition on a record type chosen in the dialog", async () => {
      await render({ dataType: "string" });

      fixture.componentRef.setInput("dataType", "entity");
      fixture.componentRef.setInput("additional", "ValidatorTabTestRecord");
      fixture.componentRef.setInput("linkedEntityType", ValidatorTabTestRecord);
      await settle();
      component.validatorForm().get("selectionCondition").setValue(condition);

      expect(emitted.at(-1)).toEqual({ selectionCondition: condition });
    });

    it("offers the condition only for a link to exactly one record type", async () => {
      await render({ dataType: "entity", additional: ["A", "B"] });

      expect(await addableRules()).not.toContain("Selection Filter");
    });
  });
});
