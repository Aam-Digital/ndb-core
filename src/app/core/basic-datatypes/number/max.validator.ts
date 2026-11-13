import { Injectable } from "@angular/core";
import { ValidatorFn, Validators } from "@angular/forms";
import { FieldValidator } from "../../common-components/entity-form/dynamic-form-validators/field-validator";
import { NumberDatatype } from "./number.datatype";

/** `max: 10`: the number must be at most the given value */
@Injectable()
export class MaxValidator extends FieldValidator<number> {
  static override readonly key = "max";
  readonly label = $localize`Maximum Value`;
  override readonly configComponent = "NumberValidatorSetting";
  override readonly datatypesSupported = [NumberDatatype];

  build(value: number): ValidatorFn {
    return Validators.max(value);
  }

  override message(error: { max: number }): string {
    return $localize`Cannot be greater than ${error.max}`;
  }
}
