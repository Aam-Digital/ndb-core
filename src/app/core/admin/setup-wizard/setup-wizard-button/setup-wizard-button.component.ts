import { Component, OnInit } from "@angular/core";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatButton } from "@angular/material/button";
import { Router } from "@angular/router";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { Config } from "../../../config/config";
import {
  CONFIG_SETUP_WIZARD_ID,
  SetupWizardConfig,
} from "../setup-wizard-config";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { filter } from "rxjs/operators";
import { LoggingService } from "../../../logging/logging.service";

@UntilDestroy()
@Component({
  selector: "app-setup-wizard-button",
  standalone: true,
  imports: [FaIconComponent, MatButton],
  templateUrl: "./setup-wizard-button.component.html",
  styleUrls: ["./setup-wizard-button.component.scss"],
})
export class SetupWizardButtonComponent implements OnInit {
  showSetupWizard: boolean;

  constructor(
    private entityMapper: EntityMapperService,
    private logger: LoggingService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.entityMapper
      .load(Config, CONFIG_SETUP_WIZARD_ID)
      .then((r: Config<SetupWizardConfig>) => {
        this.updateStatus(r.data);
        if (!r.data.finished && r.data.openOnStart) {
          this.navigateToWizard();
        }
      })
      .catch((e) => this.logger.debug("No Setup Wizard Config found"));

    this.entityMapper
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

  navigateToWizard() {
    this.router.navigate(["/admin/setup-wizard"]);
  }
}
