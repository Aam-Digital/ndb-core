import { DestroyRef, Injectable, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DynamicValidator, FormValidatorConfig } from "./form-validator-config";
import {
  AbstractControl,
  FormControl,
  FormControlOptions,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from "@angular/forms";
import { Logging } from "../../../logging/logging.service";
import { uniquePropertyValidator } from "../unique-property-validator/unique-property-validator";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { buildReadonlyValidator } from "./readonly-after-set.validator";
import { Entity } from "../../../entity/model/entity";
import { EmbeddedEntity } from "../../../entity/model/embedded-entity";
import { AsyncPromiseValidatorFn } from "./validator-types";
import { withinParentValidator } from "../../../basic-datatypes/date-range/within-parent-validator";
import { selectionConditionValidator } from "../../../basic-datatypes/entity/selection-condition";
import { DynamicPlaceholderValueService } from "../../../default-values/x-dynamic-placeholder/dynamic-placeholder-value.service";
import { FilterService } from "../../../filter/filter.service";
import { getCurrentRecordPlaceholderFields } from "../../../filter/filters/filters";
import { getCurrentRecordOfControl } from "../current-record-state";
import { asArray } from "app/utils/asArray";
import { merge } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";
import { isEqual } from "lodash-es";
import {
  ColumnConfig,
  FormFieldConfig,
  toFormFieldConfig,
} from "../FormConfig";
import {
  descriptionForDateValidator,
  maxDateValidator,
  minDateValidator,
} from "./date-validators";
import {
  descriptionForAgeValidator,
  maxAgeValidator,
  minAgeValidator,
} from "./age-validators";

/**
 * creates a pattern validator that also carries a predefined
 * message
 * @param pattern The pattern to check
 * @param message The custom message to display when the pattern fails
 * @example
 * >>> validator = patternWithMessage(/foo/, "Can only be foo");
 * >>> validator(invalidFormField);
 * <pre>
 * {
 *   message: "Can only be foo",
 *   requiredPattern: "foo",
 *   actualValue: "bar"
 * }
 * </pre>
 */
export function patternWithMessage(
  pattern: string | RegExp,
  message: string,
): ValidatorFn {
  const patternValidator = Validators.pattern(pattern);

  return (control: AbstractControl) => {
    const errors = patternValidator(control);
    if (errors !== null) {
      Object.assign(errors.pattern, {
        message: message,
      });
    }
    return errors;
  };
}

/** the field (of a record) that validators are built for */
interface ValidatorContext {
  /** the record that the form is editing */
  entity: Entity;
  /** the field's config as in the form (extended from the schema), e.g. for the record types a link field offers */
  field?: FormFieldConfig;
  /** false if the form does not edit one single record (e.g. in bulk edit), so there is no record to compare with */
  singleRecord: boolean;
}

@Injectable({
  providedIn: "root",
})
export class DynamicValidatorsService {
  private entityMapper = inject(EntityMapperService);
  private readonly placeholderService = inject(DynamicPlaceholderValueService);
  private readonly filterService = inject(FilterService);

  /**
   * A map of all validators along with a factory that generates the validator function
   * given a value that serves as basis for the validation.
   * @private
   */
  private getValidator(
    key: DynamicValidator,
    config: FormValidatorConfig,
    { entity, field, singleRecord }: ValidatorContext,
  ):
    | { async?: false; fn: ValidatorFn; errorName?: string }
    | {
        async: true;
        fn: AsyncPromiseValidatorFn;
        errorName?: string;
        /** run on every change of the value, not only when leaving the field (see `buildValidators`) */
        updateOnChange?: boolean;
      }
    | null {
    const value = config[key];
    const fieldId = field?.id;
    switch (key) {
      case "min":
        return { fn: Validators.min(value as number) };
      case "max":
        return { fn: Validators.max(value as number) };
      case "minDate": {
        return { fn: minDateValidator(value) };
      }
      case "maxDate": {
        return { fn: maxDateValidator(value) };
      }
      case "minAge":
        return { fn: minAgeValidator(value, config?.maxAge) };
      case "maxAge":
        return { fn: maxAgeValidator(value, config?.minAge) };
      case "pattern":
        if (typeof value === "object") {
          return { fn: patternWithMessage(value.pattern, value.message) };
        } else {
          return { fn: Validators.pattern(value as string) };
        }
      case "uniqueId":
        if (!value) {
          return null;
        }

        if (!fieldId) {
          Logging.warn(
            "Trying to generate uniqueId validator without fieldId context",
          );
          return null;
        }

        if (entity instanceof EmbeddedEntity) {
          // not supported (yet) for inner fields of embedded entries: unique among which entries is not decided
          Logging.debug("Skipping uniqueId validator of an embedded entry", {
            fieldId,
          });
          return null;
        }

        return this.buildUniqueIdValidator(entity, fieldId);
      case "required":
        return value ? { fn: Validators.required } : null;
      case "readonlyAfterSet":
        return value ? buildReadonlyValidator(entity) : null;
      case "withinParent":
        return value && fieldId
          ? {
              async: true,
              fn: withinParentValidator(
                value,
                fieldId,
                entity,
                this.entityMapper,
              ),
            }
          : null;
      case "selectionCondition":
        return value && fieldId
          ? {
              async: true,
              // selecting a record is a single change (unlike typing a text)
              updateOnChange: true,
              fn: selectionConditionValidator(
                value,
                // the types the dropdown offers (see EditEntityComponent), which a form config can override
                asArray(field.additional ?? []),
                (control) =>
                  singleRecord
                    ? getCurrentRecordOfControl(control, entity)
                    : undefined,
                {
                  entityMapper: this.entityMapper,
                  placeholderService: this.placeholderService,
                  filterService: this.filterService,
                },
              ),
            }
          : null;
      default:
        // a config problem, not a bug: admins are warned when saving the config (see ConfigValidationService)
        Logging.debug("Trying to generate a validator that does not exist", {
          validator: key,
        });
        return null;
    }
  }

  /**
   * Builds all validator functions that are part of the configuration object.
   * A validator function is a function that returns possible errors based
   * on the state of a Form Field.
   * If there is no Validator by a given name, issues a warning.
   * @param config The raw configuration object
   * @param entity The entity that the form is editing
   * @param field The field the validators are for (its id or its config as in the form, extended from the schema)
   * @param singleRecord false if the form does not edit one single record (e.g. in bulk edit),
   *   for validators comparing with other fields of the record
   * @example
   * >>> buildValidators({ required: true, max: 5 })
   * [ Validators.required, Validators.max(5) ]
   * @see ValidatorFn
   */
  public buildValidators(
    config: FormValidatorConfig,
    entity: Entity,
    field?: ColumnConfig,
    singleRecord = true,
  ): FormControlOptions {
    const formControlOptions = {
      validators: [],
      asyncValidators: [],
    };
    let updateOnBlur = false;
    const context: ValidatorContext = {
      entity,
      field: field ? toFormFieldConfig(field) : undefined,
      singleRecord,
    };

    for (const key of Object.keys(config)) {
      const validatorFn = this.getValidator(
        key as DynamicValidator,
        config,
        context,
      );

      if (validatorFn?.async) {
        const effectiveName = validatorFn.errorName || key;
        const validatorFnWithReadableErrors = (control) =>
          validatorFn
            .fn(control)
            .then((res) => this.addHumanReadableError(effectiveName, res));
        formControlOptions.asyncValidators.push(validatorFnWithReadableErrors);
        updateOnBlur ||= !validatorFn.updateOnChange;
      } else if (validatorFn) {
        const effectiveName = validatorFn.errorName || key;
        const validatorFnWithReadableErrors = (control: FormControl) =>
          this.addHumanReadableError(effectiveName, validatorFn.fn(control));
        formControlOptions.validators.push(validatorFnWithReadableErrors);
      }

      // A validator function of `null` is a legal case, for which no validator function is added.
      // For example `{ required : false }` produces a `null` validator function
    }

    // async checks (e.g. loading other records) are not repeated for every keystroke
    if (updateOnBlur) {
      (formControlOptions as FormControlOptions).updateOn = "blur";
    }

    return formControlOptions;
  }

  /**
   * The other fields of the record that the configured validators of a field read
   * (e.g. the parent link of `withinParent`, the fields a `selectionCondition` refers to),
   * so that the field is validated again when one of them changes.
   */
  getDependencies(config: FormValidatorConfig | undefined): string[] {
    const dependencies = new Set<string>(
      getCurrentRecordPlaceholderFields(config?.selectionCondition),
    );
    if (config?.withinParent?.parentReferenceField) {
      dependencies.add(config.withinParent.parentReferenceField);
    }
    return [...dependencies];
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
    validatorType: string,
    validationResult: ValidationErrors | null,
  ): ValidationErrors {
    if (!validationResult) {
      return validationResult;
    }

    // uniquePropertyValidator returns `uniqueProperty`, but this pipeline expects
    // the validator key (`uniqueId`). Normalize once so generic error rendering works.
    if (
      validatorType === "uniqueId" &&
      validationResult.uniqueId === undefined &&
      validationResult.uniqueProperty !== undefined
    ) {
      validationResult.uniqueId = validationResult.uniqueProperty;
      delete validationResult.uniqueProperty;
    }

    validationResult[validatorType] = {
      ...validationResult[validatorType],
      errorMessage: this.descriptionForValidator(
        validatorType,
        validationResult[validatorType],
      ),
    };

    return validationResult;
  }

  /**
   * returns a description for a validator given the value where it failed.
   * The value is specific for a certain validator. For example, the `min` validator
   * produces a value that could look something like `{ min: 5, current: 4 }`
   * @param validator The validator to get the description for
   * @param validationValue The value associated with the validator
   */
  private descriptionForValidator(
    validator: DynamicValidator | string,
    validationValue: any,
  ): string {
    switch (validator) {
      case "min":
        return $localize`Must be greater than ${validationValue.min}`;
      case "max":
        return $localize`Cannot be greater than ${validationValue.max}`;
      case "minDate":
        return descriptionForDateValidator("minDate", validationValue);
      case "maxDate":
        return descriptionForDateValidator("maxDate", validationValue);
      case "minAge":
        return descriptionForAgeValidator("minAge", validationValue);
      case "maxAge":
        return descriptionForAgeValidator("maxAge", validationValue);
      case "pattern":
        if (validationValue.message) {
          return validationValue.message;
        } else {
          return $localize`Please enter a valid pattern`;
        }
      case "required":
        return $localize`This field is required`;
      case "matDatepickerParse":
        return $localize`Please enter a valid date`;
      case "isNumber":
        return $localize`Please enter a valid number`;
      case "withinParent":
      case "selectionCondition":
        return validationValue?.errorMessage;
      case "uniqueId":
        if (typeof validationValue === "string") {
          return validationValue;
        }
        return validationValue?.errorMessage;
      case "readonlyAfterSet":
        return validationValue;
      default:
        Logging.error("No description defined for validator", {
          validator,
          validationValue,
        });
        throw $localize`Invalid input`;
    }
  }

  private buildUniqueIdValidator(
    entity: Entity,
    fieldId: string,
  ): {
    async: true;
    fn: AsyncPromiseValidatorFn;
  } {
    return {
      fn: uniquePropertyValidator({
        getExistingValues: () =>
          this.entityMapper
            .loadType(entity.getType())
            .then((entities) =>
              entities
                .map((existingEntity) => Reflect.get(existingEntity, fieldId))
                .filter((existingValue) => existingValue !== undefined),
            ),
        normalize: false,
        fieldLabel: $localize`:field label:id`,
      }),
      async: true,
    };
  }
}
