import { Injectable } from "@angular/core";
import { ValidatorFn } from "@angular/forms";
import { FieldValidator } from "../../common-components/entity-form/dynamic-form-validators/field-validator";
import { DateDatatype } from "./date.datatype";
import { DefaultDatatype } from "../../entity/default-datatype/default.datatype";
import { MonthDatatype } from "../month/month.datatype";
import { descriptionForDateValidator, minDateValidator } from "./date-limit";

/** `minDate: "2020-01-01"` (or `"$now"`): the date must be on or after the given date */
@Injectable()
export class MinDateValidator extends FieldValidator {
  static override readonly key = "minDate";
  readonly label = $localize`Minimum Date`;
  override readonly configComponent = "DateValidatorSetting";

  override labelFor(datatype: DefaultDatatype): string {
    return datatype instanceof MonthDatatype
      ? $localize`Minimum Month`
      : this.label;
  }
  override readonly datatypesSupported = [DateDatatype];

  build(value: unknown): ValidatorFn {
    return minDateValidator(value);
  }

  override message(error: unknown): string {
    return descriptionForDateValidator("minDate", error);
  }
}
