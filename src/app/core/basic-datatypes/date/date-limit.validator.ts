import { FieldValidator } from "../../common-components/entity-form/dynamic-form-validators/field-validator";
import { DateDatatype } from "./date.datatype";
import { descriptionForDateValidator } from "./date-limit";

/** A limit of a date field (the key of the rule is `minDate` or `maxDate`), also of a month field. */
export abstract class DateLimitValidator extends FieldValidator {
  override readonly datatypesSupported = [DateDatatype];
  override readonly configComponent = "DateValidatorSetting";

  override get key(): "minDate" | "maxDate" {
    return super.key as "minDate" | "maxDate";
  }

  override message(error: unknown): string {
    return descriptionForDateValidator(this.key, error);
  }
}
