import { Injectable } from "@angular/core";
import { AbstractControl, ValidatorFn, Validators } from "@angular/forms";
import { NumberDatatype } from "../../../basic-datatypes/number/number.datatype";
import { StringDatatype } from "../../../basic-datatypes/string/string.datatype";
import { LongTextDatatype } from "../../../basic-datatypes/string/long-text.datatype";
import { EmailDatatype } from "../../../basic-datatypes/string/email.datatype";
import { UrlDatatype } from "../../../basic-datatypes/string/url.datatype";
import { DefaultDatatype } from "../../../entity/default-datatype/default.datatype";
import { FieldValidator } from "./field-validator";

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

/** `required: true`: the field must have a value */
@Injectable()
export class RequiredValidator extends FieldValidator<boolean> {
  static override readonly key = "required";
  override readonly warning = "never";

  build(): ValidatorFn {
    return Validators.required;
  }

  override message(): string {
    return $localize`This field is required`;
  }
}

/** `min: 5`: the number must be at least the given value */
@Injectable()
export class MinValidator extends FieldValidator<number> {
  static override readonly key = "min";
  override readonly datatypesSupported = [NumberDatatype];

  build(value: number): ValidatorFn {
    return Validators.min(value);
  }

  override message(error: { min: number }): string {
    return $localize`Must be greater than ${error.min}`;
  }
}

/** `max: 10`: the number must be at most the given value */
@Injectable()
export class MaxValidator extends FieldValidator<number> {
  static override readonly key = "max";
  override readonly datatypesSupported = [NumberDatatype];

  build(value: number): ValidatorFn {
    return Validators.max(value);
  }

  override message(error: { max: number }): string {
    return $localize`Cannot be greater than ${error.max}`;
  }
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
