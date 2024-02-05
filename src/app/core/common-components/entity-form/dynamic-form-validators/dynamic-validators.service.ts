import { Injectable } from "@angular/core";
import { DynamicValidator, FormValidatorConfig } from "./form-validator-config";
import {
  AbstractControl,
  FormControl,
  FormControlOptions,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from "@angular/forms";
import { LoggingService } from "../../../logging/logging.service";
import { uniqueIdValidator } from "../unique-id-validator/unique-id-validator";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";

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

@Injectable({
  providedIn: "root",
})
export class DynamicValidatorsService {
  /**
   * A map of all validators along with a factory that generates the validator function
   * given a value that serves as basis for the validation.
   * @private
   */
  private getValidator(
    key: DynamicValidator,
    value: any,
  ):
    | { async?: false; fn: ValidatorFn }
    | {
        async: true;
        fn: AsyncPromiseValidatorFn;
      }
    | null {
    switch (key) {
      case "min":
        return { fn: Validators.min(value as number) };
      case "max":
        return { fn: Validators.max(value as number) };
      case "pattern":
        if (typeof value === "object") {
          return { fn: patternWithMessage(value.pattern, value.message) };
        } else {
          return { fn: Validators.pattern(value as string) };
        }
      case "validEmail":
        return value ? { fn: Validators.email } : null;
      case "uniqueId":
        return value ? this.buildUniqueIdValidator(value) : null;
      case "required":
        return value ? { fn: Validators.required } : null;
      default:
        this.loggingService.warn(
          `Trying to generate validator ${key} but it does not exist`,
        );
        return null;
    }
  }

  constructor(
    private loggingService: LoggingService,
    private entityMapper: EntityMapperService,
  ) {}

  /**
   * Builds all validator functions that are part of the configuration object.
   * A validator function is a function that returns possible errors based
   * on the state of a Form Field.
   * If there is no Validator by a given name, issues a warning.
   * @param config The raw configuration object
   * @example
   * >>> buildValidators({ required: true, max: 5 })
   * [ Validators.required, Validators.max(5) ]
   * @see ValidatorFn
   */
  public buildValidators(config: FormValidatorConfig): FormControlOptions {
    const formControlOptions = {
      validators: [],
      asyncValidators: [],
    };

    for (const key of Object.keys(config)) {
      const validatorFn = this.getValidator(
        key as DynamicValidator,
        config[key],
      );

      if (validatorFn?.async) {
        const validatorFnWithReadableErrors = (control) =>
          validatorFn
            .fn(control)
            .then((res) => this.addHumanReadableError(key, res));
        formControlOptions.asyncValidators.push(validatorFnWithReadableErrors);
      } else if (validatorFn) {
        const validatorFnWithReadableErrors = (control: FormControl) =>
          this.addHumanReadableError(key, validatorFn.fn(control));
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
      case "pattern":
        if (validationValue.message) {
          return validationValue.message;
        } else {
          return $localize`Please enter a valid pattern`;
        }
      case "required":
        return $localize`This field is required`;
      case "validEmail":
        return $localize`Please enter a valid email`;
      case "matDatepickerParse":
        return $localize`Please enter a valid date`;
      case "isNumber":
        return $localize`Please enter a valid number`;
      case "uniqueId":
        return validationValue;
      default:
        this.loggingService.error(
          `No description defined for validator "${validator}": ${JSON.stringify(
            validationValue,
          )}`,
        );
        throw $localize`Invalid input`;
    }
  }

  private buildUniqueIdValidator(value: string): {
    async: true;
    fn: AsyncPromiseValidatorFn;
  } {
    return {
      fn: uniqueIdValidator(() =>
        this.entityMapper
          .loadType(value)
          // TODO: extend this to allow checking for any configurable property (e.g. Child.name rather than only id)
          .then((entities) => entities.map((entity) => entity.getId())),
      ),
      async: true,
    };
  }
}

export type AsyncPromiseValidatorFn = (
  control: FormControl,
) => Promise<ValidationErrors | null>;
