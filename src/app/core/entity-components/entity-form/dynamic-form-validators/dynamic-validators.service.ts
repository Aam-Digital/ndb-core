import { Injectable } from "@angular/core";
import { DynamicValidator, FormValidatorConfig } from "./form-validator-config";
import { ValidatorFn, Validators } from "@angular/forms";
import { LoggingService } from "../../../logging/logging.service";

type ValidatorFactory = (value: any, name: string) => ValidatorFn;

@Injectable({
  providedIn: "root",
})
export class DynamicValidatorsService {
  /**
   * A map of all validators along with a factory that generates the validator function
   * given a value that serves as basis for the validation.
   * @private
   */
  private static validators: {
    [key in DynamicValidator]: ValidatorFactory | null;
  } = {
    min: (value) => Validators.min(value as number),
    max: (value) => Validators.max(value as number),
    pattern: (value) => Validators.pattern(value as string),
    validEmail: (value) => (value ? Validators.email : null),
    required: (value) => (value ? Validators.required : null),
  };

  constructor(private loggingService: LoggingService) {}

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
  public buildValidators(config: FormValidatorConfig): ValidatorFn[] {
    const validators: ValidatorFn[] = [];
    for (const key of Object.keys(config)) {
      const factory = DynamicValidatorsService.validators[key];
      if (!factory) {
        this.loggingService.warn(
          `Trying to generate validator ${key} but it does not exist`
        );
        continue;
      }
      const validatorFn = factory(config[key], key);
      if (validatorFn !== null) {
        validators.push(validatorFn);
      }
      // A validator function of `null` is a legal case. For example
      // { required : false } produces a `null` validator function
    }
    return validators;
  }

  /**
   * returns a description for a validator given the value where it failed.
   * The value is specific for a certain validator. For example, the `min` validator
   * produces a value that could look something like `{ min: 5, current: 4 }`
   * @param validator The validator to get the description for
   * @param validationValue The value associated with the validator
   */
  public descriptionForValidator(
    validator: DynamicValidator,
    validationValue: any
  ): string {
    switch (validator) {
      case "min":
        return $localize`Must be greater than ${validationValue.min}`;
      case "max":
        return $localize`Cannot be greater than ${validationValue.max}`;
      case "pattern":
        return $localize`Please enter a valid pattern`;
      case "required":
        return $localize`This field is required`;
      case "validEmail":
        return $localize`Please enter a valid email`;
    }
  }
}
