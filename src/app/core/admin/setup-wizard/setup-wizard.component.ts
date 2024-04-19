import { Component, OnDestroy } from "@angular/core";
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
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { Config } from "../../config/config";
import {
  CONFIG_SETUP_WIZARD_ID,
  SetupWizardConfig,
} from "./setup-wizard-config";
import { MarkdownComponent } from "ngx-markdown";
import { MatTooltip } from "@angular/material/tooltip";

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
    MarkdownComponent,
    MatTooltip,
  ],
  templateUrl: "./setup-wizard.component.html",
  styleUrl: "./setup-wizard.component.scss",
})
export class SetupWizardComponent implements OnDestroy {
  config: SetupWizardConfig;
  currentStep: number;

  private configEntity: Config<SetupWizardConfig>;

  constructor(private entityMapper: EntityMapperService) {
    entityMapper
      .load(Config, CONFIG_SETUP_WIZARD_ID)
      .then((r: Config<SetupWizardConfig>) => {
        this.configEntity = r;
        this.config = r.data;
        this.currentStep = this.config.currentStep;
      });
  }

  ngOnDestroy(): void {
    if (!this.config) {
      return;
    }

    this.config.currentStep = this.currentStep;
    this.configEntity.data = this.config;
    this.entityMapper.save(this.configEntity);
  }
}
