import {
  FormControl,
  FormControlStatus,
  ValidationErrors,
} from "@angular/forms";
import { AsyncPromiseValidatorFn } from "./dynamic-validators.service";
import { Entity } from "../../../entity/model/entity";

/**
 * Validator to ensure a field becomes readonly after it has been saved once.
 * @example
 * readonlyAfterSet: true
 */
export function buildReadonlyValidator(entity: Entity): {
  async: true;
  fn: AsyncPromiseValidatorFn;
} {
  let keepDisabled: boolean = !entity.isNew;

  return {
    async: true,
    fn: async (control: FormControl): Promise<ValidationErrors | null> => {
      control.statusChanges.subscribe((status: FormControlStatus) => {
        if (status === "DISABLED") {
          // after the form was disabled once, keep this disabled now
          keepDisabled = true;
        }

        if (keepDisabled) {
          control.disable({
            onlySelf: true,
            emitEvent: false,
          });
        }
      });

      return null;
    },
  };
}
