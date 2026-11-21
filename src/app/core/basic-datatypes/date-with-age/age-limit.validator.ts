import { ValidatorFn } from "@angular/forms";
import {
  FieldValidator,
  ValidatorContext,
} from "../../common-components/entity-form/dynamic-form-validators/field-validator";
import { DateWithAgeDatatype } from "./date-with-age.datatype";
import { ageRangeValidator, descriptionForAgeValidator } from "./age-limit";

/** A limit of the age calculated from the date of birth, in years (the key of the rule is `minAge` or `maxAge`). */
export abstract class AgeLimitValidator extends FieldValidator {
  override readonly datatypesSupported = [DateWithAgeDatatype];
  override readonly configComponent = "NumberValidatorSetting";

  override get key(): "minAge" | "maxAge" {
    return super.key as "minAge" | "maxAge";
  }

  build(_value: unknown, { config }: ValidatorContext): ValidatorFn {
    return ageRangeValidator(this.key, config);
  }

  override message(error: unknown): string {
    return descriptionForAgeValidator(this.key, error);
  }
}
