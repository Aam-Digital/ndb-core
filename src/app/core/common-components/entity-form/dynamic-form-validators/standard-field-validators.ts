import { Provider } from "@angular/core";
import { WithinParentValidator } from "../../../basic-datatypes/date-range/within-parent-validator";
import { SelectionConditionValidator } from "../../../basic-datatypes/entity/selection-condition";
import { MaxAgeValidator, MinAgeValidator } from "./age-validators";
import {
  MaxValidator,
  MinValidator,
  PatternValidator,
  RequiredValidator,
} from "./basic-validators";
import { MaxDateValidator, MinDateValidator } from "./date-validators";
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
