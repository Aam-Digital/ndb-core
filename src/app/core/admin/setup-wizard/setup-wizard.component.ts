import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  MatStep,
  MatStepper,
  MatStepperIcon,
  MatStepperNext,
} from "@angular/material/stepper";
import { MatActionList, MatListItem } from "@angular/material/list";
import { RouterLink } from "@angular/router";
import { MatButton } from "@angular/material/button";

@Component({
  selector: "app-setup-wizard",
  standalone: true,
  imports: [
    CommonModule,
    MatStepper,
    MatStep,
    MatActionList,
    MatListItem,
    RouterLink,
    MatButton,
    MatStepperNext,
    MatStepperIcon,
  ],
  templateUrl: "./setup-wizard.component.html",
  styleUrl: "./setup-wizard.component.scss",
})
export class SetupWizardComponent {}
