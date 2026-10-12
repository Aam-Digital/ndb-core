import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
  computed,
  signal,
} from "@angular/core";
import { ContextAwareAssistantComponent } from "../context-aware-assistant/context-aware-assistant.component";
import { MatTab, MatTabChangeEvent, MatTabGroup } from "@angular/material/tabs";
import { SystemInitAssistantComponent } from "../system-init-assistant/system-init-assistant.component";
import { ConfigService } from "../../config/config.service";
import { SetupWizardComponent } from "../../admin/setup-wizard/setup-wizard.component";
import { SetupWizardService } from "../../admin/setup-wizard/setup-wizard.service";
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class AssistantDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<AssistantDialogComponent>);
  private readonly configService = inject(ConfigService);
  private readonly setupWizardService = inject(SetupWizardService);

  /**
   * Lists all available assistants and whether they are enabled.
   */
  assistants = {
    initDemo: false,
    contextAwareGuide: false,
  };

  /** user's manual override of the setup wizard tab's default visibility */
  private readonly manuallyVisible = signal<boolean | undefined>(undefined);

  protected readonly showSetupWizard = computed(() => {
    switch (this.setupWizardService.state()) {
      case "loaded":
        return this.manuallyVisible() ?? this.setupWizardService.isPending();
      case "error":
        return true;
      default:
        // hide it while still loading or if this system has no wizard at all
        return false;
    }
  });

  protected readonly canToggleSetupWizard = this.setupWizardService.exists;

  ngOnInit(): void {
    this.detectAssistantModes();
  }

  private detectAssistantModes() {
    if (!this.configService.hasConfig()) {
      this.assistants.initDemo = true;
    } else {
      this.assistants.initDemo = false;
      this.assistants.contextAwareGuide = true;
    }
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

  toggleSetupWizardVisible() {
    this.manuallyVisible.set(!this.showSetupWizard());
    // TODO: save this to SetupWizard Config
  }
}
