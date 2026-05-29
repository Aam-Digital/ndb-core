import {
  AbstractControl,
  FormControlStatus,
  ValidationErrors,
  ValidatorFn,
} from "@angular/forms";
import { Entity } from "../../../entity/model/entity";

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
