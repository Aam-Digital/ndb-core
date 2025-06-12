import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { environment } from "../../../../environments/environment";
import { ConfigService } from "app/core/config/config.service";
import { MatDialog } from "@angular/material/dialog";
import { ContextAwareDialogComponent } from "../context-aware-dialog/context-aware-dialog.component";
import { lastValueFrom } from "rxjs";
import { DemoAssistanceDialogComponent } from "../demo-assistance-dialog/demo-assistance-dialog.component";
import { SetupService } from "../setup.service";

/**
 * Button for the toolbar to access a context-aware assistant dialog
 * for demo, setup and other user guidance.
 */
@Component({
  selector: "app-assistant-button",
  imports: [MatButtonModule],
  templateUrl: "./assistant-button.component.html",
  styleUrl: "./assistant-button.component.scss",
})
export class AssistantButtonComponent implements OnInit, OnDestroy {
  //todo - need to remove this workaround
  private static initialized = false;
  private readonly configService = inject(ConfigService);
  private readonly setupService = inject(SetupService);
  private readonly dialog = inject(MatDialog);

  private isDialogOpen: boolean = false;

  assistantEnabled: boolean;

  async ngOnInit() {
    // if (AssistantButtonComponent.initialized) return;
    // AssistantButtonComponent.initialized = true;
    this.assistantEnabled = environment.demo_mode;
    console.log("AssistantButtonComponent init");

    await this.setupService.waitForConfigReady();
    if (!this.configService.hasConfig()) {
      // If we do not have a config yet, we open the setup dialog immediately
      // to allow the user to select a base config.
      this.openAssistant();
    }
  }

  ngOnDestroy() {
    console.log("AssistantButtonComponent destroyed");
  }

  /**
   * Opens a dialog to assist the user in setting up a demo environment.
   * Depending on the user's login state, it opens either a context-aware dialog (if logged in)
   * or a demo assistance dialog (if not logged in). The dialog guides the user through selecting
   * a use case and initializing the system with the corresponding demo data.
   * @returns A promise that resolves with the dialog result when the dialog is closed.
   */
  async openAssistant() {
    if (this.isDialogOpen || !this.assistantEnabled) {
      return;
    }

    this.isDialogOpen = true;
    const hasConfig = this.configService.hasConfig();
    const commonOptions = {
      autoFocus: false,
      height: "calc(100% - 20px)",
      maxWidth: "100%",
      maxHeight: "100%",
      position: { top: "64px", right: "0px" },
      backdropClass: "disable-backdrop",
    };
    let dialogRef;
    if (hasConfig) {
      dialogRef = this.dialog.open(ContextAwareDialogComponent, {
        ...commonOptions,
        width: "40vh",
      });
    } else {
      dialogRef = this.dialog.open(DemoAssistanceDialogComponent, {
        ...commonOptions,
        width: "calc(100% - 100px)",
        disableClose: true,
      });
    }

    const result = await lastValueFrom(dialogRef.afterClosed());
    this.isDialogOpen = false;

    return result;
  }
}
