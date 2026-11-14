import {
  Component,
  inject,
  input,
  output,
  ChangeDetectionStrategy,
  effect,
  computed,
  linkedSignal,
  signal,
  untracked,
} from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatTooltipModule } from "@angular/material/tooltip";
import { EntitySchemaField } from "app/core/entity/schema/entity-schema-field";
import { EntityConstructor } from "app/core/entity/model/entity";
import {
  FormValidatorConfig,
  WARNING_ONLY_KEY,
} from "app/core/common-components/entity-form/dynamic-form-validators/form-validator-config";
import { DynamicValidatorsService } from "app/core/common-components/entity-form/dynamic-form-validators/dynamic-validators.service";
import { FieldValidator } from "app/core/common-components/entity-form/dynamic-form-validators/field-validator";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";
import { StringDatatype } from "app/core/basic-datatypes/string/string.datatype";
import { asArray } from "app/utils/asArray";
import { DynamicComponentDirective } from "app/core/config/dynamic-components/dynamic-component.directive";
import { DynamicComponentConfig } from "app/core/config/dynamic-components/dynamic-component-config.interface";
import { FaDynamicIconComponent } from "app/core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { HelpButtonComponent } from "../../../../common-components/help-button/help-button.component";
import { ValidatorSettingInputs } from "./validator-settings/validator-setting";

/**
 * The "Validation" tab of the field editor: the validation rules that are set for the field,
 * and a dropdown to add more of the registered rules that fit the selected type of the field.
 * The setting of each rule is edited by the component that the rule names (`FieldValidator.configComponent`).
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-configure-entity-field-validator",
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTooltipModule,
    HelpButtonComponent,
    FaDynamicIconComponent,
    DynamicComponentDirective,
  ],
  templateUrl: "./configure-entity-field-validator.component.html",
  styleUrl: "./configure-entity-field-validator.component.scss",
})
export class ConfigureEntityFieldValidatorComponent {
  private readonly validators = inject(DynamicValidatorsService);
  private readonly schemaService = inject(EntitySchemaService);

  /**
   * the field definition with the currently existing validator settings to be edited
   */
  entitySchemaField = input.required<EntitySchemaField>();

  /** the record type of the field, to offer the date ranges of the records it links to */
  entityType = input<EntityConstructor>();

  /**
   * the data type currently selected for the field, if it can change while editing
   * (a change of `entitySchemaField.dataType` in place is not noticed)
   */
  dataType = input<string>();

  /**
   * the `additional` currently selected for the field (e.g. the record types of a link field), if it can change while editing
   * (a change of `entitySchemaField.additional` in place is not noticed)
   */
  additional = input<unknown>();

  /**
   * the record type a link field links to, if it is exactly one (as needed for a `selectionCondition`);
   * it can change while editing the field, the parent then removes the `selectionCondition` from the field's validators
   */
  linkedEntityType = input<EntityConstructor>();

  /**
   * Emit the latest state of the validators config whenever the user changed it in the displayed form.
   */
  entityValidatorChanges = output<FormValidatorConfig>();

  /**
   * Emit changes to EntitySchemaField properties (e.g. trim) that are not validators.
   */
  entitySchemaFieldChanges = output<Partial<EntitySchemaField>>();

  protected readonly fieldDataType = computed(
    () => this.dataType() ?? this.entitySchemaField()?.dataType,
  );

  /** the field as currently selected in the dialog */
  private readonly currentField = computed<EntitySchemaField>(() => ({
    ...this.entitySchemaField(),
    dataType: this.fieldDataType(),
    additional: this.additional() ?? this.entitySchemaField()?.additional,
  }));

  private readonly datatype = computed(() =>
    this.schemaService.getDatatypeOrDefault(this.fieldDataType()),
  );

  private readonly applicableRules = computed(() =>
    [...this.validators.rules.values()].filter((rule) =>
      rule.appliesTo(this.datatype(), this.currentField()),
    ),
  );

  private readonly applicableKeys = computed(
    () => new Set(this.applicableRules().map((rule) => rule.key)),
  );

  /** one form control for the setting of each registered rule, and the rules that are only a warning */
  validatorForm = computed(() => {
    // read again when the linked type changes, as the parent then removes the `selectionCondition`
    this.linkedEntityType();
    const validators = this.entitySchemaField()?.validators;
    const controls: Record<string, FormControl> = {};
    for (const rule of this.validators.rules.values()) {
      const value = validators?.[rule.key] ?? null;
      // a rule defined in code can have a regular expression, which a config cannot store
      controls[rule.key] = new FormControl(
        value instanceof RegExp ? value.source : value,
      );
    }
    controls[WARNING_ONLY_KEY] = new FormControl(
      asArray(validators?.[WARNING_ONLY_KEY] ?? []),
    );
    return new FormGroup(controls);
  });

  private readonly formValue = signal<FormValidatorConfig>({});

  /**
   * The keys of the rules that are shown in the list: those that are set, and those that the admin added.
   * A rule of another type stays here, so that it comes back if the type is changed back.
   */
  private readonly shownKeys = linkedSignal<FormGroup, string[]>({
    source: this.validatorForm,
    computation: (form, previous) => {
      const set = Object.keys(
        this.entitySchemaField()?.validators ?? {},
      ).filter(
        (key) =>
          this.validators.rules.has(key) &&
          !this.validators.rules.get(key).isSwitchedOff(form.get(key).value),
      );
      // the form is rebuilt when the linked type changes: rows added but not filled in yet stay
      return [
        ...set,
        ...(previous?.value.filter((key) => !set.includes(key)) ?? []),
      ];
    },
  });

  /** the shown rules that fit the selected type, with the texts the list shows for them */
  protected readonly rows = computed(() =>
    this.shownKeys()
      .filter((key) => this.applicableKeys().has(key))
      .map((key) => {
        const rule = this.validators.rules.get(key);
        const label = this.labelOf(rule);
        return { rule, label, removeLabel: $localize`Remove ${label}:rule:` };
      }),
  );

  protected readonly hiddenRuleLabels = computed(() =>
    this.shownKeys()
      .filter((key) => !this.applicableKeys().has(key))
      .map((key) => this.labelOf(this.validators.rules.get(key))),
  );

  protected readonly addableRules = computed(() => {
    const shown = new Set(this.shownKeys());
    return this.applicableRules()
      .filter((rule) => !shown.has(rule.key))
      .map((rule) => ({ rule, label: this.labelOf(rule) }));
  });

  /** only a rule that is set can be made only a warning */
  protected readonly setRuleKeys = computed(
    () =>
      new Set(
        this.applicableRules()
          .filter((rule) => !rule.isSwitchedOff(this.formValue()[rule.key]))
          .map((rule) => rule.key),
      ),
  );

  protected readonly warningOnlyRuleKeys = computed(
    () => new Set(asArray(this.formValue()[WARNING_ONLY_KEY] ?? [])),
  );

  /** created once per change of the inputs, as a new object recreates the component of the row */
  protected readonly settingComponents = computed(() => {
    const form = this.validatorForm();
    const inputs: Omit<ValidatorSettingInputs, "formControl" | "label"> = {
      field: this.currentField(),
      entityType: this.entityType(),
      linkedEntityType: this.linkedEntityType(),
    };
    return new Map(
      this.applicableRules()
        .filter((rule) => rule.configComponent)
        .map((rule): [string, DynamicComponentConfig] => [
          rule.key,
          {
            component: rule.configComponent,
            config: {
              ...inputs,
              formControl: form.get(rule.key),
              label: this.labelOf(rule),
              description: rule.description,
            },
          },
        ]),
    );
  });

  trimControl = computed(
    () => new FormControl(this.entitySchemaField()?.trim !== false),
  );

  constructor() {
    effect((onCleanup) => {
      const form = this.validatorForm();

      this.formValue.set(form.getRawValue());
      const sub = form.valueChanges.subscribe(() => {
        this.formValue.set(form.getRawValue());
        this.entityValidatorChanges.emit(this.validatorConfig(form));
      });
      onCleanup(() => sub.unsubscribe());
    });

    // settings not fitting the selected type are not shown, so an invalid value in them must not block saving
    effect(() => {
      const form = this.validatorForm();
      const applicable = this.applicableKeys();
      untracked(() => {
        for (const rule of this.validators.rules.values()) {
          const control = form.get(rule.key);
          if (applicable.has(rule.key)) {
            control.enable({ emitEvent: false });
          } else {
            control.disable({ emitEvent: false });
          }
        }
      });
    });

    // settings not fitting a newly selected type are not shown, so they are removed from the config right away
    let shownDataType: string | undefined;
    let firstRun = true;
    effect(() => {
      const dataType = this.fieldDataType();
      untracked(() => {
        if (!firstRun && dataType !== shownDataType) {
          this.entityValidatorChanges.emit(
            this.validatorConfig(this.validatorForm()),
          );
          const keepsNoTrim =
            dataType === StringDatatype.dataType &&
            this.trimControl().value === false;
          this.entitySchemaFieldChanges.emit({
            trim: keepsNoTrim ? false : undefined,
          });
        }
        firstRun = false;
        shownDataType = dataType;
      });
    });

    effect((onCleanup) => {
      const ctrl = this.trimControl();
      const sub = ctrl.valueChanges.subscribe((value: boolean) => {
        this.entitySchemaFieldChanges.emit({ trim: value });
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  private labelOf(rule: FieldValidator): string {
    return rule.labelFor(this.datatype());
  }

  /** Add a rule to the list. A rule without setting is switched on right away. */
  protected addRule(rule: FieldValidator) {
    this.shownKeys.update((keys) => [...keys, rule.key]);
    if (!rule.configComponent) {
      this.validatorForm().get(rule.key).setValue(true);
    }
  }

  protected removeRule(rule: FieldValidator) {
    // silently, so that the config is emitted once, by the change of the setting
    this.setWarningOnly(rule.key, false, false);
    this.shownKeys.update((keys) => keys.filter((key) => key !== rule.key));
    this.validatorForm().get(rule.key).setValue(null);
  }

  protected setWarningOnly(
    key: string,
    warningOnly: boolean,
    emitEvent = true,
  ) {
    const control = this.validatorForm().get(WARNING_ONLY_KEY);
    const others = control.value.filter((other: string) => other !== key);
    control.setValue(warningOnly ? [...others, key] : others, { emitEvent });
  }

  /**
   * The validators config of the form:
   * the rules that are set and fit the selected data type, if their setting is valid,
   * the keys of the config without a rule (e.g. of removed modules) kept as they are.
   */
  private validatorConfig(form: FormGroup): FormValidatorConfig {
    const notInForm = Object.entries(
      this.entitySchemaField()?.validators ?? {},
    ).filter(([key]) => !(key in form.controls));
    const config: FormValidatorConfig = Object.fromEntries(notInForm);
    for (const rule of this.applicableRules()) {
      const control = form.get(rule.key);
      if (control.valid && !rule.isSwitchedOff(control.value)) {
        config[rule.key] = control.value;
      }
    }

    const warningOnly = asArray(form.get(WARNING_ONLY_KEY).value).filter(
      (key) =>
        key in config && this.validators.rules.get(key)?.warning === "optional",
    );
    if (warningOnly.length > 0) {
      config[WARNING_ONLY_KEY] = warningOnly;
    }
    return config;
  }
}
