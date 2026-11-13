import { FieldValidator } from "../../common-components/entity-form/dynamic-form-validators/field-validator";
import { DefaultDatatype } from "../../entity/default-datatype/default.datatype";
import { MonthDatatype } from "../month/month.datatype";
import { DateDatatype } from "./date.datatype";
import { descriptionForDateValidator } from "./date-limit";

/** A limit of a date field (the key of the rule is `minDate` or `maxDate`), also of a month field. */
export abstract class DateLimitValidator extends FieldValidator {
  override readonly datatypesSupported = [DateDatatype];
  override readonly configComponent = "DateValidatorSetting";

  /** the name of the rule for a month field */
  protected abstract readonly monthLabel: string;

  override labelFor(datatype: DefaultDatatype): string {
    return datatype instanceof MonthDatatype ? this.monthLabel : this.label;
  }

  override message(error: unknown): string {
    return descriptionForDateValidator(
      this.key as "minDate" | "maxDate",
      error,
    );
  }
}
