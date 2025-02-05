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
  let isDisabled = !entity.isNew;

  return {
    async: true,
    fn: async (control: FormControl): Promise<ValidationErrors | null> => {
      // Disable if already flagged
      if (isDisabled) {
        control.disable({ onlySelf: true, emitEvent: false });
        return null;
      }

      // For new entities, disable upon setting a value
      if (entity.isNew && control.value) {
        isDisabled = true;
        control.disable({ onlySelf: true, emitEvent: false });
      }

      return null;
    },
  };
}
