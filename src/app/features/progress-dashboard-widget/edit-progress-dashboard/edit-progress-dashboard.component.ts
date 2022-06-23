import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import {
  ProgressDashboardPart,
  ProgressDashboardConfig,
} from "../progress-dashboard/progress-dashboard-config";
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormGroupDirective,
  NgForm,
  ValidationErrors,
  Validators,
} from "@angular/forms";
import { ErrorStateMatcher } from "@angular/material/core";

export interface EditProgressDashboardComponentData {
  title: string;
  parts: ProgressDashboardPart[];
}

@Component({
  selector: "app-edit-progress-dashboard",
  templateUrl: "./edit-progress-dashboard.component.html",
  styleUrls: ["./edit-progress-dashboard.component.scss"],
})
export class EditProgressDashboardComponent {
  outputData: FormGroup;
  title: FormControl;
  parts: FormArray;
  currentErrorStateMatcher = new FormCurrentErrorStateMatcher();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ProgressDashboardConfig,
    private fb: FormBuilder
  ) {
    this.title = new FormControl(data.title);
    this.parts = fb.array(data.parts.map((part) => this.formGroup(part)));
    this.outputData = new FormGroup({
      title: this.title,
      parts: this.parts,
    });
  }

  formGroup(part: ProgressDashboardPart): FormGroup {
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

  currentLessThanTarget(control: FormGroup): ValidationErrors | null {
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
    this.parts.push(this.formGroup(newPart));
  }

  get tooltipOnSave(): string {
    return this.parts.valid
      ? ""
      : $localize`:Shown when there are errors that prevent saving:Fix the errors to save the form`;
  }

  removePart(index: number) {
    this.parts.removeAt(index);
  }
}

class FormCurrentErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    return !control?.parent?.valid;
  }
}
