import { Component } from "@angular/core";
import { timeUnitsPrimary } from "../time-interval";
import { FormsModule } from "@angular/forms";
import { MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { NgForOf } from "@angular/common";

@Component({
  selector: "app-custom-interval",
  templateUrl: "./custom-interval.component.html",
  styleUrls: ["./custom-interval.component.scss"],
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatInputModule,
    NgForOf,
  ],
})
export class CustomIntervalComponent {
  availableUnits: { label: string; unit: string }[] = timeUnitsPrimary;

  selectedValue: number = 1;
  selectedUnit: string = "weeks";

  validateValue() {
    // if we switch to ReactiveForms here then maybe change this to Validators
    if (this.selectedValue < 1) {
      this.selectedValue = 1;
    }
  }
}
