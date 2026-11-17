import { Injectable } from "@angular/core";
import { ValidatorFn } from "@angular/forms";
import { FieldValidator } from "../../common-components/entity-form/dynamic-form-validators/field-validator";
import { DateDatatype } from "./date.datatype";
import { descriptionForDateValidator, maxDateValidator } from "./date-limit";

/** `maxDate: "$now"` (or a date): the date must be on or before the given date */
@Injectable()
export class MaxDateValidator extends FieldValidator {
  static override readonly key = "maxDate";
  override readonly datatypesSupported = [DateDatatype];

  build(value: unknown): ValidatorFn {
    return maxDateValidator(value);
  }

  override message(error: unknown): string {
    return descriptionForDateValidator("maxDate", error);
  }
}
