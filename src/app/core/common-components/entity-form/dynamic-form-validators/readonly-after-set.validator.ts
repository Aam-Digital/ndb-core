import { FormControl, ValidationErrors } from "@angular/forms";
import { AsyncPromiseValidatorFn } from "./dynamic-validators.service";

/**
 * Validator to ensure a field becomes readonly after it has been set once.
 * @example
 * readonlyAfterSet: true
 */
export function buildReadonlyValidator(): {
  async: true;
  fn: AsyncPromiseValidatorFn;
} {
  return {
    async: true,
    fn: async (control: FormControl): Promise<ValidationErrors | null> => {
      control.statusChanges.subscribe((v) => {
        if (control.value == control.defaultValue) {
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
