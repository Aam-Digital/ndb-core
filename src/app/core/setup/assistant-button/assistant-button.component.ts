import { Component, inject, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { ConfigService } from "app/core/config/config.service";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { lastValueFrom } from "rxjs";
import { SetupService } from "../setup.service";
import { AssistantDialogComponent } from "../assistant-dialog/assistant-dialog.component";
import { MatTooltip } from "@angular/material/tooltip";

/**
 * Button for the toolbar to access a context-aware assistant dialog
 * for demo, setup and other user guidance.
 */
@Component({
  selector: "app-assistant-button",
  imports: [MatButtonModule, MatTooltip],
  templateUrl: "./assistant-button.component.html",
  styleUrl: "./assistant-button.component.scss",
})
export class AssistantButtonComponent implements OnInit {
  static readonly ASSISTANT_DIALOG_HEIGHT = "calc(100% - 64px)";

  private readonly configService = inject(ConfigService);
  private readonly setupService = inject(SetupService);
  private readonly dialog = inject(MatDialog);

  protected isDialogOpen: boolean = false;

  assistantEnabled: boolean = true;

  async ngOnInit() {
    await this.setupService.waitForConfigReady();
    if (!this.configService.hasConfig()) {
      // If we do not have a config yet, we open the setup dialog immediately
      // to allow the user to select a base config.
      this.openAssistant();
    }
  }

  async openAssistant() {
    if (this.isDialogOpen || !this.assistantEnabled) {
      return;
    }

    this.isDialogOpen = true;

    let dialogRef: MatDialogRef<AssistantDialogComponent>;
    dialogRef = this.dialog.open(AssistantDialogComponent, {
      autoFocus: false,
      enterAnimationDuration: 0,
      exitAnimationDuration: 0,
      height: AssistantButtonComponent.ASSISTANT_DIALOG_HEIGHT,
      maxWidth: "100%",
      maxHeight: "100%",
      position: { top: "0px", right: "0px" },
      backdropClass: "backdrop-below-toolbar",
      minWidth: "300px",
      width: "40vw",
    });

    const result = await lastValueFrom(dialogRef.afterClosed());

    this.isDialogOpen = false;
    return result;
  }
}
