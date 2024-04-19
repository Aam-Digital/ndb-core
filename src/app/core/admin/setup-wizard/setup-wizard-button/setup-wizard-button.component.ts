import { Component } from "@angular/core";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatButton } from "@angular/material/button";
import { RouterLink } from "@angular/router";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { Config } from "../../../config/config";
import {
  CONFIG_SETUP_WIZARD_ID,
  SetupWizardConfig,
} from "../setup-wizard-config";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { filter } from "rxjs/operators";

@UntilDestroy()
@Component({
  selector: "app-setup-wizard-button",
  standalone: true,
  imports: [FaIconComponent, MatButton, RouterLink],
  templateUrl: "./setup-wizard-button.component.html",
  styleUrls: ["./setup-wizard-button.component.scss"],
})
export class SetupWizardButtonComponent {
  showSetupWizard: boolean;

  constructor(entityMapper: EntityMapperService) {
    entityMapper
      .load(Config, CONFIG_SETUP_WIZARD_ID)
      .then((r: Config<SetupWizardConfig>) => {
        this.updateStatus(r.data);
      });

    entityMapper
      .receiveUpdates<Config<SetupWizardConfig>>(Config)
      .pipe(
        untilDestroyed(this),
        filter(({ entity }) => entity.getId() === CONFIG_SETUP_WIZARD_ID),
      )
      .subscribe((update) => this.updateStatus(update.entity.data));
  }

  private updateStatus(config: SetupWizardConfig) {
    this.showSetupWizard = !config.finished;
  }
}
