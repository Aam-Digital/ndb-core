import { Component } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogActions, MatDialogContent } from "@angular/material/dialog";
@Component({
  selector: "app-context-aware-dialog",
  imports: [MatDialogContent, MatDialogActions, MatButtonModule],
  templateUrl: "./context-aware-dialog.component.html",
  styleUrls: [
    "./context-aware-dialog.component.scss",
    "../demo-assistance-dialog/demo-assistance-dialog.component.scss",
  ],
})

/**
 * This component is used to provide context-aware assistance to users.
 * It can be used to guide users through the setup process or provide help based on the current context.
 */
export class ContextAwareDialogComponent {
  public restartDemo() {
    window.location.href = "/";
  }
}
