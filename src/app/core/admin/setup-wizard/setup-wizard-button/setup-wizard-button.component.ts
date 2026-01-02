import { Component, OnInit, inject } from "@angular/core";
import { Router } from "@angular/router";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { Config } from "../../../config/config";
import {
  CONFIG_SETUP_WIZARD_ID,
  SetupWizardConfig,
} from "../setup-wizard-config";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { filter } from "rxjs/operators";
import { Logging } from "../../../logging/logging.service";
import { environment } from "../../../../../environments/environment";
import { IconButtonComponent } from "#src/app/core/common-components/icon-button/icon-button.component";

/**
 * @deprecated Will be replaced by AssistantDialog panel
 */
@UntilDestroy()
@Component({
  selector: "app-setup-wizard-button",
  imports: [IconButtonComponent],
  templateUrl: "./setup-wizard-button.component.html",
  styleUrls: ["./setup-wizard-button.component.scss"],
})
export class SetupWizardButtonComponent implements OnInit {
  private entityMapper = inject(EntityMapperService);
  private router = inject(Router);

  showSetupWizard: boolean;

  ngOnInit() {
    this.entityMapper
      .load(Config, CONFIG_SETUP_WIZARD_ID)
      .then((r: Config<SetupWizardConfig>) => {
        this.updateStatus(r.data);
        if (!r.data.finished && r.data.openOnStart) {
          this.navigateToWizard();
        }
      })
      .catch((e) => Logging.debug("No Setup Wizard Config found"));

    this.entityMapper
      .receiveUpdates<Config<SetupWizardConfig>>(Config)
      .pipe(
        untilDestroyed(this),
        filter(({ entity }) => entity.getId() === CONFIG_SETUP_WIZARD_ID),
      )
      .subscribe((update) => this.updateStatus(update.entity.data));
  }

  private updateStatus(config: SetupWizardConfig) {
    this.showSetupWizard = !config.finished && !environment.demo_mode;
    // demo_mode is showing the wizard in the assistant dialog
  }

  navigateToWizard() {
    this.router.navigate(["/admin/setup-wizard"]);
  }
}
