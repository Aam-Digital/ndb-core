import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
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
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { Config } from "../../config/config";
import {
  CONFIG_SETUP_WIZARD_ID,
  SetupWizardConfig,
  SetupWizardStep,
} from "./setup-wizard-config";
import { MarkdownComponent } from "ngx-markdown";
import { MatTooltip } from "@angular/material/tooltip";
import { Logging } from "../../logging/logging.service";
import { MatDialogRef } from "@angular/material/dialog";
import { ViewTitleComponent } from "../../common-components/view-title/view-title.component";
import { LOCAL_STORAGE_TOKEN } from "../../../utils/di-tokens";
import { resolveActiveConfig } from "../../language/active-locale";

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
    MarkdownComponent,
    MatTooltip,
  ],
  templateUrl: "./setup-wizard.component.html",
  styleUrl: "./setup-wizard.component.scss",
})
export class SetupWizardComponent implements OnInit {
  private readonly localStorage = inject(LOCAL_STORAGE_TOKEN);
  private entityMapper = inject(EntityMapperService);
  private dialogRef = inject<MatDialogRef<any>>(MatDialogRef, {
    optional: true,
  });

  readonly LOCAL_STORAGE_KEY = "SETUP_WIZARD_STATUS";

  steps: SetupWizardStep[];
  currentStep: number = 0;
  completedSteps: number[] = [0];

  private configEntity: Config<SetupWizardConfig>;

  async ngOnInit() {
    await this.loadSetupConfig();
    this.loadLocalStatus();
  }

  private async loadSetupConfig() {
    try {
      this.configEntity = await this.entityMapper.load<
        Config<SetupWizardConfig>
      >(Config, CONFIG_SETUP_WIZARD_ID);
      // display only - `configEntity` stays raw so saving keeps all languages
      this.steps = resolveActiveConfig(this.configEntity?.data.steps);
    } catch (e) {
      Logging.debug("no setup wizard config loaded", e);
    }
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
    this.configEntity.data.finished = true;
    await this.entityMapper.save(this.configEntity);
    this.dialogRef?.close();
  }
}
