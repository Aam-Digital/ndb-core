import { Component, inject, ChangeDetectionStrategy } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { environment } from "../../../../environments/environment";
import { SessionType } from "../../session/session-type";
import { LocalDeviceResetService } from "../../database/local-device-reset.service";

/**
 * UI for some basic user guide,
 * used within the AssistantDialog.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  isMockMode: boolean = environment.session_type === SessionType.mock;
  isDemoMode: boolean = environment.demo_mode;
  isUserSupportEnabled: boolean = environment.userSupportEnabled;
  isSaaS: boolean = environment.SaaS;

  private readonly localDeviceResetService = inject(LocalDeviceResetService);

  async restartDemo() {
    if (environment.session_type !== SessionType.mock) {
      await this.localDeviceResetService.resetLocalDevice();
    } else {
      window.location.href = "/";
    }
  }
}
