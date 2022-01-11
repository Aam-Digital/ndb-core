import { Injectable } from "@angular/core";
import { DynamicValidator, FormValidatorConfig } from "./form-validator-config";
import { ValidatorFn, Validators } from "@angular/forms";

type ValidatorFactory = (value: any, name: string) => ValidatorFn;

@Injectable({
  providedIn: "root",
})
export class DynamicValidatorsService {
  private static validators: {
    [key in DynamicValidator]: ValidatorFactory | null;
  } = {
    min: (value) => Validators.min(value as number),
    max: (value) => Validators.max(value as number),
    pattern: (value) => Validators.pattern(value as string),
    validEmail: (value) => (value ? Validators.email : null),
    required: (value) => (value ? Validators.required : null),
  };

  public buildValidators(config: FormValidatorConfig): ValidatorFn[] {
    const validators: ValidatorFn[] = [];
    for (const key of Object.keys(config)) {
      const factory = DynamicValidatorsService.validators[key];
      const validatorFn = factory(config[key], key);
      if (validatorFn !== null) {
        validators.push(validatorFn);
      }
    }
    return validators;
  }

  public descriptionForValidator(validator: DynamicValidator): string {
    switch (validator) {
      case "min":
        return $localize`Please enter a greater value`;
      case "max":
        return $localize`Please enter a smaller value`;
      case "pattern":
        return $localize`Please enter a valid pattern`;
      case "required":
        return $localize`This field is required`;
      case "validEmail":
        return $localize`Please enter a valid email`;
    }
  }
}
