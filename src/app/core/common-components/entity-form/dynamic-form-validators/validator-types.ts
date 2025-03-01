import { FormControl, ValidationErrors } from "@angular/forms";

export type AsyncPromiseValidatorFn = (
  control: FormControl,
) => Promise<ValidationErrors | null>;
