import { Injectable } from "@angular/core";
import { ValidatorFn } from "@angular/forms";
import {
  FieldValidator,
  ValidatorContext,
} from "../../common-components/entity-form/dynamic-form-validators/field-validator";
import { DateWithAgeDatatype } from "./date-with-age.datatype";
import { ageRangeValidator, descriptionForAgeValidator } from "./age-limit";

/** `minAge: 6`: the age calculated from the date of birth must be at least the given number of years */
@Injectable()
export class MinAgeValidator extends FieldValidator {
  static override readonly key = "minAge";
  override readonly datatypesSupported = [DateWithAgeDatatype];

  build(_value: unknown, { config }: ValidatorContext): ValidatorFn {
    return ageRangeValidator("minAge", config);
  }

  override message(error: unknown): string {
    return descriptionForAgeValidator("minAge", error);
  }
}
