import { Component, inject, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { environment } from "../../../../environments/environment";
import { LoginState } from "app/core/session/session-states/login-state.enum";
import { LoginStateSubject } from "app/core/session/session-type";
import { ConfigService } from "app/core/config/config.service";
import { MatDialog } from "@angular/material/dialog";
import { ContextAwareDialogComponent } from "../context-aware-dialog/context-aware-dialog.component";
import { lastValueFrom } from "rxjs";
import { DemoAssistanceDialogComponent } from "../demo-assistance-dialog/demo-assistance-dialog.component";

@Component({
  selector: "app-demo-assistant-button",
  imports: [MatButtonModule],
  templateUrl: "./demo-assistant-button.component.html",
  styleUrl: "./demo-assistant-button.component.scss",
})
export class DemoAssistantButtonComponent implements OnInit {
  private readonly loginState = inject(LoginStateSubject);
  private readonly configService = inject(ConfigService);
  private readonly dialog = inject(MatDialog);

  private isDialogOpen: boolean = false;

  assistantEnabled: boolean;

  ngOnInit(): void {
    this.assistantEnabled = environment.demo_mode;

    if (!this.configService.hasConfig()) {
      // If we do not have a config yet, we open the setup dialog immediately
      // to allow the user to select a base config.
      this.openDemoSetupDialog();
    }
  }

  openDemoAssistance(): void {
    this.openDemoSetupDialog();
  }

  /**
   * Opens a dialog to assist the user in setting up a demo environment.
   * Depending on the user's login state, it opens either a context-aware dialog (if logged in)
   * or a demo assistance dialog (if not logged in). The dialog guides the user through selecting
   * a use case and initializing the system with the corresponding demo data.
   * @returns A promise that resolves with the dialog result when the dialog is closed.
   */
  async openDemoSetupDialog() {
    if (this.isDialogOpen || this.loginState.value !== LoginState.LOGGED_IN) {
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
    };
    let dialogRef;
    if (hasConfig) {
      dialogRef = this.dialog.open(ContextAwareDialogComponent, {
        ...commonOptions,
        width: "40vh",
        disableClose: false,
        hasBackdrop: false,
      });
    } else {
      dialogRef = this.dialog.open(DemoAssistanceDialogComponent, {
        ...commonOptions,
        width: "calc(100% - 100px)",
        disableClose: true,
        hasBackdrop: false,
      });
    }

    const result = await lastValueFrom(dialogRef.afterClosed());
    this.isDialogOpen = false;

    return result;
  }
}
