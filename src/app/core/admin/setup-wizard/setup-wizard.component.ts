import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  computed,
} from "@angular/core";
import {
  MatStep,
  MatStepper,
  MatStepperIcon,
  MatStepperNext,
} from "@angular/material/stepper";
import { MatActionList, MatListItem } from "@angular/material/list";
import { RouterLink } from "@angular/router";
import { MatButton } from "@angular/material/button";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MarkdownComponent } from "ngx-markdown";
import { MatTooltip } from "@angular/material/tooltip";
import { MatDialogRef } from "@angular/material/dialog";
import { ViewTitleComponent } from "../../common-components/view-title/view-title.component";
import { LOCAL_STORAGE_TOKEN } from "../../../utils/di-tokens";
import { SetupWizardService } from "./setup-wizard.service";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-setup-wizard",
  imports: [
    ViewTitleComponent,
    MatStepper,
    MatStep,
    MatActionList,
    MatListItem,
    RouterLink,
    MatButton,
    MatStepperNext,
    MatStepperIcon,
    MatProgressSpinner,
    MarkdownComponent,
    MatTooltip,
  ],
  templateUrl: "./setup-wizard.component.html",
  styleUrl: "./setup-wizard.component.scss",
})
export class SetupWizardComponent implements OnInit {
  private readonly localStorage = inject(LOCAL_STORAGE_TOKEN);
  private readonly setupWizardService = inject(SetupWizardService);
  private dialogRef = inject<MatDialogRef<any>>(MatDialogRef, {
    optional: true,
  });

  readonly LOCAL_STORAGE_KEY = "SETUP_WIZARD_STATUS";

  readonly state = this.setupWizardService.state;
  readonly steps = computed(
    () => this.setupWizardService.config()?.data?.steps ?? [],
  );

  currentStep: number = 0;
  completedSteps: number[] = [0];

  ngOnInit() {
    this.loadLocalStatus();
  }

  private loadLocalStatus() {
    const storedStatus = this.localStorage.getItem(this.LOCAL_STORAGE_KEY);
    if (storedStatus) {
      const parsedStatus = JSON.parse(storedStatus);

      // set delayed to ensure steps are loaded first
      setTimeout(() => {
        this.currentStep = parsedStatus.currentStep;
        this.completedSteps = parsedStatus.completedSteps;
      });
    }
  }

  onNextStep(newStep: number) {
    this.currentStep = newStep;
    if (!this.completedSteps.includes(newStep)) {
      this.completedSteps.push(newStep);
    }

    this.localStorage.setItem(
      this.LOCAL_STORAGE_KEY,
      JSON.stringify({
        currentStep: this.currentStep,
        completedSteps: this.completedSteps,
      }),
    );
  }

  async finishWizard() {
    await this.setupWizardService.markAsFinished();
    this.dialogRef?.close();
  }
}
