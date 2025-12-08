import { Component, inject, OnInit } from "@angular/core";
import { ContextAwareAssistantComponent } from "../context-aware-assistant/context-aware-assistant.component";
import { MatTab, MatTabChangeEvent, MatTabGroup } from "@angular/material/tabs";
import { SystemInitAssistantComponent } from "../system-init-assistant/system-init-assistant.component";
import { ConfigService } from "../../config/config.service";
import { Config } from "../../config/config";
import {
  CONFIG_SETUP_WIZARD_ID,
  SetupWizardConfig,
} from "../../admin/setup-wizard/setup-wizard-config";
import { Logging } from "../../logging/logging.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { filter } from "rxjs/operators";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { SetupWizardComponent } from "../../admin/setup-wizard/setup-wizard.component";
import { MatDialogClose, MatDialogRef } from "@angular/material/dialog";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatIconButton } from "@angular/material/button";
import { MatMenu, MatMenuItem, MatMenuTrigger } from "@angular/material/menu";
import { Angulartics2OnModule } from "angulartics2";
import { AssistantService } from "#src/app/core/setup/assistant.service";
import { RouterLink } from "@angular/router";
import { MatTooltip } from "@angular/material/tooltip";

/**
 * The Assistant Panel shown by the AssistantButton,
 * which dynamically displays different assistant views
 * depending on the current system state.
 */
@Component({
  selector: "app-assistant-dialog",
  imports: [
    ContextAwareAssistantComponent,
    MatTabGroup,
    MatTab,
    SystemInitAssistantComponent,
    SetupWizardComponent,
    FaIconComponent,
    MatIconButton,
    MatMenuTrigger,
    Angulartics2OnModule,
    MatMenu,
    MatMenuItem,
    RouterLink,
    MatTooltip,
    MatDialogClose,
  ],
  templateUrl: "./assistant-dialog.component.html",
  styleUrl: "./assistant-dialog.component.scss",
})
@UntilDestroy()
export class AssistantDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<AssistantDialogComponent>);
  private readonly configService = inject(ConfigService);
  private readonly entityMapper = inject(EntityMapperService);

  /**
   * Lists all available assistants and whether they are enabled.
   */
  assistants = {
    initDemo: false,
    contextAwareGuide: false,
    setupWizard: false,
  };

  ngOnInit(): void {
    this.detectAssistantModes();
  }

  private detectAssistantModes() {
    if (!this.configService.hasConfig()) {
      this.assistants.initDemo = true;
    } else {
      this.assistants.initDemo = false;
      this.assistants.contextAwareGuide = true;
      this.checkIfSetupWizardEnabled();
    }
  }

  private checkIfSetupWizardEnabled() {
    this.entityMapper
      .load(Config, CONFIG_SETUP_WIZARD_ID)
      .then((r: Config<SetupWizardConfig>) => {
        this.assistants.setupWizard = !r.data.finished;
      })
      .catch((e) => Logging.debug("No Setup Wizard Config found"));

    this.entityMapper
      .receiveUpdates<Config<SetupWizardConfig>>(Config)
      .pipe(
        untilDestroyed(this),
        filter(({ entity }) => entity.getId() === CONFIG_SETUP_WIZARD_ID),
      )
      .subscribe(
        (update) =>
          (this.assistants.setupWizard = !update.entity.data.finished),
      );
  }

  onTabChange(event: MatTabChangeEvent) {
    if (event.tab.id === "setupWizard") {
      this.setDialogFullscreen();
    }
    if (event.tab.id === "initDemo") {
      this.setDialogFullscreen();
    }
  }

  private setDialogFullscreen() {
    this.dialogRef.updateSize(
      "calc(100% - 100px)",
      AssistantService.ASSISTANT_DIALOG_HEIGHT,
    );
  }

  updateSetupWizardVisible(newState: boolean) {
    this.assistants.setupWizard = newState;
    // TODO: save this to SetupWizard Config
  }
}
