import { Provider } from "@angular/core";
import { WithinParentValidator } from "../../../basic-datatypes/date-range/within-parent-validator";
import { SelectionConditionValidator } from "../../../basic-datatypes/entity/selection-condition";
import { MinAgeValidator } from "../../../basic-datatypes/date-with-age/min-age.validator";
import { MaxAgeValidator } from "../../../basic-datatypes/date-with-age/max-age.validator";
import { MinValidator } from "../../../basic-datatypes/number/min.validator";
import { MaxValidator } from "../../../basic-datatypes/number/max.validator";
import { PatternValidator } from "../../../basic-datatypes/string/pattern.validator";
import { MinDateValidator } from "../../../basic-datatypes/date/min-date.validator";
import { MaxDateValidator } from "../../../basic-datatypes/date/max-date.validator";
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
  MinValidator,
  MaxValidator,
  PatternValidator,
  MinDateValidator,
  MaxDateValidator,
  MinAgeValidator,
  MaxAgeValidator,
  UniqueIdValidator,
  ReadonlyAfterSetValidator,
  WithinParentValidator,
  SelectionConditionValidator,
].map((useClass) => ({ provide: FieldValidator, useClass, multi: true }));
