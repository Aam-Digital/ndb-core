import { Injectable } from "@angular/core";
import { ValidatorFn } from "@angular/forms";
import { FieldValidator } from "../../common-components/entity-form/dynamic-form-validators/field-validator";
import { DateDatatype } from "./date.datatype";
import { DefaultDatatype } from "../../entity/default-datatype/default.datatype";
import { MonthDatatype } from "../month/month.datatype";
import { descriptionForDateValidator, maxDateValidator } from "./date-limit";

/** `maxDate: "$now"` (or a date): the date must be on or before the given date */
@Injectable()
export class MaxDateValidator extends FieldValidator {
  static override readonly key = "maxDate";
  readonly label = $localize`Maximum Date`;
  override readonly configComponent = "DateValidatorSetting";

  override labelFor(datatype: DefaultDatatype): string {
    return datatype instanceof MonthDatatype
      ? $localize`Maximum Month`
      : this.label;
  }
  override readonly datatypesSupported = [DateDatatype];

  build(value: unknown): ValidatorFn {
    return maxDateValidator(value);
  }

  override message(error: unknown): string {
    return descriptionForDateValidator("maxDate", error);
  }
}
