import { Component, inject, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { ConfigService } from "app/core/config/config.service";
import { SetupService } from "../setup.service";
import { MatTooltip } from "@angular/material/tooltip";
import { AssistantService } from "../assistant.service";

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
  private readonly configService = inject(ConfigService);
  private readonly setupService = inject(SetupService);
  protected readonly assistantService = inject(AssistantService);

  async ngOnInit() {
    await this.setupService.waitForConfigReady();
    if (!this.configService.hasConfig()) {
      // If we do not have a config yet, we open the setup dialog immediately
      // to allow the user to select a base config.
      await this.openAssistant();
    }
  }

  async openAssistant() {
    return this.assistantService.openAssistant();
  }
}
