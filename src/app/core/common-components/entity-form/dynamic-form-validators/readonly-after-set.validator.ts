import { Injectable } from "@angular/core";
import {
  AbstractControl,
  FormControlStatus,
  ValidationErrors,
  ValidatorFn,
} from "@angular/forms";
import { Entity } from "../../../entity/model/entity";
import { FieldValidator, ValidatorContext } from "./field-validator";

/**
 * Validator to ensure a field becomes readonly after it has been saved once.
 * @example
 * readonlyAfterSet: true
 */
export function buildReadonlyValidator(entity: Entity): {
  fn: ValidatorFn;
} {
  let keepDisabled: boolean = !entity.isNew;
  let subscribed = false;

  return {
    fn: (control: AbstractControl): ValidationErrors | null => {
      if (!subscribed) {
        subscribed = true;
        control.statusChanges.subscribe((status: FormControlStatus) => {
          if (status === "DISABLED") {
            keepDisabled = true;
          }

          if (keepDisabled) {
            control.disable({
              onlySelf: true,
              emitEvent: false,
            });
          }
        });
      }

      if (keepDisabled && !control.disabled) {
        // Defer to avoid mutating control state during the validation cycle
        Promise.resolve().then(() => {
          if (keepDisabled) {
            control.disable({ onlySelf: true, emitEvent: false });
          }
        });
      }

      return null;
    },
  };
}

/** `readonlyAfterSet: true`: the field can only be edited until the record is saved for the first time */
@Injectable()
export class ReadonlyAfterSetValidator extends FieldValidator<boolean> {
  static override readonly key = "readonlyAfterSet";
  override readonly warning = "never";

  build(_value: boolean, { entity }: ValidatorContext): ValidatorFn {
    return buildReadonlyValidator(entity).fn;
  }
}
