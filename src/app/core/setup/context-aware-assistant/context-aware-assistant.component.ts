import { Component } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { environment } from "../../../../environments/environment";

/**
 * UI for some basic user guide,
 * used within the AssistantDialog.
 */
@Component({
  selector: "app-context-aware-assistant",
  imports: [MatButtonModule],
  templateUrl: "./context-aware-assistant.component.html",
  styleUrls: ["./context-aware-assistant.component.scss"],
})

/**
 * This component is used to provide context-aware assistance to users.
 * It can be used to guide users through the setup process or provide help based on the current context.
 */
export class ContextAwareAssistantComponent {
  isDemoMode: boolean = environment.demo_mode;

  public restartDemo() {
    window.location.href = "/";
  }
}
