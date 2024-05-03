import { Component, OnDestroy, OnInit } from "@angular/core";
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
import { LoggingService } from "../../logging/logging.service";

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
export class SetupWizardComponent implements OnInit, OnDestroy {
  config: SetupWizardConfig;

  private configEntity: Config<SetupWizardConfig>;

  constructor(
    private entityMapper: EntityMapperService,
    private logger: LoggingService,
  ) {}

  ngOnInit() {
    this.entityMapper
      .load(Config, CONFIG_SETUP_WIZARD_ID)
      .then((r: Config<SetupWizardConfig>) => {
        this.configEntity = r;
        this.config = r.data;
        this.onNextStep(this.config.currentStep ?? 0);
      })
      .catch((e) => this.logger.debug("no setup wizard config loaded", e));
  }

  ngOnDestroy(): void {
    if (!this.configEntity) {
      return;
    }

    this.configEntity.data = this.config;
    this.entityMapper.save(this.configEntity);
  }

  onNextStep(newStep: number) {
    this.config.currentStep = newStep;
    this.config.steps[this.config.currentStep].completed = true;
  }
}
