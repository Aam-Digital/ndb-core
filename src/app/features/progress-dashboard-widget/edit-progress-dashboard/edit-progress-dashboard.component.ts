import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ProgressDashboardPart } from "../progress-dashboard/progress-dashboard-config";
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  FormGroupDirective,
  NgForm,
  ValidationErrors,
  Validators,
} from "@angular/forms";
import { ErrorStateMatcher } from "@angular/material/core";

export interface EditProgressDashboardComponentData {
  parts: ProgressDashboardPart[];
}

@Component({
  selector: "app-edit-progress-dashboard",
  templateUrl: "./edit-progress-dashboard.component.html",
  styleUrls: ["./edit-progress-dashboard.component.scss"],
})
export class EditProgressDashboardComponent {
  forms: UntypedFormArray;
  currentErrorStateMatcher = new FormCurrentErrorStateMatcher();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EditProgressDashboardComponentData,
    private fb: UntypedFormBuilder
  ) {
    this.forms = fb.array(data.parts.map((part) => this.formGroup(part)));
  }

  formGroup(part: ProgressDashboardPart): UntypedFormGroup {
    return this.fb.group(
      {
        label: this.fb.control(part.label),
        currentValue: this.fb.control(part.currentValue, [
          Validators.required,
          Validators.min(0),
        ]),
        targetValue: this.fb.control(part.targetValue, [
          Validators.required,
          Validators.min(0),
        ]),
      },
      {
        validators: [this.currentLessThanTarget],
      }
    );
  }

  currentLessThanTarget(control: UntypedFormGroup): ValidationErrors | null {
    const current = control.get("currentValue");
    const target = control.get("targetValue");
    if (current.value > target.value) {
      return {
        currentGtTarget: true,
      };
    } else {
      return null;
    }
  }

  addPart() {
    const newPart: ProgressDashboardPart = {
      label: $localize`:Part of a whole:Part`,
      currentValue: 1,
      targetValue: 10,
    };
    this.forms.push(this.formGroup(newPart));
  }

  get tooltipOnSave(): string {
    return this.forms.valid
      ? ""
      : $localize`:Shown when there are errors that prevent saving:Fix the errors to save the form`;
  }

  removePart(index: number) {
    this.forms.removeAt(index);
  }
}

class FormCurrentErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: UntypedFormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    return !control?.parent?.valid;
  }
}
