import { Injectable } from "@angular/core";
import { AbstractControl, ValidatorFn, Validators } from "@angular/forms";
import { FieldValidator } from "../../common-components/entity-form/dynamic-form-validators/field-validator";
import { DefaultDatatype } from "../../entity/default-datatype/default.datatype";
import { StringDatatype } from "./string.datatype";
import { LongTextDatatype } from "./long-text.datatype";
import { EmailDatatype } from "./email.datatype";
import { UrlDatatype } from "./url.datatype";

/**
 * creates a pattern validator that also carries a predefined
 * message
 * @example
 * >>> validator = patternWithMessage(/foo/, "Can only be foo");
 * >>> validator(invalidFormField);
 * <pre>
 * {
 *   message: "Can only be foo",
 *   requiredPattern: "foo",
 *   actualValue: "bar"
 * }
 * </pre>
 */
export function patternWithMessage(
  pattern: string | RegExp,
  message: string,
): ValidatorFn {
  const patternValidator = Validators.pattern(pattern);

  return (control: AbstractControl) => {
    const errors = patternValidator(control);
    if (errors !== null) {
      Object.assign(errors.pattern, {
        message: message,
      });
    }
    return errors;
  };
}

/**
 * `pattern: "[a-z]*"`: the text must match the regular expression,
 * or `pattern: { pattern: "[0-9]{10}", message: "Enter a 10-digit phone number" }` with a custom error message
 */
@Injectable()
export class PatternValidator extends FieldValidator<
  string | RegExp | { pattern: string; message: string }
> {
  static override readonly key = "pattern";

  override appliesTo(datatype: DefaultDatatype): boolean {
    // not by inheritance: link and file fields extend the StringDatatype as they store ids
    return [
      StringDatatype.dataType,
      LongTextDatatype.dataType,
      EmailDatatype.dataType,
      UrlDatatype.dataType,
    ].includes(datatype.dataType);
  }

  build(
    value: string | RegExp | { pattern: string; message: string },
  ): ValidatorFn {
    if (typeof value === "string" || value instanceof RegExp) {
      return Validators.pattern(value);
    }
    return patternWithMessage(value.pattern, value.message);
  }

  override message(error: { message?: string }): string {
    return error.message || $localize`Please enter a valid pattern`;
  }
}
