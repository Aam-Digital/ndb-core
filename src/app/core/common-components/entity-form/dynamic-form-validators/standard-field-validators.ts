import { Provider } from "@angular/core";
import { WithinParentValidator } from "../../../basic-datatypes/date-range/within-parent-validator";
import { SelectionConditionValidator } from "../../../basic-datatypes/entity/selection-condition";
import { AgeRangeValidator } from "../../../basic-datatypes/date-with-age/age-range.validator";
import { RangeValidator } from "../../../basic-datatypes/number/range.validator";
import { PatternValidator } from "../../../basic-datatypes/string/pattern.validator";
import { DateRangeValidator } from "../../../basic-datatypes/date/date-range.validator";
import { RequiredValidator } from "./required.validator";
import { FieldValidator } from "./field-validator";
import { ReadonlyAfterSetValidator } from "./readonly-after-set.validator";
import { UniqueIdValidator } from "./unique-id.validator";

/**
 * The validation rules of the core module.
 * Add further providers to your modules to extend.
 */
export const standardFieldValidatorProviders: Provider[] = [
  RequiredValidator,
  RangeValidator,
  PatternValidator,
  DateRangeValidator,
  AgeRangeValidator,
  UniqueIdValidator,
  ReadonlyAfterSetValidator,
  WithinParentValidator,
  SelectionConditionValidator,
].map((useClass) => ({ provide: FieldValidator, useClass, multi: true }));
