import { ValidatorFn, Validators } from "@angular/forms";
import { FieldValidator } from "../../common-components/entity-form/dynamic-form-validators/field-validator";
import { NumberDatatype } from "./number.datatype";

/** A limit of a number field (the key of the rule is `min` or `max`), whose setting is a number. */
export abstract class NumberLimitValidator extends FieldValidator<number> {
  override readonly datatypesSupported = [NumberDatatype];
  override readonly configComponent = "NumberValidatorSetting";

  override get key(): "min" | "max" {
    return super.key as "min" | "max";
  }

  build(value: number): ValidatorFn {
    return this.key === "min" ? Validators.min(value) : Validators.max(value);
  }

  override message(error: { min?: number; max?: number }): string {
    return this.key === "min"
      ? $localize`Must be greater than ${error.min}`
      : $localize`Cannot be greater than ${error.max}`;
  }
}
