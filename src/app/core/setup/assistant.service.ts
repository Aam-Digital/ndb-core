import { inject, Injectable } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { lastValueFrom } from "rxjs";
import { AssistantDialogComponent } from "./assistant-dialog/assistant-dialog.component";

/**
 * Service to manage the assistant dialog for demo, setup and user guidance.
 * Provides a centralized way to open the assistant from anywhere in the application.
 */
@Injectable({
  providedIn: "root",
})
export class AssistantService {
  static readonly ASSISTANT_DIALOG_HEIGHT = "calc(100% - 64px)";

  private readonly dialog = inject(MatDialog);
  private isDialogOpen: boolean = false;

  /**
   * Controls whether the assistant can be opened.
   * Set to false to disable the assistant globally.
   */
  assistantEnabled: boolean = true;

  /**
   * Opens the assistant dialog if it's not already open and if enabled.
   * @returns Promise that resolves with the dialog result when closed, or undefined if already open or disabled
   */
  async openAssistant(): Promise<any> {
    if (this.isDialogOpen || !this.assistantEnabled) {
      return;
    }

    this.isDialogOpen = true;

    const dialogRef: MatDialogRef<AssistantDialogComponent> = this.dialog.open(
      AssistantDialogComponent,
      {
        autoFocus: false,
        enterAnimationDuration: 0,
        exitAnimationDuration: 0,
        height: AssistantService.ASSISTANT_DIALOG_HEIGHT,
        maxWidth: "100%",
        maxHeight: "100%",
        position: { top: "0px", right: "0px" },
        backdropClass: "backdrop-below-toolbar",
        minWidth: "350px",
        width: "40vw",
      },
    );

    const result = await lastValueFrom(dialogRef.afterClosed());

    this.isDialogOpen = false;
    return result;
  }

  /**
   * Checks if the assistant dialog is currently open.
   */
  isOpen(): boolean {
    return this.isDialogOpen;
  }
}
