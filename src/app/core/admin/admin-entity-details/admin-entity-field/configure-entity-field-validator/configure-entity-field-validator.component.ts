import {
  Component,
  inject,
  input,
  output,
  effect,
  computed,
  linkedSignal,
  signal,
  untracked,
  Signal,
} from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { pairwise } from "rxjs/operators";
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
import { SelectionConditionValidator } from "app/core/basic-datatypes/entity/selection-condition";
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
   * it can change while editing the field, the `selectionCondition` is then removed
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

  /** the id of the selected data type (e.g. "string") */
  protected readonly dataTypeName = computed(
    () => this.dataType() ?? this.entitySchemaField()?.dataType,
  );

  /** the selected data type */
  private readonly datatype = computed(() =>
    this.schemaService.getDatatypeOrDefault(this.dataTypeName()),
  );

  /** the field as currently selected in the dialog */
  private readonly currentField = computed<EntitySchemaField>(() => ({
    ...this.entitySchemaField(),
    dataType: this.dataTypeName(),
    additional: this.additional() ?? this.entitySchemaField()?.additional,
  }));

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

  /** the latest value of the form (also of the disabled settings), to compute the list from */
  private readonly formSnapshot = signal<FormValidatorConfig>({});

  /**
   * The keys of the rules that are listed: those that are set, and those that the admin added.
   * A rule of another type stays here, so that it comes back if the type is changed back.
   */
  private readonly listedRuleKeys = linkedSignal(() => {
    const config = this.entitySchemaField()?.validators ?? {};
    return Object.keys(config).filter((key) =>
      this.hasValue(this.validators.rules.get(key), config),
    );
  });

  /** the listed rules that fit the selected type, with what the list shows for them */
  protected readonly rows = computed(() => {
    const values = this.formSnapshot();
    const warningOnly = asArray(values[WARNING_ONLY_KEY] ?? []);
    return this.listedRuleKeys()
      .filter((key) => this.applicableKeys().has(key))
      .map((key) => {
        const rule = this.validators.rules.get(key);
        const label = this.labelOf(rule);
        return {
          rule,
          label,
          removeLabel: $localize`Remove ${label}:rule:`,
          warningOnlyLabel: $localize`Only a warning: ${label}:rule:`,
          // only a rule that is set can be made only a warning
          hasValue: this.hasValue(rule, values),
          warningOnly: warningOnly.includes(key),
        };
      });
  });

  /** the rules of another type that are set, as the hint that they are not used */
  protected readonly hiddenRulesText = computed(() =>
    this.listedRuleKeys()
      .filter((key) => !this.applicableKeys().has(key))
      .map((key) => this.validators.rules.get(key))
      .filter((rule) => this.hasValue(rule, this.formSnapshot()))
      .map((rule) => this.labelOf(rule))
      .join(", "),
  );

  protected readonly addableRules = computed(() => {
    const listed = new Set(this.listedRuleKeys());
    return this.applicableRules()
      .filter((rule) => !listed.has(rule.key))
      .map((rule) => ({ rule, label: this.labelOf(rule) }));
  });

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
    this.emitConfigOnChange();
    this.disableHiddenSettings();
    this.dropHiddenRulesOnTypeChange();
    this.clearSelectionConditionOnLinkedTypeChange();
    this.emitTrimChanges();
  }

  private emitConfigOnChange() {
    effect((onCleanup) => {
      const form = this.validatorForm();
      this.formSnapshot.set(form.getRawValue());
      const sub = form.valueChanges.subscribe(() => {
        this.formSnapshot.set(form.getRawValue());
        this.entityValidatorChanges.emit(this.buildConfig(form));
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  /** settings not fitting the selected type are not shown, so an invalid value in them must not block saving */
  private disableHiddenSettings() {
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
  }

  /** settings not fitting a newly selected type are not shown, so they are removed from the config right away */
  private dropHiddenRulesOnTypeChange() {
    onChange(this.dataTypeName, (dataType) => {
      this.entityValidatorChanges.emit(this.buildConfig(this.validatorForm()));
      const keepsNoTrim =
        dataType === StringDatatype.dataType &&
        this.trimControl().value === false;
      this.entitySchemaFieldChanges.emit({
        trim: keepsNoTrim ? false : undefined,
      });
    });
  }

  /**
   * A `selectionCondition` refers to fields of the linked record type, so it is removed when that type changes.
   * The other settings stay, also those that the selected type hides.
   */
  private clearSelectionConditionOnLinkedTypeChange() {
    onChange(this.linkedEntityType, () =>
      this.validatorForm().get(SelectionConditionValidator.key)?.setValue(null),
    );
  }

  private emitTrimChanges() {
    effect((onCleanup) => {
      const sub = this.trimControl().valueChanges.subscribe((value: boolean) =>
        this.entitySchemaFieldChanges.emit({ trim: value }),
      );
      onCleanup(() => sub.unsubscribe());
    });
  }

  private labelOf(rule: FieldValidator): string {
    return rule.labelFor(this.datatype());
  }

  /** whether the rule is registered and switched on by its value in the given config */
  private hasValue(
    rule: FieldValidator | undefined,
    config: FormValidatorConfig,
  ): boolean {
    return !!rule && !rule.isSwitchedOff(config[rule.key]);
  }

  /** Add a rule to the list. A rule without setting is switched on right away. */
  protected addRule(rule: FieldValidator) {
    this.listedRuleKeys.update((keys) => [...keys, rule.key]);
    if (!rule.configComponent) {
      this.validatorForm().get(rule.key).setValue(true);
    }
  }

  protected removeRule(rule: FieldValidator) {
    // silently, so that the config is emitted once, by the change of the setting
    this.setWarningOnly(rule.key, false, false);
    this.listedRuleKeys.update((keys) =>
      keys.filter((key) => key !== rule.key),
    );
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
  private buildConfig(form: FormGroup): FormValidatorConfig {
    const notInForm = Object.entries(
      this.entitySchemaField()?.validators ?? {},
    ).filter(([key]) => !(key in form.controls));
    const config: FormValidatorConfig = Object.fromEntries(notInForm);
    const values = form.getRawValue();
    for (const rule of this.applicableRules()) {
      if (form.get(rule.key).valid && this.hasValue(rule, values)) {
        config[rule.key] = values[rule.key];
      }
    }

    const warningOnly = asArray(values[WARNING_ONLY_KEY]).filter(
      (key) =>
        key in config &&
        (!(key in form.controls) ||
          this.validators.rules.get(key)?.warning === "optional"),
    );
    if (warningOnly.length > 0) {
      config[WARNING_ONLY_KEY] = warningOnly;
    }
    return config;
  }
}

/** Call `callback` with the new value whenever the signal changes (not for its first value). */
function onChange<T>(source: Signal<T>, callback: (value: T) => void) {
  toObservable(source)
    .pipe(pairwise(), takeUntilDestroyed())
    .subscribe(([, value]) => callback(value));
}
