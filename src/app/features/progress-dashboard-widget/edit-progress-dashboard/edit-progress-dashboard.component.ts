import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import {
  ProgressDashboardPart,
  ProgressDashboardConfig,
} from "../progress-dashboard/progress-dashboard-config";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from "@angular/forms";
import { ErrorStateMatcher } from "@angular/material/core";
import { AngularForm } from "@oasisdigital/angular-typed-forms-helpers";

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
  /**
   * This marks the control as invalid when the whole form has an error
   */
  readonly currentErrorStateMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null) => !control?.parent?.valid,
  };

  title = new FormControl(this.data.title, [Validators.required]);
  parts = this.fb.array(
    this.data.parts.map((part) => this.createPartForm(part))
  );
  outputData = new FormGroup({
    title: this.title,
    parts: this.parts,
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: ProgressDashboardConfig,
    private fb: FormBuilder
  ) {}

  createPartForm(part: ProgressDashboardPart) {
    return this.fb.group(
      {
        label: this.fb.control(part.label, [Validators.required]),
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

  currentLessThanTarget(
    control: AngularForm<ProgressDashboardPart>
  ): ValidationErrors | null {
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
    this.parts.push(this.createPartForm(newPart));
  }

  removePart(index: number) {
    this.parts.removeAt(index);
  }
}
