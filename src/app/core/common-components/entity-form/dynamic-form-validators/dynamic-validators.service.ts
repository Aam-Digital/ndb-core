import { DestroyRef, Injectable, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormValidatorConfig } from "./form-validator-config";
import {
  AbstractControl,
  AsyncValidatorFn,
  FormControl,
  FormControlOptions,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from "@angular/forms";
import { Logging } from "../../../logging/logging.service";
import { Entity } from "../../../entity/model/entity";
import { AsyncPromiseValidatorFn } from "./validator-types";
import { merge } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";
import { isEqual } from "lodash-es";
import { ColumnConfig, toFormFieldConfig } from "../FormConfig";
import { FieldValidator, ValidatorContext } from "./field-validator";
import { asArray } from "#src/app/utils/asArray";

/** keys of a `validators` config starting with this are settings (e.g. `_warningOnly`), not validators */
export const SETTING_PREFIX = "_";

/**
 * Builds the validators configured for form fields (`validators` of their schema)
 * from the registered {@link FieldValidator} rules.
 */
@Injectable({
  providedIn: "root",
})
export class DynamicValidatorsService {
  private readonly rules = new Map(
    (inject(FieldValidator) as unknown as FieldValidator[]).map((rule) => [
      rule.key,
      rule,
    ]),
  );

  /** all registered rules */
  getRules(): FieldValidator[] {
    return [...this.rules.values()];
  }

  /** the registered rule for a key of the `validators` config, `undefined` if there is none */
  getRule(key: string): FieldValidator | undefined {
    return this.rules.get(key);
  }

  /**
   * The validators configured for a field, as options for its form control.
   * Each error they return has a readable `errorMessage`. Unknown validators are ignored.
   * @param entity the record that the form is editing
   * @param field the field the validators are for (its id or its config as in the form, extended from the schema)
   * @param singleRecord false if the form does not edit one single record (e.g. in bulk edit),
   *   for validators comparing with other fields of the record
   */
  public buildValidators(
    config: FormValidatorConfig,
    entity: Entity,
    field?: ColumnConfig,
    singleRecord = true,
  ): FormControlOptions {
    const formControlOptions: FormControlOptions & {
      validators: ValidatorFn[];
      asyncValidators: AsyncValidatorFn[];
    } = { validators: [], asyncValidators: [] };
    let updateOnBlur = false;
    const context: ValidatorContext = {
      entity,
      field: field ? toFormFieldConfig(field) : undefined,
      singleRecord,
      config,
    };

    const warningOnly = new Set(asArray(config._warningOnly ?? []));
    for (const [key, value] of Object.entries(config)) {
      if (key.startsWith(SETTING_PREFIX)) {
        continue;
      }
      const rule = this.rules.get(key);
      if (!rule) {
        // a config problem, not a bug: admins are warned when saving the config (see ConfigValidationService)
        Logging.debug("Trying to generate a validator that does not exist", {
          validator: key,
        });
        continue;
      }

      const validator = rule.build(value, context);
      if (!validator) {
        continue;
      }
      const onlyWarns = rule.warning === "optional" && warningOnly.has(key);
      if (rule.async) {
        formControlOptions.asyncValidators.push((control: FormControl) =>
          (validator as AsyncPromiseValidatorFn)(control).then((errors) =>
            this.addHumanReadableError(rule, errors, onlyWarns),
          ),
        );
        updateOnBlur ||= !rule.checkOnChange;
      } else {
        formControlOptions.validators.push((control: FormControl) =>
          this.addHumanReadableError(
            rule,
            (validator as ValidatorFn)(control),
            onlyWarns,
          ),
        );
      }
    }

    // async checks (e.g. loading other records) are not repeated for every keystroke
    if (updateOnBlur) {
      formControlOptions.updateOn = "blur";
    }

    return formControlOptions;
  }

  /**
   * The other fields of the record that the configured validators of a field read
   * (e.g. the parent link of `withinParent`, the fields a `selectionCondition` refers to),
   * so that the field is validated again when one of them changes.
   */
  getDependencies(config: FormValidatorConfig | undefined): string[] {
    const dependencies = Object.entries(config ?? {}).flatMap(
      ([key, value]) => this.rules.get(key)?.dependsOn(value) ?? [],
    );
    return [...new Set(dependencies)];
  }

  /**
   * Validate a field again whenever one of the other fields that its validators read changes in the same form
   * (see {@link getDependencies}), e.g. a date range when its parent link changes.
   */
  revalidateOnDependencyChange(
    form: FormGroup,
    formFields: ColumnConfig[],
    destroyRef: DestroyRef,
  ) {
    for (const field of formFields.map(toFormFieldConfig)) {
      const control = form.get(field.id);
      const dependencies = this.getDependencies(field.validators)
        .map((id) => form.get(id))
        .filter((dependency): dependency is AbstractControl => !!dependency);
      if (!control || dependencies.length === 0) {
        continue;
      }
      merge(
        ...dependencies.map((dependency) =>
          dependency.valueChanges.pipe(
            // validating a field emits its value again: without this, two fields depending on each other would loop
            distinctUntilChanged(isEqual),
          ),
        ),
      )
        .pipe(takeUntilDestroyed(destroyRef))
        .subscribe(() => control.updateValueAndValidity());
    }
  }

  private addHumanReadableError(
    rule: FieldValidator,
    validationResult: ValidationErrors | null,
    onlyWarns: boolean,
  ): ValidationErrors {
    if (!validationResult) {
      return validationResult;
    }

    const error = validationResult[rule.key];
    validationResult[rule.key] = {
      ...error,
      errorMessage: this.messageFor(rule, error),
      ...(onlyWarns && { warning: true }),
    };
    return validationResult;
  }

  private messageFor(rule: FieldValidator, error: unknown): string {
    const message = rule.message(error);
    if (message) {
      return message;
    }
    // not thrown: a rejected async validator would leave the field pending, so the form could not be saved
    Logging.error("No description defined for validator", {
      validator: rule.key,
      validationValue: error,
    });
    return $localize`Invalid input`;
  }
}
