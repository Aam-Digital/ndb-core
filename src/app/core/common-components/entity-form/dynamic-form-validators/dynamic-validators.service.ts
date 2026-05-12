import { Injectable, inject } from "@angular/core";
import { DynamicValidator, FormValidatorConfig } from "./form-validator-config";
import {
  AbstractControl,
  FormControl,
  FormControlOptions,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from "@angular/forms";
import { Logging } from "../../../logging/logging.service";
import { uniquePropertyValidator } from "../unique-property-validator/unique-property-validator";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { buildReadonlyValidator } from "./readonly-after-set.validator";
import { Entity } from "../../../entity/model/entity";
import { AsyncPromiseValidatorFn } from "./validator-types";
import { calculateAge } from "../../../../utils/utils";

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

/**
 * Parses a value to a Date object
 * Handles Date objects, date strings (YYYY-MM-DD), timestamps, and special value "$now"
 */
function parseToDate(value: unknown): Date | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "string") {
    // Handle special placeholder "$now"
    if (value === "$now") {
      return new Date();
    }

    // Handle date-only format (YYYY-MM-DD)
    const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    const dateMatch = dateRegex.exec(value);
    if (dateMatch) {
      const localDate = new Date(
        Number(dateMatch[1]),
        Number(dateMatch[2]) - 1,
        Number(dateMatch[3]),
      );
      if (!Number.isNaN(localDate.getTime())) {
        return localDate;
      }
    }

    // Try generic date parsing
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  if (typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return undefined;
}

/**
 * Normalizes a date to just the date portion (no time)
 */
function normalizeDateOnly(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function formatDateAsDayMonthYear(value: Date): string {
  return `${value.getDate().toString().padStart(2, "0")}.${(
    value.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}.${value.getFullYear()}`;
}

/**
 * Creates a date range validator (min or max)
 */
function createDateComparisonValidator(
  dateParamValue: unknown,
  comparator: (controlDate: Date, paramDate: Date) => boolean,
  errorKey: string,
  paramName: "minDate" | "maxDate",
): ValidatorFn {
  const parsedParam = parseToDate(dateParamValue);
  if (!parsedParam) {
    return () => null;
  }

  const paramDate = normalizeDateOnly(parsedParam);
  return (control: AbstractControl) => {
    const controlDate = parseToDate(control.value);
    if (!controlDate) {
      return null;
    }

    const normalizedControlDate = normalizeDateOnly(controlDate);
    if (comparator(normalizedControlDate, paramDate)) {
      return null;
    }

    return {
      [errorKey]: {
        [paramName]: paramDate,
        currentDate: normalizedControlDate,
      },
    };
  };
}

/**
 * Validator for minimum date
 */
function minDateValidator(minDateValue: unknown): ValidatorFn {
  return createDateComparisonValidator(
    minDateValue,
    (control, param) => control >= param,
    "minDate",
    "minDate",
  );
}

/**
 * Validator for maximum date
 */
function maxDateValidator(maxDateValue: unknown): ValidatorFn {
  return createDateComparisonValidator(
    maxDateValue,
    (control, param) => control <= param,
    "maxDate",
    "maxDate",
  );
}

/**
 * Creates an age range validator (min or max age)
 */
function createAgeComparisonValidator(
  ageParamValue: unknown,
  comparator: (age: number, param: number) => boolean,
  errorKey: string,
  paramName: "minAge" | "maxAge",
  rangeConfig?: { minAge?: unknown; maxAge?: unknown },
): ValidatorFn {
  const paramNum = Number(ageParamValue);
  if (!Number.isFinite(paramNum)) {
    return () => null;
  }

  const configuredMinAge = Number(rangeConfig?.minAge);
  const configuredMaxAge = Number(rangeConfig?.maxAge);
  const hasMin = Number.isFinite(configuredMinAge);
  const hasMax = Number.isFinite(configuredMaxAge);

  return (control: AbstractControl) => {
    const controlDate = parseToDate(control.value);
    if (!controlDate) {
      return null;
    }

    const age = calculateAge(controlDate);
    if (comparator(age, paramNum)) {
      return null;
    }

    return {
      [errorKey]: {
        [paramName]: paramNum,
        currentAge: age,
        ...(hasMin ? { minAge: configuredMinAge } : {}),
        ...(hasMax ? { maxAge: configuredMaxAge } : {}),
      },
    };
  };
}

/**
 * Validator for minimum age
 */
function minAgeValidator(
  minAgeValue: unknown,
  maxAgeValue?: unknown,
): ValidatorFn {
  return createAgeComparisonValidator(
    minAgeValue,
    (age, param) => age >= param,
    "minAge",
    "minAge",
    { minAge: minAgeValue, maxAge: maxAgeValue },
  );
}

/**
 * Validator for maximum age
 */
function maxAgeValidator(
  maxAgeValue: unknown,
  minAgeValue?: unknown,
): ValidatorFn {
  return createAgeComparisonValidator(
    maxAgeValue,
    (age, param) => age <= param,
    "maxAge",
    "maxAge",
    { minAge: minAgeValue, maxAge: maxAgeValue },
  );
}

@Injectable({
  providedIn: "root",
})
export class DynamicValidatorsService {
  private entityMapper = inject(EntityMapperService);

  /**
   * A map of all validators along with a factory that generates the validator function
   * given a value that serves as basis for the validation.
   * @private
   */
  private getValidator(
    key: DynamicValidator,
    value: any,
    entity: Entity,
    fieldId?: string,
    config?: FormValidatorConfig,
  ):
    | { async?: false; fn: ValidatorFn; errorName?: string }
    | {
        async: true;
        fn: AsyncPromiseValidatorFn;
        errorName?: string;
      }
    | null {
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

        return this.buildUniqueIdValidator(entity, fieldId);
      case "required":
        return value ? { fn: Validators.required } : null;
      case "readonlyAfterSet":
        return value ? buildReadonlyValidator(entity) : null;
      default:
        Logging.warn(
          `Trying to generate validator ${key} but it does not exist`,
        );
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
   * @example
   * >>> buildValidators({ required: true, max: 5 })
   * [ Validators.required, Validators.max(5) ]
   * @see ValidatorFn
   */
  public buildValidators(
    config: FormValidatorConfig,
    entity: Entity,
    fieldId?: string,
  ): FormControlOptions {
    const formControlOptions = {
      validators: [],
      asyncValidators: [],
    };

    for (const key of Object.keys(config)) {
      const validatorFn = this.getValidator(
        key as DynamicValidator,
        config[key],
        entity,
        fieldId,
        config,
      );

      if (validatorFn?.async) {
        const effectiveName = validatorFn.errorName || key;
        const validatorFnWithReadableErrors = (control) =>
          validatorFn
            .fn(control)
            .then((res) => this.addHumanReadableError(effectiveName, res));
        formControlOptions.asyncValidators.push(validatorFnWithReadableErrors);
      } else if (validatorFn) {
        const effectiveName = validatorFn.errorName || key;
        const validatorFnWithReadableErrors = (control: FormControl) =>
          this.addHumanReadableError(effectiveName, validatorFn.fn(control));
        formControlOptions.validators.push(validatorFnWithReadableErrors);
      }

      // A validator function of `null` is a legal case, for which no validator function is added.
      // For example `{ required : false }` produces a `null` validator function
    }

    if (formControlOptions.asyncValidators.length > 0) {
      (formControlOptions as FormControlOptions).updateOn = "blur";
    }

    return formControlOptions;
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
        return $localize`Date must be on or after ${formatDateAsDayMonthYear(validationValue.minDate)}`;
      case "maxDate":
        return $localize`Date must be on or before ${formatDateAsDayMonthYear(validationValue.maxDate)}`;
      case "minAge":
        if (
          Number.isFinite(validationValue?.minAge) &&
          Number.isFinite(validationValue?.maxAge)
        ) {
          return $localize`Age must be between ${validationValue.minAge} and ${validationValue.maxAge} years`;
        }
        return $localize`Age must be at least ${validationValue.minAge} years`;
      case "maxAge":
        if (
          Number.isFinite(validationValue?.minAge) &&
          Number.isFinite(validationValue?.maxAge)
        ) {
          return $localize`Age must be between ${validationValue.minAge} and ${validationValue.maxAge} years`;
        }
        return $localize`Age must be at most ${validationValue.maxAge} years`;
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
      case "uniqueId":
        if (typeof validationValue === "string") {
          return validationValue;
        }
        return validationValue?.errorMessage;
      case "readonlyAfterSet":
        return validationValue;
      default:
        Logging.error(
          `No description defined for validator "${validator}": ${JSON.stringify(
            validationValue,
          )}`,
        );
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
