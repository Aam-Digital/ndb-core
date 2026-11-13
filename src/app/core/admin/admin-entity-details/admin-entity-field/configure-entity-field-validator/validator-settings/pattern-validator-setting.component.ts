import { Component, effect, input, untracked } from "@angular/core";
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
} from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { HelpButtonComponent } from "#src/app/core/common-components/help-button/help-button.component";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { ValidatorSettingComponent } from "./validator-setting";

/** the value of the `pattern` rule: the regular expression, with an error text if one is set */
type PatternSetting = string | RegExp | { pattern: string; message?: string };

/**
 * Setting of the `pattern` rule: a regular expression and, optionally, the error text shown to users.
 * The value is the expression as it is, or `{ pattern, message }` if an error text is entered.
 */
@DynamicComponent("PatternValidatorSetting")
@Component({
  selector: "app-pattern-validator-setting",
  imports: [
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    HelpButtonComponent,
  ],
  template: `
    <form [formGroup]="parts" class="flex-row flex-wrap align-start gap-small">
      <mat-form-field floatLabel="always" class="flex-grow">
        <mat-label>{{ label() }}</mat-label>
        <input formControlName="pattern" matInput />
        @if (description()) {
          <app-help-button matSuffix [text]="description()" />
        }
        <mat-error i18n>Not a valid regular expression</mat-error>
        <mat-hint align="start" i18n>
          Learn about regular expressions at
          <a
            href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions"
            target="_blank"
            rel="noopener"
          >
            developer.mozilla.org
          </a>
        </mat-hint>
      </mat-form-field>

      <mat-form-field floatLabel="always" class="flex-grow">
        <mat-label i18n>Validation Error Text for Pattern</mat-label>
        <input formControlName="message" matInput />
        <app-help-button
          matSuffix
          text="Optional custom message shown to users when their input does not match the pattern. If empty, a generic error message is displayed."
          i18n-text
        />
        <mat-hint align="start" i18n>
          Shown when the entered value does not match the pattern above
        </mat-hint>
      </mat-form-field>
    </form>
  `,
})
export class PatternValidatorSettingComponent implements ValidatorSettingComponent<PatternSetting> {
  readonly formControl = input.required<FormControl<PatternSetting | null>>();
  readonly label = input.required<string>();
  readonly description = input<string>();

  protected readonly parts = new FormGroup({
    pattern: new FormControl("", validRegex),
    message: new FormControl(""),
  });

  constructor() {
    effect((onCleanup) => {
      const control = this.formControl();
      untracked(() => {
        this.parts.setValue(splitPattern(control.value), { emitEvent: false });
        this.syncMessageAvailability();
        // the value of the rule is checked too, so that an invalid expression blocks "Apply" of the dialog
        control.addValidators(validPatternSetting);
        control.updateValueAndValidity({ emitEvent: false });
      });
      const sub = this.parts.valueChanges.subscribe(() => {
        this.syncMessageAvailability();
        control.setValue(joinPattern(this.parts.getRawValue()));
        control.markAsDirty();
      });
      onCleanup(() => {
        sub.unsubscribe();
        control.removeValidators(validPatternSetting);
      });
    });
  }

  /** the error text only makes sense together with a pattern */
  private syncMessageAvailability() {
    const message = this.parts.controls.message;
    if (this.parts.controls.pattern.value) {
      message.enable({ emitEvent: false });
    } else {
      message.disable({ emitEvent: false });
    }
  }
}

function splitPattern(value: PatternSetting | null): {
  pattern: string;
  message: string;
} {
  if (typeof value === "string") {
    return { pattern: value, message: "" };
  }
  if (value instanceof RegExp) {
    return { pattern: value.source, message: "" };
  }
  return { pattern: value?.pattern ?? "", message: value?.message ?? "" };
}

function joinPattern(parts: {
  pattern: string | null;
  message: string | null;
}): PatternSetting | null {
  if (!parts.pattern) {
    return null;
  }
  return parts.message
    ? { pattern: parts.pattern, message: parts.message }
    : parts.pattern;
}

function isValidRegex(pattern: string | null): boolean {
  if (!pattern) {
    return true;
  }
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

/** Marks the control as invalid if its value cannot be compiled as a regular expression. */
function validRegex(control: AbstractControl): ValidationErrors | null {
  return isValidRegex(control.value) ? null : { invalidPattern: true };
}

function validPatternSetting(
  control: AbstractControl,
): ValidationErrors | null {
  return isValidRegex(splitPattern(control.value).pattern)
    ? null
    : { invalidPattern: true };
}
