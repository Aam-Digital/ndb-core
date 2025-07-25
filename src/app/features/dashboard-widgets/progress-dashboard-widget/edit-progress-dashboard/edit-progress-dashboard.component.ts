import { Component, inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import {
  ProgressDashboardConfig,
  ProgressDashboardPart,
} from "../progress-dashboard/progress-dashboard-config";
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from "@angular/forms";
import { ErrorStateMatcher } from "@angular/material/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { DialogCloseComponent } from "../../../../core/common-components/dialog-close/dialog-close.component";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { TypedFormGroup } from "#src/app/core/common-components/entity-form/entity-form";

export interface EditProgressDashboardComponentData {
  title: string;
  parts: ProgressDashboardPart[];
}

@Component({
  selector: "app-edit-progress-dashboard",
  templateUrl: "./edit-progress-dashboard.component.html",
  styleUrls: ["./edit-progress-dashboard.component.scss"],
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    DialogCloseComponent,
    MatButtonModule,
    FontAwesomeModule,
    MatTooltipModule,
  ],
})
export class EditProgressDashboardComponent implements OnInit {
  private data = inject<ProgressDashboardConfig>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  /**
   * This marks the control as invalid when the whole form has an error
   */
  readonly currentErrorStateMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null) => !control?.parent?.valid,
  };

  title: FormControl;
  parts: FormArray;
  outputData: FormGroup;

  ngOnInit(): void {
    this.title = new FormControl(this.data.title, [Validators.required]);
    this.parts = this.fb.array(
      this.data.parts.map((part) => this.createPartForm(part)),
    );
    this.outputData = new FormGroup({
      title: this.title,
      parts: this.parts,
    });
  }

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
      },
    );
  }

  currentLessThanTarget(
    control: TypedFormGroup<ProgressDashboardPart>,
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
