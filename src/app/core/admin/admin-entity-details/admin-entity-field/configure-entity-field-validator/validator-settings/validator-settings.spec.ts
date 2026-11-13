import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import { provideNativeDateAdapter } from "@angular/material/core";
import { By } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { MatInputHarness } from "@angular/material/input/testing";
import { MatSelectHarness } from "@angular/material/select/testing";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { CoreTestingModule } from "#src/app/utils/core-testing.module";
import {
  DatabaseEntity,
  EntityRegistry,
  entityRegistry,
} from "#src/app/core/entity/database-entity.decorator";
import { DatabaseField } from "#src/app/core/entity/database-field.decorator";
import { Entity } from "#src/app/core/entity/model/entity";
import { EntitySchemaField } from "#src/app/core/entity/schema/entity-schema-field";
import { mockEntityMapperProvider } from "#src/app/core/entity/entity-mapper/mock-entity-mapper-service";
import { TranslatableText } from "#src/app/core/config/multi-lingual-config";
import { WithinParentConfig } from "#src/app/core/common-components/entity-form/dynamic-form-validators/form-validator-config";
import { AdminDisplayConditionButtonComponent } from "#src/app/core/admin/building-blocks/admin-display-condition-button/admin-display-condition-button.component";
import { PatternValidatorSettingComponent } from "./pattern-validator-setting.component";
import { WithinParentValidatorSettingComponent } from "./within-parent-validator-setting.component";
import { SelectionConditionValidatorSettingComponent } from "./selection-condition-validator-setting.component";
import { DateValidatorSettingComponent } from "./date-validator-setting.component";

@DatabaseEntity("ValidatorSettingProject")
class ValidatorSettingProject extends Entity {
  @DatabaseField({ dataType: "date-range", label: "Planned period" })
  plannedPeriod: unknown;
  @DatabaseField({ dataType: "date", label: "Start" }) start: Date;
}

@DatabaseEntity("ValidatorSettingAction")
class ValidatorSettingAction extends Entity {
  @DatabaseField({
    dataType: "entity",
    additional: "ValidatorSettingAction",
    label: "Parent",
  })
  parent: string;
  @DatabaseField({
    dataType: "entity",
    additional: "ValidatorSettingProject",
    label: "Project",
  })
  project: string;
  @DatabaseField({ dataType: "date-range", label: "Period" }) period: unknown;
}

describe("settings components of the validation rules", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        FontAwesomeTestingModule,
        CoreTestingModule,
      ],
      providers: [
        provideNativeDateAdapter(),
        { provide: EntityRegistry, useValue: entityRegistry },
        ...mockEntityMapperProvider(),
      ],
    }).compileComponents();
  });

  describe("PatternValidatorSettingComponent", () => {
    let fixture: ComponentFixture<PatternValidatorSettingComponent>;

    function render(value: unknown) {
      const control = new FormControl(value);
      fixture = TestBed.createComponent(PatternValidatorSettingComponent);
      fixture.componentRef.setInput("formControl", control);
      fixture.componentRef.setInput("label", "Pattern (Regex)");
      fixture.detectChanges();
      const loader = TestbedHarnessEnvironment.loader(fixture);
      const input = (label: string) =>
        loader.getHarness(
          MatInputHarness.with({ selector: `[formControlName=${label}]` }),
        );
      return { control, input };
    }

    it("shows the pattern and error text of the setting, and saves them as one value", async () => {
      const { control, input } = render({
        pattern: "[0-9]{10}",
        message: "custom msg",
      });
      const pattern = await input("pattern");
      const message = await input("message");
      expect(await pattern.getValue()).toBe("[0-9]{10}");
      expect(await message.getValue()).toBe("custom msg");

      await pattern.setValue("[a-z]+");
      expect(control.value).toEqual({
        pattern: "[a-z]+",
        message: "custom msg",
      });

      await message.setValue("");
      expect(control.value).toBe("[a-z]+");

      await pattern.setValue("");
      expect(control.value).toBeNull();
      expect(await message.isDisabled()).toBe(true); // only editable together with a pattern
    });

    it.each([
      [null, ""],
      [/^\d+$/, String.raw`^\d+$`],
    ])("shows a pattern given as %s", async (value, shown) => {
      const { input } = render(value);

      expect(await (await input("pattern")).getValue()).toBe(shown);
    });

    it("shows the error of an invalid pattern when the dialog marks all fields as touched", () => {
      const { control } = render("[a-z");

      control.markAllAsTouched();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain(
        "Not a valid regular expression",
      );
    });

    it("marks the setting as invalid while the pattern is not a regular expression", async () => {
      const { control, input } = render(null);

      await (await input("pattern")).setValue("[a-z");
      expect(control.hasError("invalidPattern")).toBe(true);

      await (await input("pattern")).setValue("[a-z]");
      expect(control.valid).toBe(true);
    });
  });

  describe("WithinParentValidatorSettingComponent", () => {
    function render(
      field: EntitySchemaField,
      value: WithinParentConfig | null = null,
    ) {
      const control = new FormControl<WithinParentConfig | null>(value);
      const fixture = TestBed.createComponent(
        WithinParentValidatorSettingComponent,
      );
      fixture.componentRef.setInput("formControl", control);
      fixture.componentRef.setInput("label", "Must lie within the period");
      fixture.componentRef.setInput("entityType", ValidatorSettingAction);
      fixture.componentRef.setInput("field", field);
      fixture.detectChanges();
      const select = () =>
        TestbedHarnessEnvironment.loader(fixture).getHarness(MatSelectHarness);
      return { control, select, fixture };
    }

    const period = ValidatorSettingAction.schema.get("period");

    it("offers the date range fields of the linked record types, and this field for a link to the same type", async () => {
      const { select } = render(period);
      const dropdown = await select();
      await dropdown.open();

      const options = await dropdown.getOptions();
      expect(await Promise.all(options.map((o) => o.getText()))).toEqual([
        "Parent › Period",
        "Project › Planned period",
      ]);
    });

    it.each<[string, WithinParentConfig]>([
      ["Parent › Period", { parentReferenceField: "parent" }],
      [
        "Project › Planned period",
        { parentReferenceField: "project", parentValueField: "plannedPeriod" },
      ],
    ])("sets the value when selecting %s", async (text, expected) => {
      const { select, control } = render(period, {
        parentReferenceField: "somethingElse",
      });

      await (await select()).clickOptions({ text });

      expect(control.value).toEqual(expected);
    });

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
        const { select } = render({
          dataType: "date-range",
          label,
        } as EntitySchemaField);
        const dropdown = await select();
        await dropdown.open();

        const options = await dropdown.getOptions({ text: /^Parent/ });
        expect(await options[0].getText()).toBe(expected);
      },
    );

    it("shows the saved setting", async () => {
      const { select } = render(period, {
        parentReferenceField: "project",
        parentValueField: "plannedPeriod",
      });

      expect(await (await select()).getValueText()).toBe(
        "Project › Planned period",
      );
    });
  });

  describe("SelectionConditionValidatorSettingComponent", () => {
    const condition = { start: { $exists: true } };

    function render(linkedEntityType?: typeof Entity) {
      const control = new FormControl<typeof condition | null>(null);
      const fixture = TestBed.createComponent(
        SelectionConditionValidatorSettingComponent,
      );
      fixture.componentRef.setInput("formControl", control);
      fixture.componentRef.setInput("entityType", ValidatorSettingAction);
      fixture.componentRef.setInput("linkedEntityType", linkedEntityType);
      fixture.detectChanges();
      const button = () =>
        fixture.debugElement.query(
          By.directive(AdminDisplayConditionButtonComponent),
        )?.componentInstance as AdminDisplayConditionButtonComponent;
      return { control, button };
    }

    it("is only offered for a link to a record type", () => {
      expect(render().button()).toBeUndefined();

      const { button } = render(ValidatorSettingProject);
      expect(button().entityType()).toBe(ValidatorSettingProject);
      expect(button().currentRecordType()).toBe(ValidatorSettingAction);
    });

    it("saves the condition, and removes it again", () => {
      const { control, button } = render(ValidatorSettingProject);

      button().conditionChange.emit(condition);
      expect(control.value).toEqual(condition);

      button().conditionChange.emit(null);
      expect(control.value).toBeNull();
    });
  });

  describe("DateValidatorSettingComponent", () => {
    it("reads the date of the setting, which the config stores as a text", () => {
      const control = new FormControl<Date | string | null>("2020-03-01");
      const fixture = TestBed.createComponent(DateValidatorSettingComponent);
      fixture.componentRef.setInput("formControl", control);
      fixture.componentRef.setInput("label", "Minimum Date");
      fixture.detectChanges();

      expect(control.value).toEqual(new Date("2020-03-01"));
    });
  });
});
